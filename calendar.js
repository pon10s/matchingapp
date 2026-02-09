// Calendar page script: simple list of events grouped by date
document.addEventListener('DOMContentLoaded', () => {
  const dbInstance = initDb();
  if (!dbInstance) return;
  refreshCalendar();
});

async function refreshCalendar() {
  const db = initDb();
  const events = await db.events.orderBy('date').toArray();
  const profiles = await db.profiles.toArray();
  // Compute counts per profile per date
  // Build map { date: [ { name, count } ] }
  const eventsByDate = {};
  // Group events by profile to compute count order
  const eventsByProfile = {};
  events.forEach(ev => {
    if (!eventsByProfile[ev.profileId]) {
      eventsByProfile[ev.profileId] = [];
    }
    eventsByProfile[ev.profileId].push(ev);
  });
  Object.keys(eventsByProfile).forEach(pid => {
    eventsByProfile[pid] = eventsByProfile[pid].sort((a, b) => new Date(a.date) - new Date(b.date));
    eventsByProfile[pid].forEach((ev, index) => {
      ev.count = index + 1;
    });
  });
  // Now group by date
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) {
      eventsByDate[ev.date] = [];
    }
    const profile = profiles.find(p => p.id === ev.profileId);
    // 感想があれば日本語のかぎ括弧で追加
    const notePart = ev.note ? `「${ev.note}」` : '';
    // 名前と回数の間に余白を入れるため、全角スペースを挿入
    const label = `${profile ? profile.nickname : ''}　${ev.count}回目${notePart}`;
    eventsByDate[ev.date].push(label);
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