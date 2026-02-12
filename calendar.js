// Calendar page script: simple list of events grouped by date
document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;
  refreshCalendar();
});

async function refreshCalendar() {
  const user = await ensureLoggedIn();
  if (!user) return;
  // すべてのイベントとプロフィールを取得
  const { data: events, error: evError } = await supabaseClient
    .from('events')
    .select('id, profile_id, event_date, comment')
    .eq('user_id', user.id);
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
  // Compute counts per profile per date
  const eventsByDate = {};
  // Group events by profile to compute count order
  const eventsByProfile = {};
  events.forEach(ev => {
    const pid = ev.profile_id;
    if (!eventsByProfile[pid]) {
      eventsByProfile[pid] = [];
    }
    eventsByProfile[pid].push(ev);
  });
  Object.keys(eventsByProfile).forEach(pid => {
    eventsByProfile[pid] = eventsByProfile[pid].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    eventsByProfile[pid].forEach((ev, index) => {
      ev.count = index + 1;
    });
  });
  // Group by date
  events.forEach(ev => {
    const date = ev.event_date;
    if (!eventsByDate[date]) {
      eventsByDate[date] = [];
    }
    const profile = profiles.find(p => p.id === ev.profile_id);
    // 感想があれば日本語のかぎ括弧で追加
    const notePart = ev.comment ? `「${ev.comment}」` : '';
    // 名前と回数の間に全角スペースを挿入
    const label = `${profile ? profile.nickname : ''}　${ev.count}回目${notePart}`;
    eventsByDate[date].push(label);
  });
  renderCalendar(eventsByDate);
}

function renderCalendar(eventsByDate) {
  const tbody = document.querySelector('#calendar-table tbody');
  tbody.innerHTML = '';
  Object.keys(eventsByDate).sort().forEach(date => {
    const tr = document.createElement('tr');
    const dateTd = document.createElement('td');
    dateTd.textContent = date;
    const listTd = document.createElement('td');
    // 各イベントを span に分けて余白を確保
    const spans = eventsByDate[date].map(item => {
      return `<span style="margin-right: 1rem;">${item}</span>`;
    });
    listTd.innerHTML = spans.join('');
    tr.appendChild(dateTd);
    tr.appendChild(listTd);
    tbody.appendChild(tr);
  });
}