// Calendar page script: group events by year and date
let currentSortOrder = 'asc'; // デフォルトは昇順

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;
  
  // URLパラメータでsort=descが指定されている場合は降順に設定
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('sort') === 'desc') {
    currentSortOrder = 'desc';
    document.getElementById('sortDescBtn').classList.add('active');
    document.getElementById('sortAscBtn').classList.remove('active');
  }
  
  // 並び替えリンクのイベント
  document.getElementById('sortDescBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    currentSortOrder = 'desc';
    document.getElementById('sortDescBtn').classList.add('active');
    document.getElementById('sortAscBtn').classList.remove('active');
    await refreshCalendar();
  });
  
  document.getElementById('sortAscBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    currentSortOrder = 'asc';
    document.getElementById('sortAscBtn').classList.add('active');
    document.getElementById('sortDescBtn').classList.remove('active');
    await refreshCalendar();
  });
  
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

// 回数を日本語表記に変換 (1: 初回, 2: 2回目...)
function formatCountJp(count) {
  if (!count) return '';
  if (count === 1) return '初回';
  return `${count}回目`;
}

// 時間帯を日本語表記に変換
function formatEventType(eventType) {
  const typeMap = {
    'morning': 'モーニング',
    'lunch': 'ランチ',
    'cafe': 'カフェ',
    'dinner': 'ディナー'
  };
  return typeMap[eventType] || '';
}

async function refreshCalendar() {
  const user = await ensureLoggedIn();
  if (!user) return;
  
  // eventsとprofilesを並列取得
  const [
    { data: events, error: evError },
    { data: profiles, error: prError }
  ] = await Promise.all([
    supabaseClient.from('events').select('id, profile_id, event_date, comment, event_type').eq('user_id', user.id),
    supabaseClient.from('profiles').select('id, name, photo_url').eq('user_id', user.id)
  ]);
  if (evError) { console.error(evError); return; }
  if (prError) { console.error(prError); return; }
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
      id: ev.id,
      name: prof ? prof.name : '',
      count: ev.count,
      comment: ev.comment,
      photo_url: prof ? prof.photo_url : null,
      event_type: ev.event_type
    });
  });
  renderCalendar(eventsByDate);
}

function renderCalendar(eventsByDate) {
  const listEl = document.getElementById('calendar-list');
  listEl.innerHTML = '';
  
  // 日付順にソートしたキーから年単位でグループ化
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
    if (currentSortOrder === 'asc') {
      return new Date(a) - new Date(b);
    } else {
      return new Date(b) - new Date(a);
    }
  });
  
  let currentYear = null;
  
  sortedDates.forEach(dateKey => {
    const dateObj = new Date(dateKey);
    const year = dateObj.getFullYear();
    
    // 年が変わったら年ラベルを追加
    if (year !== currentYear) {
      currentYear = year;
      const yearLabel = document.createElement('div');
      yearLabel.className = 'year-label';
      yearLabel.textContent = `${year}年`;
      listEl.appendChild(yearLabel);
    }
    
    const formattedDate = formatDateJP(dateKey);
    const events = eventsByDate[dateKey];
    
    events.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'date-card';
      card.onclick = () => window.location.href = `edit-event.html?id=${ev.id}&from=calendar`;
      
      // 左側：日付・時間帯・回数
      const leftDiv = document.createElement('div');
      leftDiv.className = 'date-left';
      
      const time = document.createElement('div');
      time.className = 'date-time';
      time.textContent = formattedDate;
      leftDiv.appendChild(time);
      
      if (ev.event_type) {
        const timeTag = document.createElement('div');
        timeTag.className = 'time-tag';
        timeTag.textContent = formatEventType(ev.event_type);
        leftDiv.appendChild(timeTag);
      }
      
      const countTag = document.createElement('div');
      countTag.className = 'count-tag';
      countTag.textContent = formatCountJp(ev.count);
      leftDiv.appendChild(countTag);
      
      card.appendChild(leftDiv);
      
      // 右側：顔写真・名前・感想
      const rightDiv = document.createElement('div');
      rightDiv.className = 'date-right';
      
      const avatar = document.createElement('div');
      avatar.className = 'date-avatar';
      if (ev.photo_url) {
        const img = document.createElement('img');
        img.src = ev.photo_url;
        img.alt = ev.name;
        avatar.appendChild(img);
      }
      rightDiv.appendChild(avatar);
      
      const info = document.createElement('div');
      info.className = 'date-info';
      
      const name = document.createElement('div');
      name.className = 'date-name';
      name.textContent = ev.name;
      info.appendChild(name);
      
      if (ev.comment) {
        const comment = document.createElement('div');
        comment.className = 'date-comment';
        comment.textContent = ev.comment;
        info.appendChild(comment);
      }
      
      rightDiv.appendChild(info);
      card.appendChild(rightDiv);
      
      listEl.appendChild(card);
    });
  });
  
  if (sortedDates.length === 0) {
    const empty = document.createElement('div');
    empty.style.textAlign = 'center';
    empty.style.color = 'var(--color-text-light)';
    empty.style.padding = 'var(--spacing-xl)';
    empty.textContent = 'デート履歴がありません';
    listEl.appendChild(empty);
  }
}
