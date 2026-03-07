// ホーム画面用スクリプト
// 統計情報の表示と更新が必要なイベントのリストアップを行います。

let currentChart = null;
let allProfiles = [];
let allEvents = [];
let currentPeriod = '3months';
let currentChartType = 'status';

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

window.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded fired');
  // ログインしていない場合はログインページへリダイレクトします
  const user = await ensureLoggedIn();
  if (!user) return;
  
  console.log('User logged in:', user.id);
  
  // LINE連携・スタッツ・アドバイスを並列実行
  await Promise.all([
    checkLineConnection(user),
    loadStatsAndPending(),
  ]);
  loadAIAdvice(user); // AIは非同期で待たない
  
  console.log('Stats loaded');
  
  // タブ切替
  const chartTabs = document.querySelectorAll('.chart-tab');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      chartTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentChartType = tab.dataset.chart;
      drawChart();
    });
  });
  
  // 期間フィルタ
  document.getElementById('period-filter').addEventListener('change', (e) => {
    currentPeriod = e.target.value;
    drawChart();
  });
});

// LINE連携状況を確認
async function checkLineConnection(user) {
  const { data: settings } = await supabaseClient
    .from('user_settings')
    .select('line_notify_enabled, line_user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  
  const banner = document.getElementById('line-banner');
  
  // LINE連携していない場合はバナーを表示
  if (!settings || !settings.line_user_id) {
    banner.style.display = 'block';
    banner.onclick = async () => {
      // 連携コードを生成
      const code = Math.random().toString(36).substring(2, 15);
      
      // line_connection_codesテーブルに保存
      const { error } = await supabaseClient
        .from('line_connection_codes')
        .insert({
          user_id: user.id,
          code: code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分後
        });
      
      if (error) {
        console.error('Error creating connection code:', error);
        alert('連携コードの生成に失敗しました');
        return;
      }
      
      // 既存ユーザーは「連携します。このまま送信してください。」と事前入力
      const message = encodeURIComponent('連携します。このまま送信してください。');
      const lineUrl = `https://line.me/R/oaMessage/@840izdny/?${message}`;
      console.log('LINE URL (index.js):', lineUrl);
      window.open(lineUrl, '_blank');
    };
  }
}

// AIアドバイスを読み込み
async function loadAIAdvice(user) {
  const adviceEl = document.getElementById('advice-content');
  
  // 運営者のAPIキーを使用
  if (!CONFIG || !CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    adviceEl.textContent = 'AIアドバイス機能は現在設定中です。';
    return;
  }
  
  adviceEl.textContent = 'アドバイスを生成中...';
  
  try {
    // プロフィールデータを取得
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('name, status, app, summary, age')
      .eq('user_id', user.id);
    
    // イベントデータを取得
    const { data: events } = await supabaseClient
      .from('events')
      .select('event_date, comment, profile_id')
      .eq('user_id', user.id)
      .order('event_date', { ascending: false })
      .limit(10);
    
    // 進捗状況を分析
    const today = new Date().toISOString().slice(0, 10);
    const analysis = {
      total: profiles?.length || 0,
      byStatus: {},
      upcomingDates: events?.filter(e => e.event_date >= today).length || 0,
      recentDates: events?.filter(e => e.event_date < today).slice(0, 3) || [],
      needsUpdate: events?.filter(e => e.event_date < today && !e.comment).length || 0
    };
    
    profiles?.forEach(p => {
      const status = p.status || 'わからない';
      analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;
    });
    
    // 最近のデート情報を追加
    const recentDatesInfo = analysis.recentDates.map(e => {
      const profile = profiles?.find(p => p.id === e.profile_id);
      return {
        name: profile?.name || '不明',
        date: e.event_date,
        comment: e.comment || '未記入'
      };
    });
    
    // 改善されたプロンプト（ネットスラング風）
    const prompt = `あなたは「マチアプネキ」という名前の、フレンドリーで親しみやすい恋愛アドバイザーです。
ネットスラングや若者言葉を使って、明るく応援するキャラクターです。

【キャラ設定】
- 「～ンゴ」「～ねー」などの語尾を使う
- 「えらい！」「がんば！」という応援表現
- 「休んでいいのでは？」という優しい言葉
- 「びっぐらぶ」「がんばるぞい」などの応援
- 絶対に説教臭くならない
- フレンドリーで親しみやすい口調

【ユーザーの現在の状況】
- 登録中の相手: ${analysis.total}人
- ステータス別: ${JSON.stringify(analysis.byStatus)}
- 今後の予定: ${analysis.upcomingDates}件
- 未記入のデート: ${analysis.needsUpdate}件

【最近のデート履歴】
${recentDatesInfo.map(d => `- ${d.name}さん (${d.date}): ${d.comment}`).join('\n')}

【アドバイスの方針】
1. 未記入のデートが多い場合：「振り返り書くといいよ～」と優しく促す
2. 本命の相手がいる場合：「びっぐらぶ！」と応援
3. 予定がある場合：「楽しみンゴねー！」と明るく
4. 活動が停滞している場合：「無理せずマイペースで！」と優しく
5. 頑張っている場合：「えらい！」と褒める
6. 疲れていそうな場合：「休んでいいのでは？」と気遣う

【重要な制約】
- 50文字以内で出力すること（必須）
- 絶対に1文だけで終わること
- ネットスラングを自然に使うこと
- 明るく前向きなトーンで話すこと
- 説教臭くならないこと

上記の情報を踏まえて、マチアプネキとしてユーザーにアドバイスをください。`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      if (response.status === 429) {
        adviceEl.textContent = 'APIの利用上限に達しました。しばらく待ってから再読み込みしてください。';
      } else {
        adviceEl.textContent = 'アドバイスの生成に失敗しました。';
      }
      return;
    }
    
    const data = await response.json();
    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || 'アドバイスを生成できませんでした。';
    adviceEl.textContent = advice;
  } catch (error) {
    console.error(error);
    adviceEl.textContent = 'アドバイスの生成に失敗しました。';
  }
}

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

