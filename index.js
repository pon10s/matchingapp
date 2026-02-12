// ホーム画面用スクリプト
// 統計情報の表示と更新が必要なイベントのリストアップを行います。

window.addEventListener('DOMContentLoaded', async () => {
  // ログインしていない場合はログインページへリダイレクトします
  const user = await ensureLoggedIn();
  if (!user) return;
  await loadStatsAndPending();
});

// 統計情報と未更新イベントリストを読み込み表示する
async function loadStatsAndPending() {
  const user = await ensureLoggedIn();
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  // プロフィールとイベントを取得
  const { data: profiles, error: profError } = await supabaseClient
    .from('profiles')
    .select('id, name, status, summary')
    .eq('user_id', user.id);
  if (profError) {
    console.error(profError);
    return;
  }
  const { data: events, error: evError } = await supabaseClient
    .from('events')
    .select('id, profile_id, event_date, comment, status')
    .eq('user_id', user.id);
  if (evError) {
    console.error(evError);
    return;
  }
  // プロフィール数
  const profilesCount = profiles ? profiles.length : 0;
  document.getElementById('profiles-count').textContent = `${profilesCount}人`;
  // 本日以降の予定数
  const upcomingCount = events.filter(ev => ev.event_date >= today).length;
  document.getElementById('upcoming-count').textContent = `${upcomingCount}件`;
  // 未更新イベント（過去の日付かつ comment が空）
  const pendingEvents = events.filter(ev => {
    return ev.event_date < today && (!ev.comment || ev.comment.trim() === '');
  });
  document.getElementById('pending-count').textContent = `${pendingEvents.length}件`;
  renderPendingList(pendingEvents, profiles);
}

// 更新が必要なイベントのリストを描画し、各アイテムで感想とステータスを更新できるようにする
async function renderPendingList(pendingEvents, profiles) {
  const pendingListEl = document.getElementById('pending-list');
  pendingListEl.innerHTML = '';
  if (!pendingEvents || pendingEvents.length === 0) {
    const li = document.createElement('li');
    li.textContent = '更新が必要なイベントはありません。';
    pendingListEl.appendChild(li);
    return;
  }
  // ステータス選択肢
  const statusOptions = ['', '本命', 'あり', 'わからない', 'ビミョウ', '大人の関係', '友達', '終了'];
  // 日付順に並び替え
  pendingEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  const user = await ensureLoggedIn();
  for (const ev of pendingEvents) {
    const profile = profiles.find(p => p.id === ev.profile_id);
    const li = document.createElement('li');
    li.style.marginBottom = '1rem';
    // 日付と名前
    const header = document.createElement('div');
    header.textContent = `${ev.event_date} ${profile ? profile.name : ''}`;
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
      const { error: updEventErr } = await supabaseClient
        .from('events')
        .update({ comment: note })
        .eq('id', ev.id)
        .eq('user_id', user.id);
      if (updEventErr) {
        alert(updEventErr.message);
        return;
      }
      // ステータスが選択されている場合はプロフィールのステータスを更新
      const newStatus = statusSelect.value;
      if (newStatus) {
        const { error: updProfErr } = await supabaseClient
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', ev.profile_id)
          .eq('user_id', user.id);
        if (updProfErr) {
          alert(updProfErr.message);
          return;
        }
      }
      // 再読み込み
      await loadStatsAndPending();
    });
    li.appendChild(updateBtn);
    pendingListEl.appendChild(li);
  }
}