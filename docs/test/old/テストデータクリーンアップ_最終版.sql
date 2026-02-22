-- テストデータのクリーンアップ
-- test@example.comユーザーのテスト用データを削除

-- 1. 通知ログの削除
DELETE FROM notification_logs 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- 2. テスト用イベントの削除（明日・昨日のイベント）
DELETE FROM events 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND (
    event_date IN (CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day')
    OR comment = '楽しかった'
  );

-- 3. テスト用プロフィールの削除
DELETE FROM profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND name IN ('山田花子', '佐藤美咲', '鈴木愛', '田中さくら', '中村あゆみ');

-- 4. プロフィールのupdated_atを現在時刻に戻す
UPDATE profiles
SET updated_at = CURRENT_TIMESTAMP
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- 確認用クエリ
SELECT 
  'profiles' as table_name,
  COUNT(*) as count
FROM profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
UNION ALL
SELECT 
  'events' as table_name,
  COUNT(*) as count
FROM events 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
UNION ALL
SELECT 
  'notification_logs' as table_name,
  COUNT(*) as count
FROM notification_logs 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