// 統計情報と未更新イベントリストを読み込み表示する
async function loadStatsAndPending() {
  console.log('loadStatsAndPending called');
  const user = await ensureLoggedIn();
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);
  console.log('Today:', today);
  // プロフィールとイベントを並列取得
  const [
    { data: profiles, error: profError },
    { data: events, error: evError }
  ] = await Promise.all([
    supabaseClient.from('profiles').select('id, name, status, summary, app, photo_url').eq('user_id', user.id),
    supabaseClient.from('events').select('id, profile_id, event_date, comment, event_type').eq('user_id', user.id)
  ]);
  if (profError) { console.error('Profile error:', profError); return; }
  if (evError) { console.error('Events error:', evError); return; }
  
  allProfiles = profiles || [];
  allEvents = events || [];
  
  console.log('allProfiles:', allProfiles.length);
  console.log('allEvents:', allEvents.length);
  
  // プロフィール数
  const profilesCount = allProfiles.length;
  document.getElementById('profiles-count').textContent = profilesCount;
  console.log('Set profiles-count to:', profilesCount);
  // 本日以降の予定数
  const upcomingCount = allEvents.filter(ev => ev.event_date >= today).length;
  document.getElementById('upcoming-count').textContent = upcomingCount;
  console.log('Set upcoming-count to:', upcomingCount);
  // 未更新イベント（過去の日付かつ comment が空）
  const pendingEvents = allEvents.filter(ev => {
    return ev.event_date < today && (!ev.comment || ev.comment.trim() === '');
  });
  document.getElementById('pending-count').textContent = pendingEvents.length;
  console.log('Set pending-count to:', pendingEvents.length);
  
  // 今週の予定を表示
  const weekEvents = allEvents.filter(ev => ev.event_date >= today && ev.event_date <= nextWeekStr);
  renderWeekSchedule(weekEvents, allProfiles);
  
  renderPendingList(pendingEvents, allProfiles);
  
  // グラフ描画
  drawChart();
}

// 今週の予定を表示
async function renderWeekSchedule(weekEvents, profiles) {
  const scheduleListEl = document.getElementById('schedule-list');
  scheduleListEl.innerHTML = '';
  
  if (!weekEvents || weekEvents.length === 0) {
    const div = document.createElement('div');
    div.className = 'schedule-item';
    div.innerHTML = '<div class="schedule-info"><div class="schedule-time">予定なし</div></div>';
    scheduleListEl.appendChild(div);
    return;
  }
  
  // 日付順に並び替え
  weekEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  
  for (const ev of weekEvents) {
    const profile = profiles.find(p => p.id === ev.profile_id);
    const div = document.createElement('div');
    div.className = 'schedule-item';
    div.style.cursor = 'pointer';
    div.onclick = () => location.href = `edit-event.html?id=${ev.id}&from=index`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    
    // プロフィール画像があれば表示
    if (profile && profile.photo_url) {
      const img = document.createElement('img');
      img.src = profile.photo_url;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      avatar.appendChild(img);
    }
    
    div.appendChild(avatar);
    
    const info = document.createElement('div');
    info.className = 'schedule-info';
    
    const date = document.createElement('div');
    date.className = 'schedule-time';
    date.textContent = formatDateJP(ev.event_date);
    info.appendChild(date);
    
    const name = document.createElement('div');
    name.className = 'schedule-name';
    name.textContent = profile ? profile.name : '不明';
    info.appendChild(name);
    
    div.appendChild(info);
    
    const tag = document.createElement('span');
    tag.className = 'pill-tag';
    const eventTypeText = ev.event_type ? formatEventType(ev.event_type) : '未定';
    tag.textContent = eventTypeText;
    tag.style.background = 'rgba(210, 180, 160, 0.35)';
    tag.style.color = '#8b7355';
    div.appendChild(tag);
    
    scheduleListEl.appendChild(div);
  }
}

