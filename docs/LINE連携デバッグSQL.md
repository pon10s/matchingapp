# LINE連携デバッグ用SQL

## 1. テーブル存在確認

```sql
-- line_connection_codesテーブルの確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'line_connection_codes'
);

-- user_settingsテーブルの確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_settings'
);
```

## 2. user_settingsテーブルの構造確認

```sql
-- カラム一覧を確認（line_user_idがあるか）
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_settings';
```

**重要**: `line_user_id` カラムが存在しない場合、追加が必要です。

## 3. line_user_idカラムの追加（必要な場合）

```sql
-- user_settingsテーブルにline_user_idカラムを追加
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_user_settings_line_user_id 
ON user_settings(line_user_id);
```

## 4. 連携コードの確認

```sql
-- 最近作成された連携コード
SELECT * FROM line_connection_codes 
ORDER BY created_at DESC 
LIMIT 5;
```

## 5. user_settingsの現在の状態

```sql
-- 現在のuser_settings
SELECT 
  user_id,
  line_user_id,
  line_notify_enabled,
  created_at,
  updated_at
FROM user_settings;
```

## 6. RLSポリシーの確認

```sql
-- user_settingsのRLSポリシー
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_settings';
```

## 7. Service Roleでの更新テスト

Supabase Functionが正しく動作するか、手動でテスト：

```sql
-- テスト用の連携コード作成
INSERT INTO line_connection_codes (user_id, code)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'あなたのメール'),
  'TEST01'
);

-- 手動で連携を完了
UPDATE user_settings
SET 
  line_user_id = 'U1234567890abcdef',
  line_notify_enabled = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'あなたのメール');

-- 確認
SELECT * FROM user_settings 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'あなたのメール');
```

## トラブルシューティング

### ケース1: line_user_idカラムが存在しない
→ 上記の「3. line_user_idカラムの追加」を実行

### ケース2: 連携コードが保存されていない
→ account.jsの連携ボタンが正しく動作していない
→ ブラウザのコンソールでエラー確認

### ケース3: Webhookでエラーが発生している
→ Supabase Functions Logsで詳細なエラーメッセージを確認
→ 特に「PGRST」エラーはRLS関連の問題

### ケース4: upsertが失敗している
→ user_settingsにレコードが存在しない場合、INSERTが必要
→ RLSポリシーでService Roleがブロックされている可能性
