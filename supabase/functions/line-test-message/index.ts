import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')!

serve(async (req) => {
  if (req.method === 'POST') {
    const { line_user_id } = await req.json()
    
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: line_user_id,
        messages: [{
          type: 'text',
          text: 'マチアプネキだよ〜！\n連携テスト成功ンゴね〜✨'
        }]
      })
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('OK', { status: 200 })
})
