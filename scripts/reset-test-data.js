// テストデータクリーンアップ＆再投入スクリプト
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wpagpmjjgwsnowvnhmml.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-e8W4jFQ-TB9KraQBA_OTw_moXmZGEz';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function resetTestData() {
  console.log('1. ログイン中...');
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword'
  });

  if (authError) {
    console.error('ログインエラー:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('✓ ログイン成功');

  console.log('\n2. 既存データ削除中...');
  
  // イベント削除
  await supabase.from('events').delete().eq('user_id', userId);
  console.log('✓ イベント削除');
  
  // プロフィール削除
  await supabase.from('profiles').delete().eq('user_id', userId);
  console.log('✓ プロフィール削除');
  
  // LINE連携解除
  await supabase.from('user_settings').delete().eq('user_id', userId);
  console.log('✓ 設定削除');

  console.log('\n3. プロフィールデータ投入中...');
  
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        user_id: userId,
        name: '山田花子',
        age: 28,
        status: '本命',
        app: 'Pairs',
        income: '500〜700万',
        summary: '明るくて優しい人'
      },
      {
        user_id: userId,
        name: '佐藤美咲',
        age: 25,
        status: 'あり',
        app: 'Omiai',
        income: '300〜500万',
        summary: '趣味が合う'
      },
      {
        user_id: userId,
        name: '鈴木愛',
        age: 30,
        status: '終了',
        app: 'Tinder',
        income: '200〜300万',
        summary: '合わなかった'
      }
    ])
    .select();

  if (profileError) {
    console.error('プロフィール投入エラー:', profileError.message);
    return;
  }

  console.log('✓ プロフィール投入成功:', profiles.length, '件');

  console.log('\n4. イベントデータ投入中...');
  
  const yamadaProfile = profiles.find(p => p.name === '山田花子');
  const satoProfile = profiles.find(p => p.name === '佐藤美咲');
  
  const today = new Date();
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(today.getDate() - 5);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const { data: events, error: eventError } = await supabase
    .from('events')
    .insert([
      {
        user_id: userId,
        profile_id: yamadaProfile.id,
        event_date: fiveDaysAgo.toISOString().split('T')[0],
        comment: '楽しかった'
      },
      {
        user_id: userId,
        profile_id: satoProfile.id,
        event_date: twoDaysAgo.toISOString().split('T')[0],
        comment: null
      }
    ])
    .select();

  if (eventError) {
    console.error('イベント投入エラー:', eventError.message);
    return;
  }

  console.log('✓ イベント投入成功:', events.length, '件');

  console.log('\n5. 完了');
  console.log('投入データ:');
  console.log('  プロフィール:', profiles.length, '件');
  console.log('  イベント:', events.length, '件');
  console.log('  LINE連携: 未連携');
}

resetTestData().catch(console.error);
