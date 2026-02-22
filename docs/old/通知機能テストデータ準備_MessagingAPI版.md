# 通知機能テストデータ準備（LINE Messaging API版）

## 前提条件
- LINE Messaging APIのチャンネルが既に作成済み
- config.jsに以下の情報が設定済み:
  - LINE_CHANNEL_ACCESS_TOKEN
  - LINE_CHANNEL_SECRET
  - LINE_CHANNEL_ID

---

## 1. user_settingsテーブルにline_user_idカラムを追加

SQL Editorで実行:

```sql
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS line_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_user_settings_line_user_id ON user_settings(line_user_id);
```

---

## 2. LINEユーザーIDの取得

### 方法1: LINE公式アカウントに友だち追加してメッセージ送信
1. LINE公式アカウントを友だち追加
2. 何かメッセージを送信
3. Supabase Dashboard → Edge Functions → line-webhook → Logs でユーザーIDを確認

### 方法2: 既存のline_connection_codesテーブルから取得
```sql
SELECT line_user_id FROM line_connection_codes 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
ORDER BY created_at DESC LIMIT 1;
```

---

## 3. テストデータ準備SQL

以下のSQLを実行（`YOUR_LINE_USER_ID`を実際のIDに置き換え）:

```sql
-- 1. LINE通知を有効化
INSERT INTO user_settings (user_id, line_user_id, line_notify_enabled)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'YOUR_LINE_USER_ID',
  true
)
ON CONFLICT (user_id) DO UPDATE 
SET line_user_id = 'YOUR_LINE_USER_ID',
    line_notify_enabled = true;

-- 2. 明日のデート予定を作成
INSERT INTO events (user_id, profile_id, event_date)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  p.id,
  CURRENT_DATE + INTERVAL '1 day'
FROM profiles p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND p.name = '山田花子'
LIMIT 1;

-- 3. 昨日の未更新イベントを作成
INSERT INTO events (user_id, profile_id, event_date, comment)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  p.id,
  CURRENT_DATE - INTERVAL '1 day',
  NULL
FROM profiles p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND p.name = '佐藤美咲'
LIMIT 1;
```

---

## 4. Edge Functionのコード更新

Supabase Dashboard → Edge Functions → send-daily-notifications

`supabase/functions/send-daily-notifications/index.ts` の内容を貼り付けてDeploy

---

## 5. 実行とテスト

### Edge Functionを実行
Dashboard → Edge Functions → send-daily-notifications → RUN

### 期待される結果
LINEに以下の通知が届きます:
- `📅 明日は山田花子さんとのデートです！楽しんできてください✨`
- `📝 佐藤美咲さんとのデートの感想を記録しましょう！`

### ログ確認
```sql
SELECT 
  nl.notification_type,
  nl.sent_at,
  p.name as profile_name
FROM notification_logs nl
LEFT JOIN profiles p ON nl.profile_id = p.id
ORDER BY nl.sent_at DESC
LIMIT 10;
```

---

## トラブルシューティング

### LINEに通知が届かない場合

1. **line_user_idが正しいか確認**
```sql
SELECT line_user_id, line_notify_enabled
FROM user_settings
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

2. **LINE Messaging APIのトークンをテスト**
PowerShellで実行:
```powershell
$body = @{
  to = "YOUR_LINE_USER_ID"
  messages = @(
    @{
      type = "text"
      text = "テスト通知"
    }
  )
} | ConvertTo-Json -Depth 3

curl -X POST https://api.line.me/v2/bot/message/push -H "Authorization: Bearer ZQTsgXJM26BSUqe/cBtorzwQEAJMu0Q5yZWUEYy7o/Ux7L1p0Orjc0J+/s2QipNuUdbxkHyNoKPyZUaF9bbkfggktUAgXhjy/PG06tHH794k0hEO25WZVGToza2HqSQ8OGlk+w0wKdIny1gjYNVdvwdB04t89/1O/w1cDnyilFU=" -H "Content-Type: application/json" -d $body
```

3. **Edge Functionのログを確認**
Dashboard → Edge Functions → send-daily-notifications → Logs

---

## クリーンアップ

```sql
-- テストイベントを削除
DELETE FROM events 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND event_date >= CURRENT_DATE - INTERVAL '2 days';

-- LINE通知を無効化
UPDATE user_settings
SET line_notify_enabled = false
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```
