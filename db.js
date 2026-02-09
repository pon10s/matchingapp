/*
 * データベースモジュール
 * ログイン中のユーザー名を元にデータベース名を決定し、
 * プロフィール・メモ・イベント用のストアを定義します。
 * 未ログインの場合はログイン画面へリダイレクトします。
 */

let db;

/**
 * 現在ログイン中のユーザーのためのDexieインスタンスを返します。
 * ユーザーが未設定の場合はログインページに遷移します。
 */
function initDb() {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    // ユーザーが未ログインの場合はログインページへ
    window.location.href = 'login.html';
    return null;
  }
  if (db) return db;
  const dbName = 'matchingApp_' + user;
  db = new Dexie(dbName);
  db.version(1).stores({
    profiles: '++id, nickname, dateMet, statusTag, appTag',
    memos: '++id, profileId',
    events: '++id, profileId, date'
  });
  return db;
}

/**
 * ログアウト処理。ログイン状態をクリアしてログイン画面へ遷移します。
 */
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// グローバルに公開
window.initDb = initDb;
window.logout = logout;