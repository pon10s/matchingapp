// Calendar page script: simple list of events grouped by date
document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;
  refreshCalendar();
});

// 日付を "M/D(曜日)" 形式にフォーマットするヘルパー
function formatDateJP(dateStr) {
  const date = new Date(dateStr);
  const weekdays = ['日','月','火','水','木','金','土'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = weekdays[date.getDay()];
  return `${m}/${d}(${w})`;
}

async function refreshCalendar() {
  const user = await ensureLoggedIn();
  if (!user) return;
  // イベントを取得
  const { data: events, error: evError } = await supabaseClient
    .from('events')
    .select('id, profile_id, event_date, comment')
    .eq('user_id', user.id);
  if (evError) {
    console.error(evError);
    return;
  }
  // プロフィールを取得（写真含む）
  const { data: profiles, error: prError } = await supabaseClient
    .from('profiles')
    .select('id, name, photo_url')
    .eq('user_id', user.id);
  if (prError) {
    console.error(prError);
    return;
  }
  // プロファイルごとに日付順でソートし、回数を付与
  const eventsByProfile = {};
  events.forEach(ev => {
    if (!eventsByProfile[ev.profile_id]) eventsByProfile[ev.profile_id] = [];
    eventsByProfile[ev.profile_id].push(ev);
  });
  Object.keys(eventsByProfile).forEach(pid => {
    eventsByProfile[pid] = eventsByProfile[pid].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    eventsByProfile[pid].forEach((ev, idx) => {
      ev.count = idx + 1;
    });
  });
  // 日付ごとにイベントをまとめる
  const eventsByDate = {};
  events.forEach(ev => {
    const dateKey = ev.event_date;
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    const prof = profiles.find(p => p.id === ev.profile_id);
    eventsByDate[dateKey].push({
      name: prof ? prof.name : '',
      count: ev.count,
      comment: ev.comment,
      photo_url: prof ? prof.photo_url : null
    });
  });
  renderCalendar(eventsByDate);
}

function renderCalendar(eventsByDate) {
  const tbody = document.querySelector('#calendar-table tbody');
  tbody.innerHTML = '';
  // 日付順にソート
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));
  sortedDates.forEach(dateKey => {
    const formattedDate = formatDateJP(dateKey);
    const events = eventsByDate[dateKey];
    events.forEach((ev, index) => {
      const tr = document.createElement('tr');
      // 日付列: 最初のイベントのみ表示、それ以外は空白
      const dateTd = document.createElement('td');
      dateTd.textContent = index === 0 ? formattedDate : '';
      tr.appendChild(dateTd);
      // 詳細列
      const detailTd = document.createElement('td');
      // イベントアイテムを構築
      const itemDiv = document.createElement('div');
      itemDiv.className = 'event-item';
      // 小さなアバター
      let avatar;
      if (ev.photo_url) {
        avatar = document.createElement('div');
        avatar.className = 'small-avatar';
        const img = document.createElement('img');
        img.src = ev.photo_url;
        img.alt = ev.name;
        avatar.appendChild(img);
      } else {
        avatar = document.createElement('div');
        avatar.className = 'small-avatar';
        avatar.style.backgroundImage = 'linear-gradient(45deg, var(--secondary), var(--tertiary))';
      }
      itemDiv.appendChild(avatar);
      // ラベルとコメント
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'event-details';
      const labelSpan = document.createElement('span');
      labelSpan.className = 'event-label';
      labelSpan.textContent = `${ev.name}　${ev.count}回目`;
      detailsDiv.appendChild(labelSpan);
      if (ev.comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'event-comment';
        commentDiv.textContent = ev.comment;
        detailsDiv.appendChild(commentDiv);
      }
      itemDiv.appendChild(detailsDiv);
      detailTd.appendChild(itemDiv);
      tr.appendChild(detailTd);
      tbody.appendChild(tr);
    });
  });
}