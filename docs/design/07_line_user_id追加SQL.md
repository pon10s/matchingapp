-- user_settingsテーブルにline_user_idカラムを追加

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS line_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_settings_line_user_id ON user_settings(line_user_id);

COMMENT ON COLUMN user_settings.line_user_id IS 'LINEユーザーID（Messaging API用）';
