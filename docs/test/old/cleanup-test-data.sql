-- テストデータクリーンアップ（テスト前に実行）

-- LINE連携をクリア
UPDATE user_settings 
SET line_user_id = NULL, line_notify_enabled = false
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- 使用済みコードを削除
DELETE FROM line_connection_codes 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