// 予定が終わったデートのリストを描画し、各アイテムで感想とステータスを更新できるようにする
async function renderPendingList(pendingEvents, profiles) {
  const pendingListEl = document.getElementById('pending-list');
  pendingListEl.innerHTML = '';
  if (!pendingEvents || pendingEvents.length === 0) {
    const div = document.createElement('div');
    div.style.textAlign = 'center';
    div.style.color = 'var(--color-text-light)';
    div.style.fontSize = '13px';
    div.style.padding = 'var(--spacing-md)';
    div.textContent = '予定が終わったデートはありません';
    pendingListEl.appendChild(div);
    return;
  }
  // ステータス選択肢
  const statusOptions = ['', '本命', 'あり', 'わからない', 'ビミョウ', '大人の関係', '友達', '終了'];
  // 日付順に並び替え
  pendingEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  const user = await ensureLoggedIn();
  for (const ev of pendingEvents) {
    const profile = profiles.find(p => p.id === ev.profile_id);
    const card = document.createElement('div');
    card.style.background = 'rgba(255,255,255,0.4)';
    card.style.borderRadius = 'var(--radius-medium)';
    card.style.padding = 'var(--spacing-md)';
    card.style.marginBottom = 'var(--spacing-sm)';
    
    // ヘッダー（今週の予定と同じレイアウト）
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = 'var(--spacing-sm)';
    header.style.marginBottom = 'var(--spacing-sm)';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.style.width = '40px';
    avatar.style.height = '40px';
    
    // プロフィール画像があれば表示
    if (profile && profile.photo_url) {
      const img = document.createElement('img');
      img.src = profile.photo_url;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      avatar.appendChild(img);
    }
    
    header.appendChild(avatar);
    
    const info = document.createElement('div');
    info.style.flex = '1';
    
    const date = document.createElement('div');
    date.style.fontSize = '12px';
    date.style.color = 'var(--color-text-light)';
    date.textContent = formatDateJP(ev.event_date);
    info.appendChild(date);
    
    const name = document.createElement('div');
    name.style.fontWeight = '600';
    name.style.fontSize = '14px';
    name.style.color = 'var(--color-text-main)';
    name.textContent = profile ? profile.name : '不明';
    info.appendChild(name);
    
    header.appendChild(info);
    
    const tag = document.createElement('span');
    tag.className = 'pill-tag';
    const eventTypeText = ev.event_type ? formatEventType(ev.event_type) : '未定';
    tag.textContent = eventTypeText;
    tag.style.background = 'rgba(210, 180, 160, 0.35)';
    tag.style.color = '#8b7355';
    header.appendChild(tag);
    
    card.appendChild(header);
    
    // 感想入力
    const noteInput = document.createElement('textarea');
    noteInput.placeholder = '感想を入力';
    noteInput.style.width = '100%';
    noteInput.style.padding = '0.5rem';
    noteInput.style.border = '1px solid rgba(120,150,190,0.18)';
    noteInput.style.borderRadius = 'var(--radius-medium)';
    noteInput.style.background = 'rgba(255,255,255,0.8)';
    noteInput.style.fontSize = '13px';
    noteInput.style.marginBottom = 'var(--spacing-sm)';
    noteInput.style.resize = 'vertical';
    noteInput.style.minHeight = '60px';
    noteInput.style.fontFamily = 'inherit';
    noteInput.style.color = 'var(--color-text-main)';
    card.appendChild(noteInput);
    
    // ステータス選択
    const statusSelect = document.createElement('select');
    statusSelect.style.width = '100%';
    statusSelect.style.padding = '0.5rem';
    statusSelect.style.border = '1px solid rgba(120,150,190,0.18)';
    statusSelect.style.borderRadius = 'var(--radius-medium)';
    statusSelect.style.background = 'rgba(255,255,255,0.8)';
    statusSelect.style.fontSize = '13px';
    statusSelect.style.marginBottom = 'var(--spacing-sm)';
    statusSelect.style.color = '#ccc';
    statusOptions.forEach((opt, index) => {
      const optionEl = document.createElement('option');
      optionEl.value = opt;
      optionEl.textContent = opt === '' ? 'ステータス変更なし' : opt;
      if (index === 0) {
        optionEl.style.color = '#ccc';
      } else {
        optionEl.style.color = 'var(--color-text-main)';
      }
      statusSelect.appendChild(optionEl);
    });
    statusSelect.addEventListener('change', (e) => {
      if (e.target.value === '') {
        e.target.style.color = '#ccc';
      } else {
        e.target.style.color = 'var(--color-text-main)';
      }
    });
    card.appendChild(statusSelect);
    
    // 更新ボタン
    const updateBtn = document.createElement('button');
    updateBtn.textContent = '更新';
    updateBtn.style.background = 'rgba(168, 197, 227, 0.2)';
    updateBtn.style.color = 'var(--color-text-main)';
    updateBtn.style.padding = '6px 16px';
    updateBtn.style.width = '90px';
    updateBtn.style.border = 'none';
    updateBtn.style.borderRadius = 'var(--radius-pill)';
    updateBtn.style.cursor = 'pointer';
    updateBtn.style.fontSize = '13px';
    updateBtn.style.fontWeight = '500';
    updateBtn.style.margin = '0 auto';
    updateBtn.style.display = 'block';
    updateBtn.style.transition = 'all 0.2s';
    updateBtn.addEventListener('mouseover', () => {
      updateBtn.style.background = 'rgba(168, 197, 227, 0.3)';
    });
    updateBtn.addEventListener('mouseout', () => {
      updateBtn.style.background = 'rgba(168, 197, 227, 0.2)';
    });
    updateBtn.addEventListener('click', async () => {
      const note = noteInput.value.trim();
      if (!note) {
        alert('感想を入力してください');
        return;
      }
      const { error: updEventErr } = await supabaseClient
        .from('events')
        .update({ comment: note })
        .eq('id', ev.id)
        .eq('user_id', user.id);
      if (updEventErr) {
        alert(updEventErr.message);
        return;
      }
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
      await loadStatsAndPending();
    });
    card.appendChild(updateBtn);
    
    pendingListEl.appendChild(card);
  }
}


