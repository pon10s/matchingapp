// アカウント管理ページのスクリプト

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;

  // 現在の情報を表示
  document.getElementById('current-email').textContent = user.email || '-';
  const nickname = user.user_metadata?.nickname || '未設定';
  document.getElementById('current-nickname').textContent = nickname;

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