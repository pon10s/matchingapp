// Events page script

let currentEventId = null;
document.addEventListener('DOMContentLoaded', async () => {
  // ユーザーがログインしているか確認
  const user = await ensureLoggedIn();
  if (!user) return;
  await populateProfiles();
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
      // 編集時のみコメントを保存
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
      // 新規登録: コメントは空にして挿入
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
    // フォームをリセットし編集モード終了
    document.getElementById('event-form').reset();
    currentEventId = null;
    document.getElementById('eventSubmitBtn').textContent = '追加';
    document.getElementById('commentField').style.display = 'none';
    refreshEvents();
  });
  // 初期状態では感想入力欄を隠す
  document.getElementById('commentField').style.display = 'none';
  refreshEvents();
});

async function populateProfiles() {
  const user = await ensureLoggedIn();
  if (!user) return;
  const { data: profiles, error } = await supabaseClient
    .from('profiles')
    .select('id, nickname')
    .eq('user_id', user.id)
    .order('nickname', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  const select = document.getElementById('profileSelect');
  select.innerHTML = '';
  profiles.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.nickname;
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
    .select('id, nickname')
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
    dateTd.textContent = ev.event_date;
    const nameTd = document.createElement('td');
    nameTd.textContent = profile ? profile.nickname : '';
    const countTd = document.createElement('td');
    countTd.textContent = ev.count || '';
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