// グラフ描画
function drawChart() {
  console.log('drawChart called, type:', currentChartType);
  if (currentChart) {
    currentChart.destroy();
  }
  
  const canvas = document.getElementById('statsChart');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  
  if (currentChartType === 'status') {
    drawStatusChart(ctx);
  } else if (currentChartType === 'monthly') {
    drawMonthlyChart(ctx);
  } else if (currentChartType === 'app') {
    drawAppChart(ctx);
  }
}

// ステータス別人数グラフ
function drawStatusChart(ctx) {
  console.log('drawStatusChart called');
  const statusCount = {};
  allProfiles.forEach(p => {
    const status = p.status || 'わからない';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  console.log('statusCount:', statusCount);
  
  const labels = Object.keys(statusCount);
  const data = Object.values(statusCount);
  
  if (labels.length === 0) {
    console.log('No data for status chart');
    return;
  }
  
  console.log('Creating chart with labels:', labels, 'data:', data);
  
  currentChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        title: {
          display: true,
          text: 'ステータス別人数'
        }
      }
    }
  });
}

// 月別デート回数グラフ
function drawMonthlyChart(ctx) {
  const now = new Date();
  let startDate;
  
  if (currentPeriod === '3months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  } else if (currentPeriod === '6months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  } else if (currentPeriod === '1year') {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  } else {
    startDate = new Date(0);
  }
  
  const filteredEvents = allEvents.filter(e => new Date(e.event_date) >= startDate);
  
  const monthlyCount = {};
  filteredEvents.forEach(e => {
    const date = new Date(e.event_date);
    const key = `${date.getFullYear()}/${date.getMonth() + 1}`;
    monthlyCount[key] = (monthlyCount[key] || 0) + 1;
  });
  
  const labels = Object.keys(monthlyCount).sort();
  const data = labels.map(l => monthlyCount[l]);
  
  if (labels.length === 0) return;
  
  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'デート回数',
        data: data,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '月別デート回数'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// アプリ別出会い数グラフ
function drawAppChart(ctx) {
  const appCount = {};
  allProfiles.forEach(p => {
    const app = p.app || '不明';
    appCount[app] = (appCount[app] || 0) + 1;
  });
  
  const labels = Object.keys(appCount);
  const data = Object.values(appCount);
  
  if (labels.length === 0) return;
  
  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '出会い数',
        data: data,
        backgroundColor: '#4BC0C0'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'アプリ別出会い数'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}
