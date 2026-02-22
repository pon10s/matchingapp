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

CREATE POLICY "Users can view own logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all logs" ON notification_logs
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE notification_logs IS '通知送信ログ';
COMMENT ON COLUMN notification_logs.notification_type IS '通知タイプ: upcoming_date, pending_comment, status_change_reminder';
