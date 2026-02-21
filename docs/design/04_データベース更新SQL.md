# データベース更新SQL

## Supabase SQL Editorで実行するSQL

以下のSQLをSupabaseのSQL Editorで順番に実行してください。

### 1. profilesテーブルの更新

```sql
-- 終了理由フィールド追加
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS end_reason_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS end_reason_detail TEXT;

-- 年収を選択式に変更（既存データは手動で変換が必要）
ALTER TABLE profiles 
  ALTER COLUMN income TYPE VARCHAR(20);
```

### 2. user_settingsテーブルの作成

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  line_notify_token TEXT,
  line_notify_enabled BOOLEAN NOT NULL DEFAULT false,
  gemini_api_key TEXT,
  gemini_enabled BOOLEAN NOT NULL DEFAULT false,
  notification_time TIME NOT NULL DEFAULT '20:00:00',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
```

### 3. notification_logsテーブルの作成

```sql
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_profile 
  ON notification_logs(user_id, profile_id, notification_type);
```

### 4. RLSポリシーの設定

```sql
-- user_settingsテーブル
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- notification_logsテーブル
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON notification_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 実行完了後の確認

以下のSQLで正しく作成されたか確認してください：

```sql
-- テーブル一覧確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- カラム確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'user_settings', 'notification_logs')
ORDER BY table_name, ordinal_position;
```
