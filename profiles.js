// Profiles listing page script
let currentFilters = {};

document.addEventListener('DOMContentLoaded', async () => {
  // ユーザーがログインしているか確認
  const user = await ensureLoggedIn();
  if (!user) return;
  
  // LocalStorageからフィルタ読み込み
  loadFiltersFromLocalStorage();
  
  // 新規登録ボタン
  document.getElementById('addNewBtn').addEventListener('click', () => {
    window.location.href = 'edit-profile.html';
  });
  // 検索ボタン
  document.getElementById('searchBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    const keyword = document.getElementById('searchInput').value.trim();
    await refreshProfiles(keyword);
  });
  
  // Enterキーでも検索
  document.getElementById('searchInput').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const keyword = document.getElementById('searchInput').value.trim();
      await refreshProfiles(keyword);
    }
  });
  // フィルタ適用
  document.getElementById('applyFilter').addEventListener('click', async () => {
    await applyAdvancedFilters();
  });
  // フィルタクリア
  document.getElementById('clearFilter').addEventListener('click', async () => {
    document.querySelectorAll('.status-filter').forEach(cb => cb.checked = false);
    currentFilters = {};
    saveFiltersToLocalStorage();
    await refreshProfiles();
  });
  // 初期表示
  refreshProfiles();
});

async function refreshProfiles(keyword = '') {
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
  
  // キーワードフィルタ
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(p => {
      return (
        (p.name && p.name.toLowerCase().includes(kw)) ||
        (p.summary && p.summary.toLowerCase().includes(kw))
      );
    });
  }
  
  // 詳細フィルタ
  if (currentFilters.statuses && currentFilters.statuses.length > 0) {
    filtered = filtered.filter(p => currentFilters.statuses.includes(p.status));
  }
  
  // ステータス順にソート
  const statusOrder = ['本命', 'あり', 'わからない', 'ビミョウ', '大人の関係', '友達', '終了'];
  filtered.sort((a, b) => {
    const aIdx = statusOrder.indexOf(a.status || '');
    const bIdx = statusOrder.indexOf(b.status || '');
    const aOrder = aIdx === -1 ? 999 : aIdx;
    const bOrder = bIdx === -1 ? 999 : bIdx;
    return aOrder - bOrder;
  });
  renderProfiles(filtered);
}

function renderProfiles(profiles) {
  const tbody = document.querySelector('#profiles-table tbody');
  tbody.innerHTML = '';
  profiles.forEach(profile => {
    const tr = document.createElement('tr');
    tr.classList.add('profile-row');
    // 行全体をクリック可能にして詳細画面へ
    tr.addEventListener('click', () => {
      window.location.href = `profile-detail.html?id=${profile.id}`;
    });
    // 人物列: アバターと名前
    const personTd = document.createElement('td');
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.minHeight = '48px';
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
      avatarDiv.style.flexShrink = '0';
      // プレースホルダーには頭文字を表示
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
    // 長文の場合は折り返しつつ最大2行程度で省略
    summaryTd.style.maxWidth = '100%';
    summaryTd.style.whiteSpace = 'normal';
    summaryTd.style.overflow = 'hidden';
    summaryTd.style.textOverflow = 'ellipsis';
    tr.appendChild(summaryTd);
    tbody.appendChild(tr);
  });
}


async function applyAdvancedFilters() {
  const statuses = Array.from(document.querySelectorAll('.status-filter:checked')).map(cb => cb.value);
  currentFilters = { statuses };
  saveFiltersToLocalStorage();
  await refreshProfiles();
}

function saveFiltersToLocalStorage() {
  localStorage.setItem('profileFilters', JSON.stringify(currentFilters));
}

function loadFiltersFromLocalStorage() {
  const saved = localStorage.getItem('profileFilters');
  if (saved) {
    currentFilters = JSON.parse(saved);
    if (currentFilters.statuses) {
      currentFilters.statuses.forEach(status => {
        const cb = document.querySelector(`.status-filter[value="${status}"]`);
        if (cb) cb.checked = true;
      });
    }
  }
}
