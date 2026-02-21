// ホーム画面用スクリプト
// 統計情報の表示と更新が必要なイベントのリストアップを行います。

let currentChart = null;
let allProfiles = [];
let allEvents = [];
let currentPeriod = '3months';
let currentChartType = 'status';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded fired');
  // ログインしていない場合はログインページへリダイレクトします
  const user = await ensureLoggedIn();
  if (!user) return;
  
  console.log('User logged in:', user.id);
  
  // LINE連携状況を確認
  await checkLineConnection(user);
  
  // AIアドバイスを読み込み
  await loadAIAdvice(user);
  
  // 統計情報と未更新イベントを読み込み
  await loadStatsAndPending();
  
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
    .select('line_notify_enabled')
    .eq('user_id', user.id)
    .single();
  
  // LINE連携していない場合はアナウンスを表示
  if (!settings || !settings.line_notify_enabled) {
    document.getElementById('line-notice').style.display = 'block';
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
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`API呼び出しに失敗: ${response.status}`);
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
  console.log('Today:', today);
  // プロフィールとイベントを取得
  const { data: profiles, error: profError } = await supabaseClient
    .from('profiles')
    .select('id, name, status, summary, app')
    .eq('user_id', user.id);
  if (profError) {
    console.error('Profile error:', profError);
    return;
  }
  console.log('Profiles:', profiles);
  const { data: events, error: evError } = await supabaseClient
    .from('events')
    .select('id, profile_id, event_date, comment')
    .eq('user_id', user.id);
  if (evError) {
    console.error('Events error:', evError);
    return;
  }
  console.log('Events:', events);
  
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
  renderPendingList(pendingEvents, allProfiles);
  
  // グラフ描画
  drawChart();
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
    // 日付を日本形式に変換
    header.textContent = `${formatDateJP(ev.event_date)} ${profile ? profile.name : ''}`;
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
