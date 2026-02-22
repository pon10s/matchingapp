-- テストデータのクリーンアップ
-- test@example.comユーザーのデータを全て削除して、テスト用データのみを再投入

-- 1. 既存データの削除
DELETE FROM events 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

DELETE FROM profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

DELETE FROM user_settings 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- 2. テスト用プロフィールの投入（3件のみ）
INSERT INTO profiles (user_id, name, age, status, app, income, summary)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'test@example.com'), '山田花子', 28, '本命', 'Pairs', '500〜700万', '明るくて優しい人'),
  ((SELECT id FROM auth.users WHERE email = 'test@example.com'), '佐藤美咲', 25, 'あり', 'Omiai', '300〜500万', '趣味が合う'),
  ((SELECT id FROM auth.users WHERE email = 'test@example.com'), '鈴木愛', 30, '終了', 'Tinder', NULL, NULL);

-- 3. テスト用イベントの投入（2件のみ）
INSERT INTO events (user_id, profile_id, event_date, comment)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  p.id,
  '2026-03-01',
  '楽しかった'
FROM profiles p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND p.name = '山田花子'
LIMIT 1;

INSERT INTO events (user_id, profile_id, event_date, comment)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  p.id,
  '2026-02-15',
  NULL
FROM profiles p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  AND p.name = '佐藤美咲'
LIMIT 1;

-- 4. テスト用user_settings（LINE未連携）
INSERT INTO user_settings (user_id, line_notify_enabled, gemini_enabled)
VALUES ((SELECT id FROM auth.users WHERE email = 'test@example.com'), false, false)
ON CONFLICT (user_id) DO UPDATE SET line_notify_enabled = false, gemini_enabled = false;
