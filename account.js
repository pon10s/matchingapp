// アカウント管理ページのスクリプト

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;

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
    const oldPw = document.getElementById('old-password').value;
    const newPw = document.getElementById('new-password').value;
    const confirmPw = document.getElementById('new-password-confirm').value;
    if (!oldPw || !newPw) return;
    if (newPw !== confirmPw) {
      alert('パスワードが一致しません');
      document.getElementById('new-password').value = '';
      document.getElementById('new-password-confirm').value = '';
      return;
    }
    try {
      // 現在のパスワードが正しいかを確認するため、再認証する
      const { data: userData, error: userErr } = await supabaseClient.auth.getUser();
      if (userErr || !userData || !userData.user) {
        throw userErr || new Error('ユーザー情報を取得できませんでした');
      }
      const email = userData.user.email;
      // 現在のパスワードでログイン（セッション確認）
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password: oldPw
      });
      if (signInError) {
        alert('現在のパスワードが正しくありません');
        document.getElementById('old-password').value = '';
        return;
      }
      // 新しいパスワードに更新
      const { error: updErr } = await supabaseClient.auth.updateUser({ password: newPw });
      if (updErr) {
        alert(updErr.message);
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
      // sign out the user
      await supabaseClient.auth.signOut();
      alert('アカウントを削除しました。ご利用ありがとうございました。');
      // redirect to login
      window.location.href = 'login.html';
    } catch (err) {
      alert(err.message);
    }
  });
});