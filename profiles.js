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
  // プロフィールを取得（写真URLを含む）
  const { data: profiles, error: profErr } = await supabaseClient
    .from('profiles')
    .select('id, name, status, summary, photo_url')
    .eq('user_id', user.id);
  if (profErr) {
    console.error(profErr);
    return;
  }
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
  renderProfiles(filtered);
}

function renderProfiles(profiles) {
  const tbody = document.querySelector('#profiles-table tbody');
  tbody.innerHTML = '';
  profiles.forEach(profile => {
    const tr = document.createElement('tr');
    // 人物列: アバターと名前
    const personTd = document.createElement('td');
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    // avatar
    if (profile.photo_url) {
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'avatar';
      const img = document.createElement('img');
      img.src = profile.photo_url;
      img.alt = profile.name;
      avatarDiv.appendChild(img);
      wrapper.appendChild(avatarDiv);
    } else {
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'avatar-placeholder';
      avatarDiv.textContent = profile.name ? profile.name.charAt(0) : '';
      wrapper.appendChild(avatarDiv);
    }
    const nameSpan = document.createElement('span');
    nameSpan.textContent = profile.name;
    wrapper.appendChild(nameSpan);
    personTd.appendChild(wrapper);
    tr.appendChild(personTd);
    // ステータス列
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