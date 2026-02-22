-- テストデータ投入SQL
-- Supabase SQL Editorで実行してください

-- 1. test@example.comユーザーのUIDを取得（既存ユーザーの場合）
-- まず、test@example.comでログインしてユーザーを作成しておく必要があります

-- 2. プロフィールデータ投入
-- ※user_idは実際のtest@example.comのUUIDに置き換えてください
-- SELECT id FROM auth.users WHERE email = 'test@example.com'; で確認

INSERT INTO profiles (user_id, name, age, status, app, income, summary, created_at, updated_at)
VALUES
  -- 本命
  ((SELECT id FROM auth.users WHERE email = 'test@example.com'), '山田花子', 28, '本命', 'Pairs', '500〜700万', '明るくて優しい人', NOW(), NOW()),
  -- あり
  ((SELECT id FROM auth.users WHERE email = 'test@example.com'), '佐藤美咲', 25, 'あり', 'Omiai', '300〜500万', '趣味が合う', NOW(), NOW()),
  -- 終了
  ((SELECT id FROM auth.users WHERE email = 'test@example.com'), '鈴木愛', 30, '終了', 'Tinder', '200〜300万', '合わなかった', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days');

-- 3. イベントデータ投入（オプション）
INSERT INTO events (user_id, profile_id, event_date, comment, created_at, updated_at)
VALUES
  -- 山田花子とのデート
  (
    (SELECT id FROM auth.users WHERE email = 'test@example.com'),
    (SELECT id FROM profiles WHERE name = '山田花子' AND user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com') LIMIT 1),
    CURRENT_DATE - INTERVAL '5 days',
    '楽しかった',
    NOW(),
    NOW()
  ),
  -- 佐藤美咲とのデート（未更新）
  (
    (SELECT id FROM auth.users WHERE email = 'test@example.com'),
    (SELECT id FROM profiles WHERE name = '佐藤美咲' AND user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com') LIMIT 1),
    CURRENT_DATE - INTERVAL '2 days',
    NULL,
    NOW(),
    NOW()
  );

-- 確認用クエリ
SELECT 
  p.name,
  p.age,
  p.status,
  p.app,
  COUNT(e.id) as event_count
FROM profiles p
LEFT JOIN events e ON p.id = e.profile_id
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
GROUP BY p.id, p.name, p.age, p.status, p.app
ORDER BY 
  CASE p.status
    WHEN '本命' THEN 1
    WHEN 'あり' THEN 2
    WHEN 'わからない' THEN 3
    WHEN 'ビミョウ' THEN 4
    WHEN '大人の関係' THEN 5
    WHEN '友達' THEN 6
    WHEN '終了' THEN 7
  END;
