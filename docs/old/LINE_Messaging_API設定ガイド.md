# LINE Messaging API 設定ガイド

⚠️ **重要**: LINE Notifyは2025年3月31日にサービス終了します。
代わりにLINE Messaging APIを使用します。

---

## 📋 概要

LINE Messaging APIを使用して、ユーザーにLINE通知を送信します。

**メリット:**
- 月200通まで無料
- リッチメッセージ対応
- 双方向コミュニケーション可能

**デメリット:**
- LINE公式アカウントが必要
- ユーザーが友だち追加する必要がある

---

## 🔧 設定手順

### ステップ1: LINE Developersアカウント作成

1. **LINE Developersにアクセス**
   - https://developers.line.biz/ja/
   - LINEアカウントでログイン

2. **プロバイダーを作成**
   - 「プロバイダー」タブをクリック
   - 「作成」ボタンをクリック
   - プロバイダー名: 「マッチングアプリ管理」（任意）

### ステップ2: チャネルを作成

1. **Messaging APIチャネルを作成**
   - プロバイダーを選択
   - 「Messaging API」を選択
   - 以下を入力:
     - チャネル名: 「マッチングアプリ管理Bot」
     - チャネル説明: 「デート予定の通知Bot」
     - 大業種: 「個人」
     - 小業種: 「個人（その他）」
     - メールアドレス: あなたのメールアドレス
   - 利用規約に同意して「作成」

2. **チャネル設定**
   - 「Messaging API設定」タブを開く
   - 「応答メッセージ」を無効化
   - 「あいさつメッセージ」を無効化（任意）

### ステップ3: チャネルアクセストークンを発行

1. **チャネルアクセストークンを発行**
   - 「Messaging API設定」タブ
   - 「チャネルアクセストークン（長期）」セクション
   - 「発行」ボタンをクリック
   - トークンをコピー（例: `abc123XYZ...`）

⚠️ **重要**: このトークンは誰にも見せないでください

### ステップ4: Webhook URLを設定（後で設定）

Supabase Functionsをデプロイ後に設定します。

---

## 💾 データベース設定

### user_settingsテーブルを更新

```sql
-- line_user_idカラムを追加
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_user_settings_line_user_id 
ON user_settings(line_user_id);
```

---

## 🔐 config.jsに追加

```javascript
const CONFIG = {
  // Gemini API Key（運営者のキー）
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
  
  // LINE Messaging API（運営者のキー）
  LINE_CHANNEL_ACCESS_TOKEN: 'YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE',
  LINE_CHANNEL_SECRET: 'YOUR_LINE_CHANNEL_SECRET_HERE',
  
  // その他の設定
  APP_NAME: 'マッチングアプリ管理システム',
  VERSION: '1.0.0'
};
```

---

## 📱 ユーザー側の設定フロー

### 1. QRコードで友だち追加

1. **QRコードを取得**
   - LINE Developersコンソール
   - 「Messaging API設定」タブ
   - 「QRコード」をダウンロード

2. **アプリに表示**
   - アカウント管理画面にQRコードを表示
   - ユーザーがLINEアプリでスキャン
   - 友だち追加

### 2. LINE User IDを取得

ユーザーが友だち追加すると、WebhookでLINE User IDが送信されます。

---

## 🚀 Supabase Functions実装

### 1. LINE Webhook受信

`supabase/functions/line-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET')!

serve(async (req) => {
  try {
    const signature = req.headers.get('x-line-signature')
    const body = await req.text()
    
    // 署名検証（省略）
    
    const events = JSON.parse(body).events
    
    for (const event of events) {
      if (event.type === 'follow') {
        // 友だち追加時
        const lineUserId = event.source.userId
        
        // データベースに保存（ユーザーとの紐付けは別途実装）
        console.log('New friend:', lineUserId)
      }
    }
    
    return new Response('OK', { status: 200 })
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
})
```

### 2. メッセージ送信

`supabase/functions/send-line-message/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')!

serve(async (req) => {
  const { lineUserId, message } = await req.json()
  
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{
        type: 'text',
        text: message
      }]
    })
  })
  
  return new Response(JSON.stringify({ success: response.ok }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 🔗 連携フロー（簡易版）

### 方法1: ワンタイムコードで連携

1. **アプリでコード生成**
   - ユーザーがアカウント画面で「LINE連携」をクリック
   - 6桁のワンタイムコードを生成・表示
   - データベースに保存（有効期限5分）

2. **LINEで送信**
   - ユーザーがLINE公式アカウントにコードを送信
   - Webhookでコードを受信
   - データベースで照合してuser_idとline_user_idを紐付け

### 方法2: URLで連携（推奨）

1. **連携URLを生成**
   ```
   https://line.me/R/ti/p/@YOUR_BOT_ID?text=連携コード:ABC123
   ```

2. **ユーザーがクリック**
   - LINEアプリが開く
   - 友だち追加 + メッセージ送信
   - Webhookで処理

---

## 📊 料金

| プラン | 月額 | メッセージ数 |
|--------|------|--------------|
| フリー | 無料 | 200通 |
| ライト | ¥5,000 | 5,000通 |
| スタンダード | ¥15,000 | 30,000通 |

**参考**: https://www.linebiz.com/jp/service/line-official-account/plan/

---

## ⚠️ 注意事項

1. **友だち追加が必須**
   - ユーザーが能動的に友だち追加する必要がある
   - LINE Notifyより手間がかかる

2. **メッセージ数制限**
   - 月200通まで無料
   - 超過すると課金が発生

3. **Webhook必須**
   - サーバー側の実装が必要
   - Supabase Functionsを使用

4. **双方向通信**
   - ユーザーからのメッセージも受信できる
   - 応答ロジックの実装が必要

---

## 🎯 実装の優先度

### 今すぐ実装（必須）
- [ ] LINE Developersアカウント作成
- [ ] チャネル作成
- [ ] チャネルアクセストークン取得
- [ ] config.jsに設定

### 後で実装（推奨）
- [ ] Supabase Functions（Webhook受信）
- [ ] Supabase Functions（メッセージ送信）
- [ ] 連携フロー実装
- [ ] QRコード表示

### 将来的に実装（オプション）
- [ ] リッチメッセージ
- [ ] Flex Message
- [ ] 自動応答

---

## 📚 参考リンク

- [Messaging API概要](https://developers.line.biz/ja/docs/messaging-api/overview/)
- [Messaging APIリファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- [料金プラン](https://www.linebiz.com/jp/service/line-official-account/plan/)
- [Supabase Functions](https://supabase.com/docs/guides/functions)

---

## 🔄 移行スケジュール

1. **2025年1月**: LINE Messaging API設定完了
2. **2025年2月**: Supabase Functions実装
3. **2025年3月**: ユーザーに移行案内
4. **2025年3月31日**: LINE Notify終了

---

**最終更新: 2025年1月**
