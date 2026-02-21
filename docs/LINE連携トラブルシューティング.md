# LINE連携が動作しない問題の解決方法

## 原因
Supabase Edge Function（line-webhook）がデプロイされていないため、LINEからのWebhookが処理されません。

## 解決方法：Supabaseダッシュボードから直接デプロイ

### 手順1: Supabaseダッシュボードを開く

1. https://supabase.com/dashboard にアクセス
2. プロジェクト「wpagpmjjgwsnowvnhmml」を選択
3. 左メニューから「Edge Functions」をクリック

### 手順2: 新しい関数を作成

1. 「Create a new function」ボタンをクリック
2. Function name: `line-webhook`
3. 「Create function」をクリック

### 手順3: コードを貼り付け

以下のコードをエディタに貼り付けて「Deploy」をクリック：

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')!
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'POST') {
    const body = await req.json()
    const events = body.events || []

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text
        const lineUserId = event.source.userId

        const codeMatch = text.match(/連携コード[:：]?\s*([A-Z0-9]{6})/i)
        
        if (codeMatch) {
          const code = codeMatch[1].toUpperCase()
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
          
          const { data: codeData, error: codeError } = await supabase
            .from('line_connection_codes')
            .select('user_id')
            .eq('code', code)
            .eq('used', false)
            .single()
          
          if (codeData && !codeError) {
            const { error: updateError } = await supabase
              .from('user_settings')
              .upsert({
                user_id: codeData.user_id,
                line_user_id: lineUserId,
                line_notify_enabled: true
              })
            
            await supabase
              .from('line_connection_codes')
              .update({ used: true })
              .eq('code', code)
            
            const message = !updateError 
              ? '✅ 連携が完了しました！\n\nマッチングアプリ管理システムからの通知を受け取れるようになりました。'
              : '❌ 連携に失敗しました。もう一度お試しください。'
            
            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
              },
              body: JSON.stringify({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: message }]
              })
            })
          } else {
            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
              },
              body: JSON.stringify({
                replyToken: event.replyToken,
                messages: [{
                  type: 'text',
                  text: '❌ 無効な連携コードです。\n\nアプリから新しいコードを取得してください。'
                }]
              })
            })
          }
        } else {
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: 'メッセージを受信しました。\n\n連携するには「連携コード:XXXXXX」の形式で送信してください。'
              }]
            })
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('OK', { status: 200 })
})
```

### 手順4: 環境変数を設定

1. 左メニューから「Settings」→「Edge Functions」
2. 「Secrets」セクションで以下を追加：

**LINE_CHANNEL_ACCESS_TOKEN**
- LINE Developers → チャネル選択 → Messaging API設定 → チャネルアクセストークン

**LINE_CHANNEL_SECRET**
- LINE Developers → チャネル選択 → Basic settings → Channel secret

### 手順5: 動作確認

1. LINE Developersで「検証」ボタンをクリック → 成功を確認
2. LINEでBotにメッセージ送信 → 返信が来ることを確認
3. アプリで連携コードを取得
4. LINEで「連携コード:XXXXXX」を送信
5. 「連携が完了しました！」メッセージを確認
6. アプリをリロード → 「連携済み」表示を確認

## チェックリスト

- [ ] Edge Function作成
- [ ] コード貼り付け・デプロイ
- [ ] LINE_CHANNEL_ACCESS_TOKEN設定
- [ ] LINE_CHANNEL_SECRET設定
- [ ] Webhook検証成功
- [ ] テストメッセージ送信成功
- [ ] 連携コード送信成功
- [ ] アプリで「連携済み」表示
