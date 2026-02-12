// ログインおよび新規登録ページの挙動を制御します。
document.addEventListener('DOMContentLoaded', () => {
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
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    if (!email || !password) return;
    try {
      // Supabase Auth で新規登録
      // 新規登録時にメール認証のリンク先をGitHub PagesのURLに設定します。
      // emailRedirectTo は Supabase Auth でメール確認リンクのリダイレクト先を指定するオプションです。
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://pon10s.github.io/matchingapp/'
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