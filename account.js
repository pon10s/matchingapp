// アカウント管理ページのスクリプト

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;

  // 現在の情報を表示
  document.getElementById('current-email').textContent = user.email || '-';
  const nickname = user.user_metadata?.nickname || '未設定';
  document.getElementById('current-nickname').textContent = nickname;
  
  // 外部連携設定を読み込み
  try {
    await loadExternalSettings(user);
  } catch (err) {
    console.error('loadExternalSettingsエラー:', err);
  }

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
  console.log('delete-account-btn:', delBtn);
  if (!delBtn) {
    console.error('削除ボタンが見つかりません');
    return;
  }
  delBtn.addEventListener('click', async () => {
    console.log('削除ボタンがクリックされました');
    if (!confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
      console.log('削除がキャンセルされました');
      return;
    }
    try {
      console.log('削除開始 user_id:', user.id);
      
      // イベントを先に削除
      const { data: evData, error: evErr } = await supabaseClient
        .from('events')
        .delete()
        .eq('user_id', user.id)
        .select();
      console.log('events削除:', evData, evErr);
      if (evErr) {
        alert('イベント削除エラー: ' + evErr.message);
        return;
      }
      
      // プロフィールを削除
      const { data: profData, error: profErr } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('user_id', user.id)
        .select();
      console.log('profiles削除:', profData, profErr);
      if (profErr) {
        alert('プロフィール削除エラー: ' + profErr.message);
        return;
      }
      
      // user_settingsを削除
      const { data: setData, error: setErr } = await supabaseClient
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)
        .select();
      console.log('user_settings削除:', setData, setErr);
      
      // line_connection_codesを削除
      const { data: lineData, error: lineErr } = await supabaseClient
        .from('line_connection_codes')
        .delete()
        .eq('user_id', user.id)
        .select();
      console.log('line_connection_codes削除:', lineData, lineErr);
      
      // ユーザーアカウントを削除（ログアウト前に実行）
      const { error: deleteUserErr } = await supabaseClient.rpc('delete_user');
      console.log('delete_user実行:', deleteUserErr);
      if (deleteUserErr) {
        console.error('アカウント削除エラー:', deleteUserErr);
        alert('アカウント削除に失敗しました: ' + deleteUserErr.message);
        return;
      }
      
      // ログアウト（削除後はエラーになるが無視）
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.log('signOutエラー（無視）:', e);
      }
      
      // リダイレクトを先に実行
      window.location.href = 'login.html';
      
      // アラートはリダイレクト後に表示（実際には表示されない）
      alert('アカウントデータを削除しました。ご利用ありがとうございました。');
    } catch (err) {
      console.error('削除エラー:', err);
      alert(err.message);
    }
  });
});

// 外部連携設定を読み込み
async function loadExternalSettings(user) {
  const { data: settings, error } = await supabaseClient
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  console.log('Settings loaded:', settings, 'error:', error);
  
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
  if (lineConnectBtn) {
    lineConnectBtn.addEventListener('click', async () => {
      // 連携コードを生成
      const code = Math.random().toString(36).substring(2, 15);
      
      // line_connection_codesテーブルに保存
      const { error } = await supabaseClient
        .from('line_connection_codes')
        .insert({
          user_id: user.id,
          code: code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分後
        });
      
      if (error) {
        console.error('Error creating connection code:', error);
        alert('連携コードの生成に失敗しました');
        return;
      }
      
      // 新規登録は友達追加だけ、既存ユーザーは「連携」と送信
      const lineUrl = `https://line.me/R/ti/p/@840izdny`;
      window.open(lineUrl, '_blank');
    });
  }
  
  // LINE連携解除ボタン
  if (lineDisconnectBtn) {
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
      
      await supabaseClient
        .from('line_connection_codes')
        .delete()
        .eq('user_id', user.id);
      
      alert('LINE連携を解除しました。');
      location.reload();
    });
  }
  
  // Gemini設定は削除（運営者側で設定するため）
}
