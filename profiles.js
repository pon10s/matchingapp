// Profiles listing page script
document.addEventListener('DOMContentLoaded', async () => {
  // ユーザーがログインしているか確認
  const user = await ensureLoggedIn();
  if (!user) return;
  // 新規登録ボタン
  document.getElementById('addNewBtn').addEventListener('click', () => {
    window.location.href = 'edit-profile.html';
  });
  // 検索ボタン
  document.getElementById('searchBtn').addEventListener('click', () => {
    const keyword = document.getElementById('searchInput').value.trim();
    refreshProfiles(keyword);
  });
  // 初期表示
  refreshProfiles();
});

async function refreshProfiles(filter = '') {
  const user = await ensureLoggedIn();
  if (!user) return;
  // 全プロフィールを取得
  const { data: profiles, error: profErr } = await supabaseClient
    .from('profiles')
    .select('id, name, status, summary')
    .eq('user_id', user.id);
  if (profErr) {
    console.error(profErr);
    return;
  }
  // すべてのイベントを取得し、会った回数を算出（過去日付のみ）
  const today = new Date().toISOString().slice(0, 10);
  const { data: events, error: evErr } = await supabaseClient
    .from('events')
    .select('profile_id, event_date')
    .eq('user_id', user.id);
  if (evErr) {
    console.error(evErr);
    return;
  }
  // 会った回数の辞書
  const meetingCounts = {};
  events.forEach(ev => {
    if (ev.event_date <= today) {
      meetingCounts[ev.profile_id] = (meetingCounts[ev.profile_id] || 0) + 1;
    }
  });
  // 検索フィルタ
  let filtered = profiles;
  if (filter) {
    const keyword = filter.toLowerCase();
    filtered = profiles.filter(p => {
      return (
        (p.name && p.name.toLowerCase().includes(keyword)) ||
        (p.summary && p.summary.toLowerCase().includes(keyword))
      );
    });
  }
  // 会った回数をプロファイルオブジェクトに追加
  const enriched = filtered.map(p => ({
    ...p,
    count: meetingCounts[p.id] || 0
  }));
  renderProfiles(enriched);
}

function renderProfiles(profiles) {
  const tbody = document.querySelector('#profiles-table tbody');
  tbody.innerHTML = '';
  profiles.forEach(profile => {
    const tr = document.createElement('tr');
    // 名前（会った回数）
    const nameTd = document.createElement('td');
    nameTd.textContent = `${profile.name} (${profile.count}回)`;
    tr.appendChild(nameTd);
    // ステータス
    const statusTd = document.createElement('td');
    statusTd.textContent = profile.status || '';
    tr.appendChild(statusTd);
    // どんな人
    const summaryTd = document.createElement('td');
    summaryTd.textContent = profile.summary || '';
    tr.appendChild(summaryTd);
    // 詳細ボタン
    const actionTd = document.createElement('td');
    const detailBtn = document.createElement('button');
    detailBtn.textContent = '詳細';
    detailBtn.addEventListener('click', () => {
      window.location.href = `profile-detail.html?id=${profile.id}`;
    });
    actionTd.appendChild(detailBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}