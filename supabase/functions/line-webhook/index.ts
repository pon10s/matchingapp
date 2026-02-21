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
      const lineUserId = event.source.userId
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      // 友だち追加イベント（自動連携）
      if (event.type === 'follow') {
        // 最新の未使用コードを取得
        const { data: codeData } = await supabase
          .from('line_connection_codes')
          .select('user_id, code')
          .eq('used', false)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (codeData) {
          // 連携を完了
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
            .eq('code', codeData.code)
          
          if (!updateError) {
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
              },
              body: JSON.stringify({
                to: lineUserId,
                messages: [{
                  type: 'text',
                  text: '✅ 連携が完了しました！\n\nマッチングアプリ管理システムからの通知を受け取れるようになりました。\n\nアプリをリロードして確認してください。'
                }]
              })
            })
          }
        }
      }
      
      // メッセージイベント
      if (event.type === 'message' && event.message.type === 'text') {
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
              text: 'メッセージを受信しました！\n\n連携は友だち追加時に自動で完了しています。'
            }]
          })
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('OK', { status: 200 })
})
