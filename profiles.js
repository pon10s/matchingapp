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
  
  // 検索カードの表示非表示トグル
  const toggleBtn = document.getElementById('toggleSearch');
  const searchCard = document.getElementById('searchCard');
  const searchInput = document.getElementById('searchInput');
  
  toggleBtn.addEventListener('click', () => {
    if (searchCard.style.display === 'none') {
      searchCard.style.display = 'block';
      searchInput.focus();
      toggleBtn.style.transform = 'rotate(90deg)';
    } else {
      searchCard.style.display = 'none';
      toggleBtn.style.transform = '';
    }
  });
  
  // 検索入力時にリアルタイムで検索
  searchInput.addEventListener('input', async (e) => {
    const keyword = e.target.value.trim();
    await refreshProfiles(keyword);
  });
  
  // フィルターカードのクリックイベント
  document.querySelectorAll('.filter-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active');
    });
  });
  
  // フィルタ適用
  document.getElementById('applyFilter').addEventListener('click', async () => {
    await applyAdvancedFilters();
  });
  // フィルタクリア
  document.getElementById('clearFilter').addEventListener('click', async () => {
    document.querySelectorAll('.filter-card').forEach(card => card.classList.remove('active'));
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
  
  const { data: profiles, error: profErr } = await supabaseClient
    .from('profiles')
    .select('id, name, status, summary, photo_url, age, height, occupation')
    .eq('user_id', user.id);
  if (profErr) {
    console.error(profErr);
    return;
  }
  
  // イベント数を取得
  const { data: events } = await supabaseClient
    .from('events')
    .select('profile_id')
    .eq('user_id', user.id)
    .lte('event_date', new Date().toISOString().split('T')[0]);
  
  const eventCounts = {};
  if (events) {
    events.forEach(e => {
      eventCounts[e.profile_id] = (eventCounts[e.profile_id] || 0) + 1;
    });
  }
  
  // プロファイルにイベント数を追加
  profiles.forEach(p => {
    p.eventCount = eventCounts[p.id] || 0;
  });
  
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
  const listEl = document.getElementById('profiles-list');
  listEl.innerHTML = '';
  
  profiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.2s';
    card.style.marginBottom = 'var(--spacing-md)';
    
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 6px 20px rgba(100, 120, 160, 0.12)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
    card.addEventListener('click', () => {
      window.location.href = `profile-detail.html?id=${profile.id}`;
    });
    
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '12px';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar';
    avatarDiv.style.width = '50px';
    avatarDiv.style.height = '50px';
    avatarDiv.style.borderRadius = '50%';
    avatarDiv.style.flexShrink = '0';
    avatarDiv.style.overflow = 'hidden';
    
    if (profile.photo_url) {
      const img = document.createElement('img');
      img.src = profile.photo_url;
      img.alt = profile.name;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      avatarDiv.appendChild(img);
    }
    wrapper.appendChild(avatarDiv);
    
    const contentDiv = document.createElement('div');
    contentDiv.style.flex = '1';
    contentDiv.style.minWidth = '0';
    
    const nameAgeWrapper = document.createElement('div');
    nameAgeWrapper.style.marginBottom = '6px';
    
    const nameSpan = document.createElement('span');
    nameSpan.style.fontSize = '16px';
    nameSpan.style.fontWeight = '600';
    nameSpan.style.color = 'var(--color-text-main)';
    nameSpan.textContent = profile.name;
    nameAgeWrapper.appendChild(nameSpan);
    
    // 年齢と身長と職業表示
    const parts = [];
    if (profile.age) parts.push(`${profile.age}歳`);
    if (profile.height) parts.push(`${profile.height}cm`);
    if (profile.occupation) parts.push(profile.occupation);
    if (parts.length > 0) {
      const infoSpan = document.createElement('span');
      infoSpan.style.fontSize = '14px';
      infoSpan.style.fontWeight = '400';
      infoSpan.style.color = '#6b7280';
      infoSpan.style.marginLeft = '8px';
      infoSpan.textContent = parts.join(' / ');
      nameAgeWrapper.appendChild(infoSpan);
    }
    
    contentDiv.appendChild(nameAgeWrapper);
    
    if (profile.summary) {
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'profile-note';
      summaryDiv.style.maxHeight = '2.8em';
      summaryDiv.style.overflow = 'hidden';
      summaryDiv.style.display = '-webkit-box';
      summaryDiv.style.webkitLineClamp = '2';
      summaryDiv.style.webkitBoxOrient = 'vertical';
      summaryDiv.textContent = profile.summary;
      contentDiv.appendChild(summaryDiv);
    }
    
    wrapper.appendChild(contentDiv);
    
    // 右側のタグエリア
    const tagsDiv = document.createElement('div');
    tagsDiv.style.display = 'flex';
    tagsDiv.style.flexDirection = 'column';
    tagsDiv.style.gap = '6px';
    tagsDiv.style.alignItems = 'flex-end';
    tagsDiv.style.flexShrink = '0';
    
    // ステータスタグ
    const status = profile.status || '';
    if (status) {
      const statusTag = document.createElement('span');
      statusTag.className = 'pill-tag';
      statusTag.textContent = status;
      
      // ステータスカラー適用
      if (status === '本命') {
        statusTag.style.background = 'rgba(230, 165, 184, 0.25)';
        statusTag.style.color = '#E6A5B8';
      } else if (status === 'あり') {
        statusTag.style.background = 'rgba(157, 183, 212, 0.25)';
        statusTag.style.color = '#9DB7D4';
      } else if (status === 'わからない') {
        statusTag.style.background = 'rgba(199, 207, 217, 0.25)';
        statusTag.style.color = '#C7CFD9';
      } else if (status === 'ビミョウ') {
        statusTag.style.background = 'rgba(184, 165, 165, 0.25)';
        statusTag.style.color = '#B8A5A5';
      } else if (status === '大人の関係') {
        statusTag.style.background = 'rgba(212, 181, 211, 0.25)';
        statusTag.style.color = '#D4B5D3';
      } else if (status === '友達') {
        statusTag.style.background = 'rgba(168, 197, 227, 0.25)';
        statusTag.style.color = '#A8C5E3';
      } else if (status === '終了') {
        statusTag.style.background = 'rgba(156, 163, 175, 0.25)';
        statusTag.style.color = '#9CA3AF';
      }
      
      tagsDiv.appendChild(statusTag);
    }
    
    // 会った回数タグ
    const countTag = document.createElement('span');
    countTag.className = 'pill-tag';
    
    if (profile.eventCount > 0) {
      countTag.style.background = 'rgba(168, 197, 227, 0.2)';
      countTag.style.color = '#7BA7D1';
      countTag.textContent = `${profile.eventCount}回`;
    } else {
      countTag.style.background = 'rgba(156, 163, 175, 0.15)';
      countTag.style.color = '#d1d5db';
      countTag.textContent = '0回';
    }
    
    tagsDiv.appendChild(countTag);
    
    wrapper.appendChild(tagsDiv);
    
    card.appendChild(wrapper);
    listEl.appendChild(card);
  });
}


async function applyAdvancedFilters() {
  const statuses = Array.from(document.querySelectorAll('.filter-card.active')).map(card => card.dataset.status);
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
        const card = document.querySelector(`.filter-card[data-status="${status}"]`);
        if (card) card.classList.add('active');
      });
    }
  }
}
