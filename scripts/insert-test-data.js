// テストデータ投入スクリプト
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wpagpmjjgwsnowvnhmml.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-e8W4jFQ-TB9KraQBA_OTw_moXmZGEz';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertTestData() {
  console.log('1. test@example.comでログイン中...');
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword'
  });

  if (authError) {
    console.error('ログインエラー:', authError.message);
    console.log('\ntest@example.comユーザーが存在しません。');
    console.log('先にユーザー登録を行ってください:');
    console.log('  http://localhost:5500/login.html');
    return;
  }

  const userId = authData.user.id;
  console.log('✓ ログイン成功:', userId);

  console.log('\n2. プロフィールデータ投入中...');
  
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

  console.log('\n3. 完了');
  console.log('投入されたデータ:');
  profiles.forEach(p => {
    console.log(`  - ${p.name} (${p.status}, ${p.app})`);
  });
}

insertTestData().catch(console.error);
