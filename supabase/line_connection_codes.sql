-- LINE連携用のワンタイムコードテーブル

CREATE TABLE IF NOT EXISTS line_connection_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  expires_at TIMESTAMP NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_line_connection_codes_code ON line_connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_line_connection_codes_user_id ON line_connection_codes(user_id);

-- RLS設定
ALTER TABLE line_connection_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own codes" ON line_connection_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own codes" ON line_connection_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own codes" ON line_connection_codes
  FOR DELETE USING (auth.uid() = user_id);
