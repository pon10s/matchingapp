# Supabase Edge Function デプロイ手順

## 問題
LINE連携が動作しない原因：Supabase Edge Functionがデプロイされていない

## 解決方法

### 1. Supabase CLIのインストール

```bash
npm install -g supabase
```

### 2. Supabaseにログイン

```bash
supabase login
```

ブラウザが開くので、Supabaseアカウントでログイン

### 3. プロジェクトにリンク

```bash
cd c:\Users\pon10\OneDrive\デスクトップ\tenkai
supabase link --project-ref wpagpmjjgwsnowvnhmml
```

### 4. Edge Functionをデプロイ

```bash
supabase functions deploy line-webhook
```

### 5. 環境変数を設定

```bash
# LINE Channel Access Token
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=<あなたのトークン>

# LINE Channel Secret
supabase secrets set LINE_CHANNEL_SECRET=<あなたのシークレット>
```

### 6. 動作確認

1. LINE Developersで「検証」ボタンをクリック
2. 「成功」と表示されることを確認
3. LINEでBotにメッセージを送信
4. 返信が来ることを確認

## 環境変数の取得方法

### LINE_CHANNEL_ACCESS_TOKEN
1. LINE Developers Console を開く
2. チャネルを選択
3. Messaging API設定タブ
4. 「チャネルアクセストークン」をコピー

### LINE_CHANNEL_SECRET
1. LINE Developers Console を開く
2. チャネルを選択
3. Basic settings タブ
4. 「Channel secret」をコピー

## トラブルシューティング

### デプロイが失敗する
```bash
# ログを確認
supabase functions logs line-webhook

# 再デプロイ
supabase functions deploy line-webhook --no-verify-jwt
```

### 環境変数が反映されない
```bash
# 環境変数を確認
supabase secrets list

# 再設定
supabase secrets unset LINE_CHANNEL_ACCESS_TOKEN
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=<新しいトークン>
```

## 完了後の確認

✅ `supabase functions list` でline-webhookが表示される
✅ LINE Developersの「検証」が成功する
✅ LINEでメッセージを送ると返信が来る
✅ 連携コードを送ると連携完了メッセージが来る
