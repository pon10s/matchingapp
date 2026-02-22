# 通知機能テスト用SQL（コピペ用）

## ステップ1: LINEユーザーIDを取得

### 方法: LINE公式アカウントにメッセージを送信してログから取得

1. **LINE公式アカウントを友だち追加**
   - QRコードまたはLINE IDで追加

2. **何かメッセージを送信**
   - 例: 「テスト」

3. **Supabase Dashboardでログを確認**
   - Edge Functions → line-webhook → Logs
   - 最新のログに `"userId": "U..."` という形式でIDが記録されています
   - このIDをコピー

---

## ステップ2: 以下のSQLを実行

**重要**: `YOUR_LINE_USER_ID` を上記で取得したIDに置き換えてください

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

## ステップ3: Edge Functionを実行

1. Dashboard → Edge Functions → send-daily-notifications
2. 「RUN」ボタンをクリック

---

## 期待される結果

LINEに以下の通知が届きます:
- `📅 明日は山田花子さんとのデートです！楽しんできてください✨`
- `📝 佐藤美咲さんとのデートの感想を記録しましょう！`

---

## 確認SQL

```sql
-- 設定確認
SELECT line_user_id, line_notify_enabled
FROM user_settings
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- 通知ログ確認
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

## LINEユーザーIDの例

正しい形式: `U1234567890abcdef1234567890abcdef`
- 必ず `U` で始まる
- 33文字の英数字

---

## トラブルシューティング

### LINEユーザーIDが見つからない場合

line-webhookのEdge Functionが正しくデプロイされているか確認:
```
Dashboard → Edge Functions → line-webhook → Status: Active
```

### 手動でテスト送信

PowerShellで実行（YOUR_LINE_USER_IDを置き換え）:
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
