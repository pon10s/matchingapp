// 環境変数設定
// 本番環境では環境変数から読み込み、開発環境ではここに直接記載

const CONFIG = {
  // Gemini API Key（運営者のキー）
  GEMINI_API_KEY: 'AIzaSyAPOK14NglFc29hLxLjpS4zhaUGTquIgB4',
  
  // LINE Messaging API（運営者のキー）
  LINE_CHANNEL_ACCESS_TOKEN: 'ZQTsgXJM26BSUqe/cBtorzwQEAJMu0Q5yZWUEYy7o/Ux7L1p0Orjc0J+/s2QipNuUdbxkHyNoKPyZUaF9bbkfggktUAgXhjy/PG06tHH794k0hEO25WZVGToza2HqSQ8OGlk+w0wKdIny1gjYNVdvwdB04t89/1O/w1cDnyilFU=',
  LINE_CHANNEL_SECRET: '03823220e0d7e3d8b1fe21a4450c5153',
  LINE_CHANNEL_ID: '2009193454',
  
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
