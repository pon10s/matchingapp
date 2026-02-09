// Events page script

let currentEventId = null;
document.addEventListener('DOMContentLoaded', () => {
  const dbInstance = initDb();
  if (!dbInstance) return;
  populateProfiles();
  // フォーム送信処理
  document.getElementById('event-form').addEventListener('submit', async e => {
    e.preventDefault();
    const db = initDb();
    const profileId = parseInt(document.getElementById('profileSelect').value, 10);
    const date = document.getElementById('eventDate').value;
    const note = document.getElementById('eventNote').value.trim();
    if (!profileId || !date) return;
    if (currentEventId) {
      // 編集モード：既存のイベントを更新
      await db.events.update(currentEventId, { profileId, date, note });
    } else {
      // 新規登録: noteは空のまま
      await db.events.add({ profileId, date, note: '' });
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
  const db = initDb();
  const profiles = await db.profiles.toArray();
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
  const db = initDb();
  const events = await db.events.orderBy('date').toArray();
  const profiles = await db.profiles.toArray();
  // Build a map of events per profile to compute counts
  const eventsByProfile = {};
  events.forEach(ev => {
    if (!eventsByProfile[ev.profileId]) {
      eventsByProfile[ev.profileId] = [];
    }
    eventsByProfile[ev.profileId].push(ev);
  });
  // Compute counts for each event
  Object.keys(eventsByProfile).forEach(pid => {
    eventsByProfile[pid] = eventsByProfile[pid].sort((a, b) => new Date(a.date) - new Date(b.date));
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
    const profile = profiles.find(p => p.id === ev.profileId);
    const tr = document.createElement('tr');
    const dateTd = document.createElement('td');
    dateTd.textContent = ev.date;
    const nameTd = document.createElement('td');
    nameTd.textContent = profile ? profile.nickname : '';
    const countTd = document.createElement('td');
    countTd.textContent = ev.count || '';
    const noteTd = document.createElement('td');
    noteTd.textContent = ev.note || '';
    // 操作列: 編集・削除
    const actionTd = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => {
      // 編集モードに設定
      currentEventId = ev.id;
      document.getElementById('eventId').value = ev.id;
      document.getElementById('profileSelect').value = ev.profileId;
      document.getElementById('eventDate').value = ev.date;
      document.getElementById('eventNote').value = ev.note || '';
      document.getElementById('eventSubmitBtn').textContent = '更新';
      // 感想入力欄を表示
      document.getElementById('commentField').style.display = 'block';
    });
    actionTd.appendChild(editBtn);
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', async () => {
      if (confirm('この予定を削除しますか？')) {
        const db = initDb();
        await db.events.delete(ev.id);
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