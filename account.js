// アカウント管理ページのスクリプト

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;

  // 現在の情報を表示
  document.getElementById('current-email').textContent = user.email || '-';
  const nickname = user.user_metadata?.nickname || '未設定';
  document.getElementById('current-nickname').textContent = nickname;
  
  // 外部連携設定を読み込み
  await loadExternalSettings(user);

  // ニックネーム変更フォーム
  const nicknameForm = document.getElementById('nickname-form');
  nicknameForm.addEventListener('submit', async e => {
    e.preventDefault();
    const newNickname = document.getElementById('new-nickname').value.trim();
    if (!newNickname) return;
    try {
      const { data, error } = await supabaseClient.auth.updateUser({
        data: { nickname: newNickname }
      });
      if (error) {
        alert(error.message);
        return;
      }
      alert('ニックネームを更新しました');
      document.getElementById('current-nickname').textContent = newNickname;
      nicknameForm.reset();
    } catch (err) {
      alert(err.message);
    }
  });

  // メールアドレス変更フォーム
  const emailForm = document.getElementById('email-form');
  emailForm.addEventListener('submit', async e => {
    e.preventDefault();
    const newEmail = document.getElementById('new-email').value.trim();
    if (!newEmail) return;
    try {
      const { data, error } = await supabaseClient.auth.updateUser({ email: newEmail });
      if (error) {
        alert(error.message);
        return;
      }
      alert('メールアドレスを更新しました。ログイン情報が変更されている場合は再度ログインしてください。');
      emailForm.reset();
    } catch (err) {
      alert(err.message);
    }
  });

  // パスワード変更フォーム
  const pwForm = document.getElementById('password-form');
  pwForm.addEventListener('submit', async e => {
    e.preventDefault();
    const newPw = document.getElementById('new-password').value;
    const confirmPw = document.getElementById('new-password-confirm').value;
    if (!newPw) return;
    if (newPw !== confirmPw) {
      alert('パスワードが一致しません');
      document.getElementById('new-password').value = '';
      document.getElementById('new-password-confirm').value = '';
      return;
    }
    try {
      const { data, error } = await supabaseClient.auth.updateUser({ password: newPw });
      if (error) {
        alert(error.message);
        return;
      }
      alert('パスワードを更新しました。再度ログインが必要な場合があります。');
      pwForm.reset();
    } catch (err) {
      alert(err.message);
    }
  });

  // アカウント削除ボタン
  const delBtn = document.getElementById('delete-account-btn');
  delBtn.addEventListener('click', async () => {
    if (!confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) return;
    try {
      // delete all profiles and events belonging to user
      const { error: profErr } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      if (profErr) {
        alert(profErr.message);
        return;
      }
      const { error: evErr } = await supabaseClient
        .from('events')
        .delete()
        .eq('user_id', user.id);
      if (evErr) {
        alert(evErr.message);
        return;
      }
      // Supabaseのauth.admin.deleteUserはRPCから呼ぶ必要があるため、クライアント側ではログアウトのみ実行
      await supabaseClient.auth.signOut();
      alert('アカウントデータを削除しました。ご利用ありがとうございました。');
      // redirect to login
      window.location.href = 'login.html';
    } catch (err) {
      alert(err.message);
    }
  });
});

// 外部連携設定を読み込み
async function loadExternalSettings(user) {
  const { data: settings } = await supabaseClient
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  console.log('Settings loaded:', settings);
  
  // LINE連携状況
  const lineStatus = document.getElementById('line-status');
  const lineNotConnected = document.getElementById('line-not-connected');
  const lineConnected = document.getElementById('line-connected');
  const lineConnectBtn = document.getElementById('line-connect-btn');
  const lineDisconnectBtn = document.getElementById('line-disconnect-btn');
  
  console.log('line_user_id:', settings?.line_user_id);
  
  if (settings && settings.line_user_id) {
    console.log('LINE連携済みと判定');
    lineStatus.textContent = '状態: 連携済み';
    lineStatus.style.color = '#4caf50';
    lineNotConnected.style.display = 'none';
    lineConnected.style.display = 'block';
  } else {
    console.log('LINE未連携と判定');
    lineStatus.textContent = '状態: 未連携';
    lineStatus.style.color = '#999';
    lineNotConnected.style.display = 'block';
    lineConnected.style.display = 'none';
  }
  
  // LINE連携ボタン
  lineConnectBtn.addEventListener('click', async () => {
    // ワンタイムコードを生成
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // データベースに保存
    const { error: insertError } = await supabaseClient
      .from('line_connection_codes')
      .insert({
        user_id: user.id,
        code: code
      });
    
    if (insertError) {
      alert('エラー: ' + insertError.message);
      return;
    }
    
    // LINE友だち追加URLに遷移（「連携」というテキストを自動入力）
    const lineUrl = `https://line.me/R/oaMessage/@840izdny/?連携します。このまま送信してください。`;
    window.open(lineUrl, '_blank');
    
    alert(`連携手順：\n\n1. LINEアプリが開きます\n2. 「連携します。このまま送信してください。」というメッセージが入力されています\n3. 送信ボタンを押すだけ！\n4. 連携完了メッセージを確認\n5. このページをリロード`);
  });
  
  // LINE連携解除ボタン
  lineDisconnectBtn.addEventListener('click', async () => {
    if (!confirm('LINE連携を解除しますか？\n\n再連携する場合は、解除後に「連携する」ボタンをクリックしてください。')) return;
    
    const { error } = await supabaseClient
      .from('user_settings')
      .update({ 
        line_notify_enabled: false,
        line_user_id: null 
      })
      .eq('user_id', user.id);
    
    if (error) {
      alert(error.message);
      return;
    }
    
    // 使用済みコードを削除
    await supabaseClient
      .from('line_connection_codes')
      .delete()
      .eq('user_id', user.id);
    
    alert('LINE連携を解除しました。');
    location.reload();
  });
  
  // Gemini設定は削除（運営者側で設定するため）
}
