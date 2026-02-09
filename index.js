// ホーム画面用スクリプト
// 統計情報の表示と更新が必要なイベントのリストアップを行います。

window.addEventListener('DOMContentLoaded', async () => {
  const db = initDb();
  if (!db) return;
  await loadStatsAndPending();
});

// 統計情報と未更新イベントリストを読み込み表示する
async function loadStatsAndPending() {
  const db = initDb();
  const today = new Date().toISOString().slice(0, 10);
  // プロフィール数
  const profilesCount = await db.profiles.count();
  document.getElementById('profiles-count').textContent = `${profilesCount}人`;
  // 本日以降の予定数
  const upcomingCount = await db.events.where('date').aboveOrEqual(today).count();
  document.getElementById('upcoming-count').textContent = `${upcomingCount}件`;
  // 未更新イベント（過去の日付かつ note が空）
  const pendingEvents = await db.events.filter(ev => {
    return ev.date < today && (!ev.note || ev.note.trim() === '');
  }).toArray();
  document.getElementById('pending-count').textContent = `${pendingEvents.length}件`;
  renderPendingList(pendingEvents);
}

// 更新が必要なイベントのリストを描画し、各アイテムで感想とステータスを更新できるようにする
async function renderPendingList(pendingEvents) {
  const pendingListEl = document.getElementById('pending-list');
  pendingListEl.innerHTML = '';
  if (!pendingEvents || pendingEvents.length === 0) {
    const li = document.createElement('li');
    li.textContent = '更新が必要なイベントはありません。';
    pendingListEl.appendChild(li);
    return;
  }
  const db = initDb();
  const profiles = await db.profiles.toArray();
  // ステータス選択肢
  const statusOptions = ['', '本命', 'あり', 'わからない', 'キープ', 'なし', 'セフレ', 'ネタ', '友達'];
  // 日付順に並び替え
  pendingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  pendingEvents.forEach(ev => {
    const profile = profiles.find(p => p.id === ev.profileId);
    const li = document.createElement('li');
    li.style.marginBottom = '1rem';
    // 日付と名前
    const header = document.createElement('div');
    header.textContent = `${ev.date} ${profile ? profile.nickname : ''}`;
    li.appendChild(header);
    // 感想入力
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.placeholder = '感想を入力';
    noteInput.style.marginRight = '0.5rem';
    li.appendChild(noteInput);
    // ステータス選択（任意）
    const statusSelect = document.createElement('select');
    statusOptions.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt;
      optionEl.textContent = opt === '' ? 'ステータス変更なし' : opt;
      statusSelect.appendChild(optionEl);
    });
    statusSelect.style.marginRight = '0.5rem';
    li.appendChild(statusSelect);
    // 更新ボタン
    const updateBtn = document.createElement('button');
    updateBtn.textContent = '更新';
    updateBtn.addEventListener('click', async () => {
      const note = noteInput.value.trim();
      if (!note) {
        alert('感想を入力してください');
        return;
      }
      // イベントの感想を更新
      await db.events.update(ev.id, { note });
      // ステータスが選択されている場合はプロフィールのステータスを更新
      const newStatus = statusSelect.value;
      if (newStatus) {
        await db.profiles.update(ev.profileId, { statusTag: newStatus });
      }
      // 再読み込み
      await loadStatsAndPending();
    });
    li.appendChild(updateBtn);
    pendingListEl.appendChild(li);
  });
}