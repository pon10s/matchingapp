// Analytics page script
let currentPeriod = 3;
let currentTab = 'status';
let chart = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;

  // 期間セレクタ
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      loadData();
    });
  });

  // タブ切替
  document.querySelectorAll('.chart-tab').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.chart-tab').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      switchTab(link.dataset.tab);
    });
  });

  loadData();
});

function switchTab(tab) {
  currentTab = tab;
  
  const titles = {
    status: 'ステータス別分布',
    profiles: '月別登録人数',
    events: '月別デート件数',
    app: 'アプリ別分布'
  };
  document.getElementById('chart-title').textContent = titles[tab];
  
  loadData();
}

async function loadData() {
  const user = await ensureLoggedIn();
  if (!user) return;

  // 期間フィルタ
  let dateFilter = null;
  if (currentPeriod !== 'all') {
    const months = parseInt(currentPeriod);
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    dateFilter = date.toISOString();
  }

  // プロフィール取得
  let query = supabaseClient.from('profiles').select('*').eq('user_id', user.id);
  if (dateFilter) {
    query = query.gte('created_at', dateFilter);
  }
  const { data: profiles, error } = await query;
  if (error) {
    console.error(error);
    return;
  }

  // KPI計算
  // 進行中人数（期間無関係）
  const { data: allProfiles } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', user.id);
  const active = allProfiles ? allProfiles.filter(p => p.status !== '終了').length : 0;
  
  // 選択期間の新規登録数
  let periodProfiles = 0;
  
  if (currentPeriod === 'all') {
    periodProfiles = allProfiles ? allProfiles.length : 0;
  } else {
    const months = parseInt(currentPeriod);
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - months);
    periodProfiles = allProfiles ? allProfiles.filter(p => new Date(p.created_at) >= periodStart).length : 0;
  }

  // 選択期間のデート件数
  const { data: allEvents } = await supabaseClient
    .from('events')
    .select('event_date')
    .eq('user_id', user.id);
  
  let periodEvents = 0;
  
  if (currentPeriod === 'all') {
    periodEvents = allEvents ? allEvents.length : 0;
  } else {
    const months = parseInt(currentPeriod);
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - months);
    periodEvents = allEvents ? allEvents.filter(e => new Date(e.event_date) >= periodStart).length : 0;
  }

  // 2回目到達率（期間無関係）
  const { data: eventsByProfile } = await supabaseClient
    .from('events')
    .select('profile_id')
    .eq('user_id', user.id);
  
  const profileEventCount = {};
  if (eventsByProfile) {
    eventsByProfile.forEach(e => {
      profileEventCount[e.profile_id] = (profileEventCount[e.profile_id] || 0) + 1;
    });
  }
  
  const profilesWithEvents = Object.keys(profileEventCount).length;
  const profilesWith2Plus = Object.values(profileEventCount).filter(count => count >= 2).length;
  const secondDateRate = profilesWithEvents > 0 ? Math.round((profilesWith2Plus / profilesWithEvents) * 100) : 0;

  document.getElementById('new-profiles').textContent = periodProfiles > 0 ? '+' + periodProfiles : periodProfiles;
  document.getElementById('event-change').textContent = periodEvents > 0 ? '+' + periodEvents : periodEvents;
  document.getElementById('active-profiles').textContent = active;
  document.getElementById('second-date-rate').textContent = secondDateRate + '%';

  // グラフ描画
  if (currentTab === 'status') {
    drawStatusChart(profiles);
  } else if (currentTab === 'profiles') {
    drawProfilesChart(profiles);
  } else if (currentTab === 'events') {
    await drawEventsChart(user.id);
  } else if (currentTab === 'app') {
    drawAppChart(profiles);
  }
}

function drawStatusChart(profiles) {
  const statusCount = {};
  profiles.forEach(p => {
    const status = p.status || 'わからない';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  const labels = Object.keys(statusCount);
  const data = Object.values(statusCount);
  const colors = {
    '本命': '#E6A5B8',
    'あり': '#9DB7D4',
    'わからない': '#C7CFD9',
    'ビミョウ': '#B8A5A5',
    '大人の関係': '#D4B5D3',
    '友達': '#A8C5E3',
    '終了': '#9CA3AF'
  };
  const backgroundColors = labels.map(l => colors[l] || '#9CA3AF');

  drawChart('doughnut', labels, data, backgroundColors);
}

function drawProfilesChart(profiles) {
  const monthCount = {};
  profiles.forEach(p => {
    const date = new Date(p.created_at);
    const key = `${date.getFullYear()}/${date.getMonth() + 1}`;
    monthCount[key] = (monthCount[key] || 0) + 1;
  });

  const sorted = Object.keys(monthCount).sort();
  const labels = sorted;
  const data = sorted.map(k => monthCount[k]);

  drawChart('bar', labels, data, '#D4B5D3');
}

async function drawEventsChart(userId) {
  // イベント取得
  let query = supabaseClient.from('events').select('event_date').eq('user_id', userId);
  if (currentPeriod !== 'all') {
    const months = parseInt(currentPeriod);
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    query = query.gte('event_date', date.toISOString().split('T')[0]);
  }
  const { data: events, error } = await query;
  if (error) {
    console.error(error);
    return;
  }

  const monthCount = {};
  events.forEach(e => {
    const date = new Date(e.event_date);
    const key = `${date.getFullYear()}/${date.getMonth() + 1}`;
    monthCount[key] = (monthCount[key] || 0) + 1;
  });

  const sorted = Object.keys(monthCount).sort();
  const labels = sorted;
  const data = sorted.map(k => monthCount[k]);

  drawChart('bar', labels, data, '#A8C5E3');
}

function drawAppChart(profiles) {
  const appCount = {};
  profiles.forEach(p => {
    const app = p.app || 'その他';
    appCount[app] = (appCount[app] || 0) + 1;
  });

  const labels = Object.keys(appCount);
  const data = Object.values(appCount);
  const colors = ['#A8C5E3', '#D4B5D3', '#F5D5CB', '#E6A5B8', '#9DB7D4', '#C7CFD9'];

  drawChart('doughnut', labels, data, colors);
}

function drawChart(type, labels, data, colors) {
  const ctx = document.getElementById('analyticsChart');
  
  if (chart) {
    chart.destroy();
  }

  const config = {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: Array.isArray(colors) ? colors : [colors],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  };

  if (type === 'bar') {
    config.options.scales = {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    };
  }

  chart = new Chart(ctx, config);

  // 凡例作成
  const legendEl = document.getElementById('chart-legend');
  legendEl.innerHTML = '';
  labels.forEach((label, i) => {
    const color = Array.isArray(colors) ? colors[i % colors.length] : colors;
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '6px';
    item.style.fontSize = '12px';
    item.innerHTML = `
      <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
      <span>${label}: ${data[i]}</span>
    `;
    legendEl.appendChild(item);
  });
}
