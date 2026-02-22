# LINE通知機能テスト手順

## 前提条件
- testアカウントでLINE連携済み
- user_settingsテーブルにline_user_idが保存されている

## 1. テストデータの準備

SupabaseのSQL Editorで以下を実行：

```sql
-- testアカウントの状態確認
SELECT 
  u.email,
  us.line_user_id,
  us.line_notify_enabled,
  us.notification_time
FROM auth.users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE u.email = 'test@example.com';

-- 通知テスト用データ投入
-- 1. 明日のデート予定（upcoming_date通知）
INSERT INTO events (user_id, profile_id, event_date, comment)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  p.id,
  CURRENT_DATE + INTERVAL '1 day',
  NULL
FROM profiles p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
LIMIT 1;

-- 2. 昨日の未コメントイベント（pending_comment通知）
INSERT INTO events (user_id, profile_id, event_date, comment)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  p.id,
  CURRENT_DATE - INTERVAL '1 day',
  NULL
FROM profiles p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
LIMIT 1;

-- 3. 15日以上更新なしのプロフィール（status_change_reminder通知）
UPDATE profiles
SET updated_at = CURRENT_DATE - INTERVAL '16 days'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND status != '終了'
LIMIT 1;
```

## 2. Edge Functionのテスト（Supabase Dashboard）

### 方法1: Dashboardから直接実行

1. Supabase Dashboard → Edge Functions → `send-daily-notifications`
2. 「Test」タブをクリック
3. 以下の設定で実行：
   - **HTTP Method**: POST
   - **Request Body**: `{}` (空のJSONオブジェクト)
   - **Role**: service_role
4. 「Send Request」をクリック

### 期待される結果

```json
{
  "success": true,
  "totalSent": 3,
  "results": [
    {
      "user_id": "730d43e7-d175-4610-ac3b-930acd8a8b5f",
      "type": "upcoming_date",
      "status": "success"
    },
    {
      "user_id": "730d43e7-d175-4610-ac3b-930acd8a8b5f",
      "type": "pending_comment",
      "status": "success"
    },
    {
      "user_id": "730d43e7-d175-4610-ac3b-930acd8a8b5f",
      "type": "status_change_reminder",
      "status": "success"
    }
  ]
}
```

### エラーが出る場合

#### エラー1: `dns error: failed to lookup address information`
→ **原因**: 古いコードがデプロイされている（LINE Notify APIを使っている）
→ **解決**: Edge Functionを再デプロイ

```bash
cd c:\Users\pon10\OneDrive\デスクトップ\tenkai
supabase functions deploy send-daily-notifications
```

#### エラー2: `Invalid reply token`
→ **原因**: LINE Messaging APIのトークンが間違っている
→ **解決**: Supabase Dashboard → Settings → Secrets で `LINE_CHANNEL_ACCESS_TOKEN` を確認

#### エラー3: `line_user_id is null`
→ **原因**: LINE連携が完了していない
→ **解決**: アカウント管理画面で再度LINE連携

## 3. 通知ログの確認

```sql
-- 送信された通知を確認
SELECT 
  nl.*,
  p.name as profile_name,
  u.email
FROM notification_logs nl
JOIN profiles p ON nl.profile_id = p.id
JOIN auth.users u ON nl.user_id = u.id
WHERE u.email = 'test@example.com'
ORDER BY nl.created_at DESC;
```

## 4. LINEアプリで確認

testアカウントで連携したLINEアプリを開いて、以下のメッセージが届いているか確認：

- 📅 明日は○○さんとのデートです！楽しんできてください✨
- 📝 ○○さんとのデートの感想を記録しましょう！
- 💭 ○○さんのステータスを見直してみませんか？

## 5. テストデータのクリーンアップ

```sql
-- テスト用イベントを削除
DELETE FROM events 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND event_date IN (CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day');

-- プロフィールのupdated_atを元に戻す
UPDATE profiles
SET updated_at = CURRENT_TIMESTAMP
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- 通知ログを削除（オプション）
DELETE FROM notification_logs
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

## トラブルシューティング

### Q: 通知が届かない
A: 以下を確認：
1. user_settings.line_notify_enabled = true
2. user_settings.line_user_id が設定されている
3. LINE Messaging APIのトークンが正しい
4. Edge Functionのログを確認

### Q: エラーログの確認方法
A: Supabase Dashboard → Edge Functions → send-daily-notifications → Logs

### Q: 手動で通知を送信したい
A: account.jsに「テスト通知」ボタンを追加するか、Dashboardから直接実行
