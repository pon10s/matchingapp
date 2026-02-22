# GitHub Pages デプロイ手順書

## 1. 事前準備

### 1.1 必要なもの
- GitHubアカウント
- Gemini APIキー
- LINE Messaging API設定（Channel Access Token, Channel Secret, Channel ID）

### 1.2 APIキーの取得

#### Gemini APIキー
1. https://aistudio.google.com/apikey にアクセス
2. 「Create API Key」をクリック
3. APIキーをコピー（後で使用）

#### LINE Messaging API
1. LINE Developersコンソールにアクセス
2. チャンネルを作成
3. 以下の情報を取得:
   - Channel Access Token
   - Channel Secret
   - Channel ID

---

## 2. GitHub Secretsの設定

### 2.1 リポジトリのSettings画面を開く
1. GitHubリポジトリ（https://github.com/pon10s/matchingapp）を開く
2. 上部の「Settings」タブをクリック
3. 左サイドバーの「Secrets and variables」→「Actions」をクリック

### 2.2 Secretsを追加
「New repository secret」ボタンをクリックして、以下の4つを1つずつ追加:

#### 1. GEMINI_API_KEY
- Name: `GEMINI_API_KEY`
- Secret: Gemini APIキーを貼り付け
- 「Add secret」をクリック

#### 2. LINE_CHANNEL_ACCESS_TOKEN
- Name: `LINE_CHANNEL_ACCESS_TOKEN`
- Secret: LINE Channel Access Tokenを貼り付け
- 「Add secret」をクリック

#### 3. LINE_CHANNEL_SECRET
- Name: `LINE_CHANNEL_SECRET`
- Secret: LINE Channel Secretを貼り付け
- 「Add secret」をクリック

#### 4. LINE_CHANNEL_ID
- Name: `LINE_CHANNEL_ID`
- Secret: LINE Channel IDを貼り付け
- 「Add secret」をクリック

---

## 3. 自動デプロイの仕組み

### 3.1 GitHub Actionsワークフロー
`.github/workflows/deploy.yml` が自動デプロイを実行します。

### 3.2 デプロイフロー
1. `main`ブランチにpush
2. GitHub Actionsが起動
3. Secretsから`config.js`を動的生成
4. GitHub Pagesにデプロイ
5. https://pon10s.github.io/matchingapp/ で公開

### 3.3 config.jsの生成
以下の内容が自動生成されます:

```javascript
const CONFIG = {
  GEMINI_API_KEY: '(GitHub Secretsから取得)',
  LINE_CHANNEL_ACCESS_TOKEN: '(GitHub Secretsから取得)',
  LINE_CHANNEL_SECRET: '(GitHub Secretsから取得)',
  LINE_CHANNEL_ID: '(GitHub Secretsから取得)',
  APP_NAME: 'マッチングアプリ管理システム',
  VERSION: '1.0.0'
};
```

---

## 4. ローカル開発環境のセットアップ

### 4.1 config.jsの作成
ローカル開発時は、手動で`config.js`を作成します。

1. `config.example.js`をコピー
```bash
cp config.example.js config.js
```

2. `config.js`を編集してAPIキーを設定
```javascript
const CONFIG = {
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
  LINE_CHANNEL_ACCESS_TOKEN: 'YOUR_LINE_TOKEN_HERE',
  LINE_CHANNEL_SECRET: 'YOUR_LINE_SECRET_HERE',
  LINE_CHANNEL_ID: 'YOUR_LINE_CHANNEL_ID_HERE',
  APP_NAME: 'マッチングアプリ管理システム',
  VERSION: '1.0.0'
};
```

### 4.2 ローカルサーバー起動
```bash
# VSCodeのLive Serverを使用
# または
npx http-server -p 5500
```

### 4.3 注意事項
- `config.js`は`.gitignore`に含まれているため、Gitにコミットされません
- APIキーは絶対にGitHubにpushしないでください

---

## 5. デプロイ確認

### 5.1 デプロイ状況の確認
1. https://github.com/pon10s/matchingapp/actions を開く
2. 最新のワークフロー実行を確認
3. 緑のチェックマークが付いていれば成功

### 5.2 デプロイ完了後の確認
1. https://pon10s.github.io/matchingapp/ を開く
2. ブラウザで **Ctrl + Shift + R** (ハードリロード)
3. ログインして動作確認

### 5.3 config.jsの確認
https://pon10s.github.io/matchingapp/config.js を開いて、APIキーが正しく設定されているか確認

---

## 6. トラブルシューティング

### 6.1 デプロイが失敗する
**原因:** GitHub Secretsが正しく設定されていない

**対応:**
1. Settings → Secrets and variables → Actions を確認
2. 4つのSecretsが全て登録されているか確認
3. Secret名のスペルミスがないか確認

### 6.2 config.jsが空になる
**原因:** ワークフローのシェルスクリプトでSecretsが展開されていない

**対応:**
1. `.github/workflows/deploy.yml` の `cat > config.js << EOF` の部分を確認
2. シングルクォート `'EOF'` ではなく `EOF` になっているか確認

### 6.3 APIキーが漏洩した
**対応:**
1. すぐにAPIキーを無効化
2. 新しいAPIキーを発行
3. GitHub Secretsを更新
4. 再デプロイ

---

## 7. セキュリティのベストプラクティス

### 7.1 APIキーの管理
- APIキーは絶対にGitHubにpushしない
- GitHub Secretsで安全に管理
- 定期的にAPIキーをローテーション

### 7.2 .gitignoreの設定
以下のファイルは必ず.gitignoreに含める:
```
config.js
.env
.env.local
```

### 7.3 チャットツールでの注意
- APIキーをチャットに貼り付けない
- スクリーンショットにAPIキーを含めない
- ログにAPIキーが出力されないようにする

---

## 8. 更新手順

### 8.1 コードの更新
```bash
git add .
git commit -m "Update: 機能追加"
git push origin main
```

### 8.2 自動デプロイ
pushすると自動的にGitHub Actionsが起動し、デプロイされます。

### 8.3 APIキーの更新
1. GitHub Secretsを更新
2. 空コミットでデプロイをトリガー
```bash
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

---

## 9. 参考リンク

- GitHub Actions公式ドキュメント: https://docs.github.com/ja/actions
- GitHub Secrets: https://docs.github.com/ja/actions/security-guides/encrypted-secrets
- GitHub Pages: https://docs.github.com/ja/pages
- Gemini API: https://ai.google.dev/
- LINE Messaging API: https://developers.line.biz/ja/docs/messaging-api/
