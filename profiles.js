// Profiles listing page script
document.addEventListener('DOMContentLoaded', async () => {
  // ログインチェック
  const user = await ensureLoggedIn();
  if (!user) return;
  // Initialize events
  document.getElementById('addNewBtn').addEventListener('click', () => {
    // id param omitted indicates new profile
    window.location.href = 'edit-profile.html';
  });
  document.getElementById('searchBtn').addEventListener('click', () => {
    const keyword = document.getElementById('searchInput').value.trim();
    refreshProfiles(keyword);
  });
  // initial load
  refreshProfiles();
});

async function refreshProfiles(filter = '') {
  const user = await ensureLoggedIn();
  if (!user) return;
  // Fetch all profiles for the current user
  const { data: profiles, error } = await supabaseClient
    .from('profiles')
    .select('id, nickname, match_date, status, app, summary')
    .eq('user_id', user.id);
  if (error) {
    console.error(error);
    return;
  }
  let filtered = profiles;
  if (filter) {
    const keyword = filter.toLowerCase();
    filtered = profiles.filter(p => {
      return (
        (p.nickname && p.nickname.toLowerCase().includes(keyword)) ||
        (p.status && p.status.toLowerCase().includes(keyword)) ||
        (p.app && p.app.toLowerCase().includes(keyword)) ||
        (p.summary && p.summary.toLowerCase().includes(keyword))
      );
    });
  }
  renderProfiles(filtered || []);
}

function renderProfiles(profiles) {
  const tbody = document.querySelector('#profiles-table tbody');
  tbody.innerHTML = '';
  profiles.forEach(profile => {
    const tr = document.createElement('tr');
    // ニックネーム
    const nameTd = document.createElement('td');
    nameTd.textContent = profile.nickname;
    tr.appendChild(nameTd);
    // マッチング日
    const dateTd = document.createElement('td');
    dateTd.textContent = profile.match_date || '';
    tr.appendChild(dateTd);
    // ステータス
    const statusTd = document.createElement('td');
    statusTd.textContent = profile.status || '';
    tr.appendChild(statusTd);
    // アプリ名
    const appTd = document.createElement('td');
    appTd.textContent = profile.app || '';
    tr.appendChild(appTd);
    // 一言でいうとどんな人？（summary）
    const summaryTd = document.createElement('td');
    summaryTd.textContent = profile.summary || '';
    tr.appendChild(summaryTd);
    // actions
    const actionTd = document.createElement('td');
    // edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => {
      window.location.href = `edit-profile.html?id=${profile.id}`;
    });
    actionTd.appendChild(editBtn);
    // delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.style.marginLeft = '0.5rem';
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`「${profile.nickname}」を削除しますか？`)) {
        const user = await ensureLoggedIn();
        const { error } = await supabaseClient
          .from('profiles')
          .delete()
          .eq('id', profile.id)
          .eq('user_id', user.id);
        if (error) {
          alert(error.message);
          return;
        }
        refreshProfiles();
      }
    });
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}