// ログインおよび新規登録ページの挙動を制御します。
document.addEventListener('DOMContentLoaded', async () => {
  // パスワード再設定リンクからのアクセスを検知
  const hash = window.location.hash;
  if (hash && hash.includes('type=recovery')) {
    // パスワード再設定セクションを表示
    document.getElementById('auth-choice').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('reset-password-section').style.display = 'block';
    
    // パスワード再設定フォーム
    const resetPasswordForm = document.getElementById('reset-password-form');
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('new-password-reset').value;
      const confirmPassword = document.getElementById('new-password-reset-confirm').value;
      
      if (newPassword !== confirmPassword) {
        alert('パスワードが一致しません');
        return;
      }
      
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) {
        alert(error.message);
        return;
      }
      
      alert('パスワードを変更しました。ログインしてください。');
      window.location.href = 'login.html';
    });
    return;
  }
  
  // 通常のログイン画面：既にログイン済みならホームへ
  const { data } = await supabaseClient.auth.getUser();
  if (data && data.user) {
    window.location.href = 'index.html';
    return;
  }
  
  // セクション要素を取得
  const choiceSection = document.getElementById('auth-choice');
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  // トップ画面のボタン
  const showLoginBtn = document.getElementById('show-login');
  const showRegisterBtn = document.getElementById('show-register');
  // 戻るボタン
  const backLoginBtn = document.getElementById('back-to-choice-login');
  const backRegisterBtn = document.getElementById('back-to-choice-register');

  // 選択肢からログインフォームへ
  showLoginBtn.addEventListener('click', () => {
    choiceSection.style.display = 'none';
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
  });
  // 選択肢から新規登録フォームへ
  showRegisterBtn.addEventListener('click', () => {
    choiceSection.style.display = 'none';
    registerSection.style.display = 'block';
    loginSection.style.display = 'none';
  });
  // ログインフォームから選択肢へ戻る
  backLoginBtn.addEventListener('click', () => {
    loginSection.style.display = 'none';
    choiceSection.style.display = 'block';
  });
  // 登録フォームから選択肢へ戻る
  backRegisterBtn.addEventListener('click', () => {
    registerSection.style.display = 'none';
    choiceSection.style.display = 'block';
  });

  // ログイン処理
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return;
    try {
      // Supabase Auth でログインを試みる
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        alert(error.message);
        return;
      }
      // ログイン成功。ホーム画面へ遷移
      window.location.href = 'index.html';
    } catch (err) {
      alert(err.message);
    }
  });

  // 新規登録処理
  const registerForm = document.getElementById('register-form');
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nickname = document.getElementById('register-nickname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPw = document.getElementById('register-password-confirm').value;
    if (!nickname || !email || !password) return;
    if (password !== confirmPw) {
      alert('パスワードが一致しません');
      // パスワード入力欄のみリセットし、メールアドレスは保持
      document.getElementById('register-password').value = '';
      document.getElementById('register-password-confirm').value = '';
      return;
    }
    try {
      // Supabase Auth で新規登録
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://pon10s.github.io/matchingapp/',
          data: {
            nickname: nickname
          }
        }
      });
      if (error) {
        alert(error.message);
        return;
      }
      alert('登録が完了しました。ログインしてください。');
      // 登録後入力内容をクリアしてログインフォームへ戻す
      registerForm.reset();
      registerSection.style.display = 'none';
      choiceSection.style.display = 'block';
    } catch (err) {
      alert(err.message);
    }
  });
});