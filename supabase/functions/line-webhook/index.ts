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
    console.log('Received events:', JSON.stringify(events))

    for (const event of events) {
      console.log('Processing event type:', event.type)
      const lineUserId = event.source.userId
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      // 友だち追加イベント（自動連携）
      if (event.type === 'follow') {
        console.log('Follow event detected for user:', lineUserId)
        // 最新の未使用コードを取得
        const { data: codeData, error: codeError } = await supabase
          .from('line_connection_codes')
          .select('user_id, code')
          .eq('used', false)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        console.log('Code data:', codeData, 'Error:', codeError)
        
        if (codeData) {
          console.log('[FOLLOW] Code found for user_id:', codeData.user_id)
          
          // 既存の連携を解除（同じLINE IDの古い連携）
          const { data: oldData, error: deleteError } = await supabase
            .from('user_settings')
            .update({ line_user_id: null, line_notify_enabled: false })
            .eq('line_user_id', lineUserId)
            .select()
          
          console.log('[FOLLOW] Old connection removed:', oldData, 'Error:', deleteError)
          
          // 連携を完了（upsert使用）
          const { data: upsertData, error: updateError } = await supabase
            .from('user_settings')
            .upsert({
              user_id: codeData.user_id,
              line_user_id: lineUserId,
              line_notify_enabled: true
            }, { onConflict: 'user_id' })
            .select()
          
          console.log('[FOLLOW] Upsert result:', upsertData, 'Error:', updateError)
          
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
            console.log('Success message sent')
          }
        }
      }
      
      // メッセージイベント（友だち追加済みでも連携可能）
      if (event.type === 'message' && event.message.type === 'text') {
        console.log('Message event detected')
        const text = event.message.text
        
        // 「連携」というメッセージで連携開始
        if (text.includes('連携')) {
          const { data: codeData } = await supabase
            .from('line_connection_codes')
            .select('user_id, code')
            .eq('used', false)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          if (codeData) {
            console.log('[MESSAGE] Code found for user_id:', codeData.user_id)
            
            // 既存の連携を解除
            const { data: oldData, error: deleteError } = await supabase
              .from('user_settings')
              .update({ line_user_id: null, line_notify_enabled: false })
              .eq('line_user_id', lineUserId)
              .select()
            
            console.log('[MESSAGE] Old connection removed:', oldData, 'Error:', deleteError)
            
            // 連携を完了（upsert使用）
            const { data: upsertData, error: updateError } = await supabase
              .from('user_settings')
              .upsert({
                user_id: codeData.user_id,
                line_user_id: lineUserId,
                line_notify_enabled: true
              }, { onConflict: 'user_id' })
              .select()
            
            console.log('[MESSAGE] Upsert result:', upsertData, 'Error:', updateError)
            
            await supabase
              .from('line_connection_codes')
              .update({ used: true })
              .eq('code', codeData.code)
            
            if (!updateError) {
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
                    text: '✅ 連携が完了しました！\n\nマッチングアプリ管理システムからの通知を受け取れるようになりました。\n\nアプリをリロードして確認してください。'
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
                  text: '連携コードが見つかりません。\n\nアプリで「連携する」ボタンをクリックしてから、もう一度「連携」と送信してください。'
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
                text: 'メッセージを受信しました！\n\n連携する場合は、アプリで「連携する」ボタンをクリックしてから「連携」と送信してください。'
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
