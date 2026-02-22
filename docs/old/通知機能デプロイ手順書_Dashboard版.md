# 通知機能デプロイ手順書（Dashboard版）

## 1. notification_logsテーブルの作成

### 1.1 Supabase SQL Editorで実行
1. Supabase Dashboard → SQL Editor を開く
2. 以下のSQLを実行:

```sql
-- notification_logsテーブル作成
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_profile_id ON notification_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);

-- RLS設定
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON notification_logs;
CREATE POLICY "Users can view own logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all logs" ON notification_logs;
CREATE POLICY "Service role can manage all logs" ON notification_logs
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE notification_logs IS '通知送信ログ';
COMMENT ON COLUMN notification_logs.notification_type IS '通知タイプ: upcoming_date, pending_comment, status_change_reminder';
```

---

## 2. Edge Functionのデプロイ（Dashboard経由）

### 2.1 Edge Functions画面を開く
1. Supabase Dashboard → Edge Functions を開く
2. 「Create a new function」をクリック

### 2.2 関数の作成
- Function name: `send-daily-notifications`
- 「Create function」をクリック

### 2.3 コードの貼り付け
`supabase/functions/send-daily-notifications/index.ts` の内容をコピーして貼り付け

### 2.4 デプロイ
「Deploy」ボタンをクリック

---

## 3. Cronジョブの設定

### 3.1 pg_cron拡張の有効化
SQL Editorで実行:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 3.2 Cronジョブの作成
SQL Editorで以下を実行:

```sql
SELECT cron.schedule(
  'daily-notifications',
  '0 11 * * *', -- 日本時間20:00 = UTC 11:00
  $$
  SELECT
    net.http_post(
      url:='https://wpagpmjjgwsnowvnhmml.supabase.co/functions/v1/send-daily-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYWdwbWpqZ3dzbm93dm5obW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MjI5NzcsImV4cCI6MjA1MTI5ODk3N30.sb_publishable_-e8W4jFQ-TB9KraQBA_OTw_moXmZGEz"}'::jsonb
    ) as request_id;
  $$
);
```

---

## 4. 手動テスト

### 4.1 テストユーザーの準備
```sql
-- テストユーザーのuser_settings作成
INSERT INTO user_settings (user_id, line_notify_token, line_notify_enabled)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'YOUR_LINE_NOTIFY_TOKEN',
  true
)
ON CONFLICT (user_id) DO UPDATE 
SET line_notify_token = 'YOUR_LINE_NOTIFY_TOKEN',
    line_notify_enabled = true;

-- 明日のテストイベント作成
INSERT INTO events (user_id, profile_id, event_date)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  p.id,
  CURRENT_DATE + INTERVAL '1 day'
FROM profiles p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
LIMIT 1;
```

### 4.2 Edge Functionの手動実行
Edge Functions画面で「Invoke」ボタンをクリック、またはcurlで実行:

```bash
curl -X POST \
  https://wpagpmjjgwsnowvnhmml.supabase.co/functions/v1/send-daily-notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYWdwbWpqZ3dzbm93dm5obW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MjI5NzcsImV4cCI6MjA1MTI5ODk3N30.sb_publishable_-e8W4jFQ-TB9KraQBA_OTw_moXmZGEz" \
  -H "Content-Type: application/json"
```

### 4.3 LINEに通知が届くか確認

---

## 5. 通知ログの確認

### 5.1 送信履歴の確認
```sql
SELECT 
  nl.notification_type,
  nl.sent_at,
  p.name as profile_name,
  u.email as user_email
FROM notification_logs nl
LEFT JOIN profiles p ON nl.profile_id = p.id
LEFT JOIN auth.users u ON nl.user_id = u.id
ORDER BY nl.sent_at DESC
LIMIT 20;
```

### 5.2 Cronジョブの実行履歴確認
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 6. トラブルシューティング

### 6.1 Edge Functionが実行されない
**確認項目:**
- Edge Functionsページで「Status: Active」になっているか
- Cronジョブが正しく設定されているか

**確認方法:**
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-notifications';
```

### 6.2 LINE通知が届かない
**確認項目:**
- line_notify_tokenが正しいか
- line_notify_enabledがtrueか
- LINE Notifyのトークンが有効か

**確認方法:**
```sql
SELECT user_id, line_notify_enabled, 
       CASE WHEN line_notify_token IS NULL THEN 'NULL' ELSE 'SET' END as token_status
FROM user_settings;
```

### 6.3 Cronジョブを削除したい
```sql
SELECT cron.unschedule('daily-notifications');
```

---

## 7. 運用

### 7.1 通知時刻の変更
Cronジョブを再作成:
```sql
-- 既存のジョブを削除
SELECT cron.unschedule('daily-notifications');

-- 新しい時刻で作成（例: 日本時間21:00 = UTC 12:00）
SELECT cron.schedule(
  'daily-notifications',
  '0 12 * * *',
  $$ ... $$
);
```

### 7.2 ログのクリーンアップ
```sql
-- 30日以上前のログを削除
DELETE FROM notification_logs
WHERE sent_at < CURRENT_DATE - INTERVAL '30 days';
```

---

## 8. 参考リンク

- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Cron: https://supabase.com/docs/guides/database/extensions/pg_cron
- LINE Notify API: https://notify-bot.line.me/doc/ja/
