// 環境変数設定
// 本番環境では環境変数から読み込み、開発環境ではここに直接記載

const CONFIG = {
  // Gemini API Key（運営者のキー）
  // ここにあなたのAPIキーを貼り付けてください
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
  
  // LINE Messaging API（運営者のキー）
  LINE_CHANNEL_ACCESS_TOKEN: 'YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE',  // ← チャネルアクセストークンを貼り付け
  LINE_CHANNEL_SECRET: 'YOUR_LINE_CHANNEL_SECRET_HERE',
  LINE_CHANNEL_ID: 'YOUR_LINE_CHANNEL_ID_HERE',
  
  // その他の設定
  APP_NAME: 'マッチングアプリ管理システム',
  VERSION: '1.0.0'
};

// 環境変数が設定されている場合は上書き
if (typeof process !== 'undefined' && process.env) {
  if (process.env.GEMINI_API_KEY) {
    CONFIG.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  }
}
