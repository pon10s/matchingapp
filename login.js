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
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) return;
    const storedPw = localStorage.getItem('user_' + username);
    if (storedPw === null) {
      alert('ユーザーが見つかりません。新規登録してください。');
      return;
    }
    if (storedPw !== password) {
      alert('パスワードが正しくありません。');
      return;
    }
    // ログイン成功
    localStorage.setItem('currentUser', username);
    window.location.href = 'index.html';
  });

  // 新規登録処理
  const registerForm = document.getElementById('register-form');
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    if (!username || !password) return;
    if (localStorage.getItem('user_' + username) !== null) {
      alert('同じユーザー名は既に登録されています。別の名前を選んでください。');
      return;
    }
    localStorage.setItem('user_' + username, password);
    alert('登録が完了しました。ログインしてください。');
    // 登録後入力内容をクリアしてログインフォームへ戻す
    registerForm.reset();
    registerSection.style.display = 'none';
    choiceSection.style.display = 'block';
  });
});