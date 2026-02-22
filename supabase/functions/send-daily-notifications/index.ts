import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// LINE Messaging APIの設定（config.jsから）
const LINE_CHANNEL_ACCESS_TOKEN = 'ZQTsgXJM26BSUqe/cBtorzwQEAJMu0Q5yZWUEYy7o/Ux7L1p0Orjc0J+/s2QipNuUdbxkHyNoKPyZUaF9bbkfggktUAgXhjy/PG06tHH794k0hEO25WZVGToza2HqSQ8OGlk+w0wKdIny1gjYNVdvwdB04t89/1O/w1cDnyilFU='

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const fifteenDaysAgo = new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]

    // LINE通知が有効なユーザーを取得（line_user_idが設定されているユーザー）
    const { data: users, error: usersError } = await supabaseClient
      .from('user_settings')
      .select('user_id, line_user_id')
      .eq('line_notify_enabled', true)
      .not('line_user_id', 'is', null)

    if (usersError) throw usersError

    let totalSent = 0
    const results = []

    for (const user of users || []) {
      const notifications = []

      // 1. 明日のデート予定チェック
      const { data: upcomingEvents } = await supabaseClient
        .from('events')
        .select('id, profile_id, profiles(name)')
        .eq('user_id', user.user_id)
        .eq('event_date', tomorrow)

      if (upcomingEvents && upcomingEvents.length > 0) {
        for (const event of upcomingEvents) {
          notifications.push({
            type: 'upcoming_date',
            message: `📅 明日は${event.profiles.name}さんとのデートです！楽しんできてください✨`,
            profile_id: event.profile_id
          })
        }
      }

      // 2. 昨日の未更新イベントチェック
      const { data: pendingEvents } = await supabaseClient
        .from('events')
        .select('id, profile_id, profiles(name)')
        .eq('user_id', user.user_id)
        .eq('event_date', yesterday)
        .or('comment.is.null,comment.eq.')

      if (pendingEvents && pendingEvents.length > 0) {
        for (const event of pendingEvents) {
          notifications.push({
            type: 'pending_comment',
            message: `📝 ${event.profiles.name}さんとのデートの感想を記録しましょう！`,
            profile_id: event.profile_id
          })
        }
      }

      // 3. 15日間ステータス変更なしチェック
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id, name, updated_at')
        .eq('user_id', user.user_id)
        .lt('updated_at', fifteenDaysAgo)
        .neq('status', '終了')

      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          notifications.push({
            type: 'status_change_reminder',
            message: `💭 ${profile.name}さんのステータスを見直してみませんか？`,
            profile_id: profile.id
          })
        }
      }

      // LINE Messaging APIで通知送信
      for (const notif of notifications) {
        try {
          const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: user.line_user_id,
              messages: [{
                type: 'text',
                text: notif.message
              }]
            }),
          })

          if (response.ok) {
            // ログ記録
            await supabaseClient
              .from('notification_logs')
              .insert({
                user_id: user.user_id,
                profile_id: notif.profile_id,
                notification_type: notif.type,
              })

            totalSent++
            results.push({ user_id: user.user_id, type: notif.type, status: 'success' })
          } else {
            results.push({ user_id: user.user_id, type: notif.type, status: 'failed', error: await response.text() })
          }
        } catch (error) {
          results.push({ user_id: user.user_id, type: notif.type, status: 'error', error: error.message })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, totalSent, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
