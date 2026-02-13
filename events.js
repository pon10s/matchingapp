// Events page script

let currentEventId = null;
document.addEventListener('DOMContentLoaded', async () => {
  // ユーザーがログインしているか確認
  const user = await ensureLoggedIn();
  if (!user) return;
  // プロフィールのドロップダウンを初期化
  await populateProfiles();
  // クエリパラメータに profileId がある場合は選択状態にする
  const urlParams = new URLSearchParams(window.location.search);
  const initialProfileId = urlParams.get('profileId');
  if (initialProfileId) {
    document.getElementById('profileSelect').value = initialProfileId;
  }
  // フォーム送信処理
  document.getElementById('event-form').addEventListener('submit', async e => {
    e.preventDefault();
    const user = await ensureLoggedIn();
    if (!user) return;
    const profileId = document.getElementById('profileSelect').value;
    const date = document.getElementById('eventDate').value;
    const note = document.getElementById('eventNote').value.trim();
    if (!profileId || !date) return;
    if (currentEventId) {
      // 編集モード：既存のイベントを更新
      const updateFields = { profile_id: profileId, event_date: date };
      // 編集時のみ感想を保存
      updateFields.comment = note;
      const { error } = await supabaseClient
        .from('events')
        .update(updateFields)
        .eq('id', currentEventId)
        .eq('user_id', user.id);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      // 新規登録：コメントは空で挿入
      const { error } = await supabaseClient
        .from('events')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          event_date: date,
          comment: ''
        });
      if (error) {
        alert(error.message);
        return;
      }
    }
    // フォームリセットと編集モード終了
    document.getElementById('event-form').reset();
    currentEventId = null;
    document.getElementById('eventSubmitBtn').textContent = '追加';
    document.getElementById('commentField').style.display = 'none';
    const indicator = document.getElementById('editingIndicator');
    if (indicator) indicator.style.display = 'none';
    refreshEvents();
  });
  // 初期状態では感想入力欄を隠す
  document.getElementById('commentField').style.display = 'none';
  refreshEvents();
});

// 日付を "M/D(曜日)" 形式にフォーマット
function formatDateJP(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const weekdays = ['日','月','火','水','木','金','土'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = weekdays[date.getDay()];
  return `${m}/${d}(${w})`;
}

// 回数を日本語表記に変換 (1: 初回, 2: 2回目...)
function formatCountJp(count) {
  if (!count) return '';
  if (count === 1) return '初回';
  return `${count}回目`;
}

async function populateProfiles() {
  const user = await ensureLoggedIn();
  if (!user) return;
  const { data: profiles, error } = await supabaseClient
    .from('profiles')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  const select = document.getElementById('profileSelect');
  select.innerHTML = '';
  profiles.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    select.appendChild(option);
  });
}

async function refreshEvents() {
  const user = await ensureLoggedIn();
  if (!user) return;
  const { data: events, error: evError } = await supabaseClient
    .from('events')
    .select('id, profile_id, event_date, comment')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true });
  if (evError) {
    console.error(evError);
    return;
  }
  const { data: profiles, error: prError } = await supabaseClient
    .from('profiles')
    .select('id, name')
    .eq('user_id', user.id);
  if (prError) {
    console.error(prError);
    return;
  }
  // Build a map of events per profile to compute counts
  const eventsByProfile = {};
  events.forEach(ev => {
    const pid = ev.profile_id;
    if (!eventsByProfile[pid]) {
      eventsByProfile[pid] = [];
    }
    eventsByProfile[pid].push(ev);
  });
  // Compute counts for each event sorted by date
  Object.keys(eventsByProfile).forEach(pid => {
    eventsByProfile[pid] = eventsByProfile[pid].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    eventsByProfile[pid].forEach((ev, index) => {
      ev.count = index + 1;
    });
  });
  renderEvents(events, profiles);
}

function renderEvents(events, profiles) {
  const tbody = document.querySelector('#events-table tbody');
  tbody.innerHTML = '';
  events.forEach(ev => {
    const profile = profiles.find(p => p.id === ev.profile_id);
    const tr = document.createElement('tr');
    const dateTd = document.createElement('td');
    // 日付を日本形式に変換
    dateTd.textContent = formatDateJP(ev.event_date);
    const nameTd = document.createElement('td');
    nameTd.textContent = profile ? profile.name : '';
    const countTd = document.createElement('td');
    countTd.textContent = formatCountJp(ev.count);
    const noteTd = document.createElement('td');
    noteTd.textContent = ev.comment || '';
    // 操作列: 編集・削除
    const actionTd = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => {
      // 編集モードに設定
      currentEventId = ev.id;
      document.getElementById('eventId').value = ev.id;
      document.getElementById('profileSelect').value = ev.profile_id;
      document.getElementById('eventDate').value = ev.event_date;
      document.getElementById('eventNote').value = ev.comment || '';
      document.getElementById('eventSubmitBtn').textContent = '更新';
      // 感想入力欄を表示
      document.getElementById('commentField').style.display = 'block';
      // 編集インジケーターを表示
      const indicator = document.getElementById('editingIndicator');
      if (indicator) indicator.style.display = 'block';
      // フォームが画面中央に来るようスクロール
      document.getElementById('event-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    actionTd.appendChild(editBtn);
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', async () => {
      if (confirm('この予定を削除しますか？')) {
        const user = await ensureLoggedIn();
        if (!user) return;
        const { error } = await supabaseClient
          .from('events')
          .delete()
          .eq('id', ev.id)
          .eq('user_id', user.id);
        if (error) {
          alert(error.message);
          return;
        }
        // 削除後は編集モードをキャンセル
        if (currentEventId === ev.id) {
          currentEventId = null;
          document.getElementById('event-form').reset();
          document.getElementById('eventSubmitBtn').textContent = '追加';
          document.getElementById('commentField').style.display = 'none';
          const indicator = document.getElementById('editingIndicator');
          if (indicator) indicator.style.display = 'none';
        }
        refreshEvents();
      }
    });
    actionTd.appendChild(deleteBtn);
    // append to row
    tr.appendChild(dateTd);
    tr.appendChild(nameTd);
    tr.appendChild(countTd);
    tr.appendChild(noteTd);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}