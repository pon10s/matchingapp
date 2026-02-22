# マッチングアプリ管理システム

マッチングアプリで出会った相手を管理し、デート予定やステータスを記録できるWebアプリケーションです。

## 主な機能

### 基本機能
- **プロフィール管理**: 相手の情報（名前、年齢、アプリ、ステータス等）を記録
- **イベント管理**: デート予定や過去のデート記録を管理
- **カレンダー表示**: デート予定を視覚的に確認
- **グラフ表示**: ステータス別、月別、アプリ別の統計をグラフで表示
- **画像アップロード**: プロフィール写真のアップロード・トリミング機能

### LINE通知機能 🆕
- **明日のデート予定通知**: デート前日に自動通知
- **感想記録リマインダー**: デート翌日に未記録の場合に通知
- **ステータス見直し通知**: 15日間更新がない場合に通知（15日間隔で再通知）

### AI機能
- **Gemini AIアドバイス**: プロフィールデータを分析してアドバイスを提供

## 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript
- **バックエンド**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
- **通知**: LINE Messaging API
- **AI**: Google Gemini API
- **グラフ**: Chart.js
- **画像処理**: Cropper.js
- **テスト**: Playwright

## セットアップ

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. データベーステーブルを作成（`docs/design/02_基本設計書.md`参照）
3. RLSポリシーを設定

### 2. LINE Messaging API設定

1. [LINE Developers](https://developers.line.biz/)でMessaging APIチャネルを作成
2. Channel Access Tokenを取得
3. Webhook URLを設定: `https://YOUR_PROJECT.supabase.co/functions/v1/line-webhook`
4. Supabase SecretsにLINE_CHANNEL_ACCESS_TOKENを設定

### 3. Edge Functions デプロイ

```bash
# Supabase CLIインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref YOUR_PROJECT_REF

# Edge Functionsをデプロイ
supabase functions deploy send-daily-notifications
supabase functions deploy line-webhook
```

### 4. 環境変数設定

`config.js`を作成（`config.example.js`を参考）:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
```

### 5. Cron設定（オプション）

毎日自動でLINE通知を送信する場合は、`docs/Cron設定手順書.md`を参照してください。

## 使い方

### LINE連携

1. アカウント管理画面で「連携する」をクリック
2. LINEアプリが開くので、メッセージを送信
3. 連携完了

### 通知設定

- アカウント管理画面で通知のON/OFFを切り替え可能
- 通知時刻は20:00（JST）固定

## 開発

### ローカル環境

```bash
# Live Serverで起動
# または
npx http-server -p 5500
```

### テスト実行

```bash
# 全テスト実行
npm test

# 特定のテストのみ
npx playwright test home.spec.ts

# UIモード
npx playwright test --ui
```

## ディレクトリ構造

```
tenkai/
├── docs/                    # ドキュメント
│   ├── design/             # 設計書
│   ├── test/               # テスト関連
│   └── *.md                # 各種手順書
├── supabase/
│   └── functions/          # Edge Functions
│       ├── send-daily-notifications/
│       ├── line-webhook/
│       └── line-test-message/
├── tests/                  # Playwrightテスト
├── *.html                  # HTMLファイル
├── *.js                    # JavaScriptファイル
└── *.css                   # スタイルシート
```

## ライセンス

MIT License

## 作者

pon10083
