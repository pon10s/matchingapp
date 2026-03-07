// プロフィール詳細ページ用スクリプト

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;
  const profileId = getQueryParam('id');
  if (!profileId) { window.location.href = 'profiles.html'; return; }

  // profileとeventsを並列取得
  const [
    { data: profile, error },
    { data: events }
  ] = await Promise.all([
    supabaseClient.from('profiles').select('*').eq('id', profileId).eq('user_id', user.id).single(),
    supabaseClient.from('events').select('id').eq('user_id', user.id).eq('profile_id', profileId).lte('event_date', new Date().toISOString().split('T')[0])
  ]);

  if (error) {
    alert('プロフィールが見つかりません');
    window.location.href = 'profiles.html';
    return;
  }
  
  profile.eventCount = events ? events.length : 0;
  
  renderProfileDetail(profile);
});

function renderProfileDetail(profile) {
  const detailSection = document.getElementById('detail-section');
  detailSection.innerHTML = '';
  
  // ① プロフィールヘッダーカード
  const headerCard = document.createElement('div');
  headerCard.className = 'card';
  headerCard.style.marginBottom = 'var(--spacing-md)';
  headerCard.style.padding = '0';
  headerCard.style.overflow = 'hidden';
  headerCard.style.position = 'relative';
  
  // 写真
  if (profile.photo_url) {
    const img = document.createElement('img');
    img.src = profile.photo_url;
    img.alt = `${profile.name} の写真`;
    img.style.width = '100%';
    img.style.height = '360px';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    headerCard.appendChild(img);
  }
  
  // 情報エリア
  const infoArea = document.createElement('div');
  infoArea.style.padding = 'var(--spacing-lg)';
  infoArea.style.position = 'relative';
  
  // 名前・ステータス・年齢身長を1列に
  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.alignItems = 'center';
  topRow.style.gap = 'var(--spacing-sm)';
  topRow.style.marginBottom = 'var(--spacing-md)';
  
  // 名前
  const nameEl = document.createElement('h2');
  nameEl.textContent = profile.name;
  nameEl.style.fontSize = '28px';
  nameEl.style.fontWeight = '600';
  nameEl.style.color = 'var(--color-text-main)';
  nameEl.style.letterSpacing = '0.02em';
  nameEl.style.margin = '0';
  topRow.appendChild(nameEl);
  
  // ステータスバッジ
  if (profile.status) {
    const statusBadge = document.createElement('span');
    statusBadge.className = 'pill-tag';
    statusBadge.textContent = profile.status;
    statusBadge.style.fontSize = '14px';
    statusBadge.style.display = 'inline-block';
    statusBadge.style.flexShrink = '0';
    
    if (profile.status === '本命') {
      statusBadge.style.background = 'rgba(230, 165, 184, 0.25)';
      statusBadge.style.color = '#E6A5B8';
    } else if (profile.status === 'あり') {
      statusBadge.style.background = 'rgba(157, 183, 212, 0.25)';
      statusBadge.style.color = '#9DB7D4';
    } else if (profile.status === 'わからない') {
      statusBadge.style.background = 'rgba(199, 207, 217, 0.25)';
      statusBadge.style.color = '#C7CFD9';
    } else if (profile.status === 'ビミョウ') {
      statusBadge.style.background = 'rgba(184, 165, 165, 0.25)';
      statusBadge.style.color = '#B8A5A5';
    } else if (profile.status === '大人の関係') {
      statusBadge.style.background = 'rgba(212, 181, 211, 0.25)';
      statusBadge.style.color = '#D4B5D3';
    } else if (profile.status === '友達') {
      statusBadge.style.background = 'rgba(168, 197, 227, 0.25)';
      statusBadge.style.color = '#A8C5E3';
    } else if (profile.status === '終了') {
      statusBadge.style.background = 'rgba(156, 163, 175, 0.25)';
      statusBadge.style.color = '#9CA3AF';
    }
    
    topRow.appendChild(statusBadge);
  }
  
  // 年齢・身長
  const ageHeightDiv = document.createElement('div');
  ageHeightDiv.style.fontSize = '18px';
  ageHeightDiv.style.color = 'var(--color-text-main)';
  ageHeightDiv.style.flexShrink = '0';
  ageHeightDiv.style.marginLeft = 'auto';
  const parts = [];
  if (profile.age) parts.push(`${profile.age}歳`);
  if (profile.height) parts.push(`${profile.height}cm`);
  ageHeightDiv.textContent = parts.join(' / ');
  topRow.appendChild(ageHeightDiv);
  
  infoArea.appendChild(topRow);
  
  // 会った回数タグ（別行）
  const countRow = document.createElement('div');
  countRow.style.display = 'flex';
  countRow.style.justifyContent = 'flex-end';
  
  const countTag = document.createElement('span');
  countTag.className = 'pill-tag';
  countTag.style.fontSize = '15px';
  
  if (profile.eventCount > 0) {
    countTag.style.background = 'rgba(168, 197, 227, 0.2)';
    countTag.style.color = '#7BA7D1';
    countTag.textContent = `${profile.eventCount}回`;
  } else {
    countTag.style.background = 'rgba(156, 163, 175, 0.15)';
    countTag.style.color = '#d1d5db';
    countTag.textContent = '0回';
  }
  
  countRow.appendChild(countTag);
  infoArea.appendChild(countRow);
  
  headerCard.appendChild(infoArea);
  
  detailSection.appendChild(headerCard);
  
  // ② 基本情報カード
  const basicCard = document.createElement('div');
  basicCard.className = 'card';
  basicCard.style.marginBottom = 'var(--spacing-md)';
  
  const basicTitle = document.createElement('h3');
  basicTitle.textContent = '基本情報';
  basicTitle.style.fontSize = '17px';
  basicTitle.style.fontWeight = '600';
  basicTitle.style.color = 'var(--color-text-main)';
  basicTitle.style.marginBottom = 'var(--spacing-md)';
  basicTitle.style.paddingBottom = 'var(--spacing-sm)';
  basicTitle.style.borderBottom = '1px solid rgba(148, 163, 184, 0.15)';
  basicCard.appendChild(basicTitle);
  
  const addField = (label, value) => {
    const field = document.createElement('div');
    field.style.display = 'flex';
    field.style.justifyContent = 'space-between';
    field.style.marginBottom = 'var(--spacing-md)';
    field.style.alignItems = 'center';
    field.style.paddingBottom = 'var(--spacing-sm)';
    field.style.borderBottom = '1px solid rgba(148, 163, 184, 0.08)';
    
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.fontSize = '12px';
    labelEl.style.color = '#94a3b8';
    labelEl.style.fontWeight = '500';
    
    const valueEl = document.createElement('span');
    valueEl.textContent = value !== null && value !== undefined && value !== '' ? value : '-';
    valueEl.style.fontSize = '16px';
    valueEl.style.color = '#4a5568';
    valueEl.style.textAlign = 'right';
    valueEl.style.fontWeight = '500';
    
    field.appendChild(labelEl);
    field.appendChild(valueEl);
    basicCard.appendChild(field);
  };
  
  addField('学歴', profile.education);
  addField('職業', profile.occupation);
  
  let incomeDisplay = profile.income;
  if (incomeDisplay && incomeDisplay.includes('〜') && !incomeDisplay.startsWith('〜')) {
    incomeDisplay = incomeDisplay.replace(/^(\d+)〜/, '$1万〜');
  }
  addField('年収', incomeDisplay);
  addField('住み', profile.residence);
  
  detailSection.appendChild(basicCard);
  
  // 終了理由カード（ステータスが「終了」の場合のみ）
  if (profile.status === '終了') {
    const endCard = document.createElement('div');
    endCard.className = 'card';
    endCard.style.marginBottom = 'var(--spacing-md)';
    
    const endTitle = document.createElement('h3');
    endTitle.textContent = '終了理由';
    endTitle.style.fontSize = '17px';
    endTitle.style.fontWeight = '600';
    endTitle.style.color = 'var(--color-text-main)';
    endTitle.style.marginBottom = 'var(--spacing-md)';
    endTitle.style.paddingBottom = 'var(--spacing-sm)';
    endTitle.style.borderBottom = '1px solid rgba(148, 163, 184, 0.15)';
    endCard.appendChild(endTitle);
    
    const addEndField = (label, value) => {
      const field = document.createElement('div');
      field.style.marginBottom = 'var(--spacing-md)';
      
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.fontSize = '12px';
      labelEl.style.color = '#94a3b8';
      labelEl.style.marginBottom = '6px';
      labelEl.style.fontWeight = '500';
      
      const valueEl = document.createElement('div');
      valueEl.textContent = value !== null && value !== undefined && value !== '' ? value : '-';
      valueEl.style.fontSize = '16px';
      valueEl.style.color = '#4a5568';
      valueEl.style.lineHeight = '1.6';
      
      field.appendChild(labelEl);
      field.appendChild(valueEl);
      endCard.appendChild(field);
    };
    
    addEndField('終了タイプ', profile.end_reason_type);
    addEndField('終了理由詳細', profile.end_reason_detail);
    
    detailSection.appendChild(endCard);
  }
  
  // ③ 関係メモカード
  const memoCard = document.createElement('div');
  memoCard.className = 'card';
  memoCard.style.marginBottom = 'var(--spacing-md)';
  
  const memoTitle = document.createElement('h3');
  memoTitle.textContent = '関係メモ';
  memoTitle.style.fontSize = '17px';
  memoTitle.style.fontWeight = '600';
  memoTitle.style.color = 'var(--color-text-main)';
  memoTitle.style.marginBottom = 'var(--spacing-md)';
  memoTitle.style.paddingBottom = 'var(--spacing-sm)';
  memoTitle.style.borderBottom = '1px solid rgba(148, 163, 184, 0.15)';
  memoCard.appendChild(memoTitle);
  
  const addMemoField = (label, value) => {
    const field = document.createElement('div');
    field.style.marginBottom = 'var(--spacing-md)';
    
    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.fontSize = '12px';
    labelEl.style.color = '#94a3b8';
    labelEl.style.marginBottom = '8px';
    labelEl.style.fontWeight = '500';
    
    const valueEl = document.createElement('div');
    valueEl.textContent = value !== null && value !== undefined && value !== '' ? value : '-';
    valueEl.style.fontSize = '16px';
    valueEl.style.color = '#4a5568';
    valueEl.style.lineHeight = '1.7';
    
    field.appendChild(labelEl);
    field.appendChild(valueEl);
    memoCard.appendChild(field);
  };
  
  addMemoField('出会ったアプリ', profile.app);
  addMemoField('どんな人', profile.summary);
  addMemoField('メモ', profile.memo);
  
  // 登録日・更新日
  const metaInfo = document.createElement('div');
  metaInfo.style.fontSize = '11px';
  metaInfo.style.color = '#94a3b8';
  metaInfo.style.marginTop = 'var(--spacing-md)';
  metaInfo.style.paddingTop = 'var(--spacing-sm)';
  metaInfo.style.borderTop = '1px solid rgba(148, 163, 184, 0.1)';
  metaInfo.style.display = 'flex';
  metaInfo.style.gap = 'var(--spacing-md)';
  metaInfo.style.justifyContent = 'flex-end';
  metaInfo.innerHTML = `<span>登録: ${formatDateTime(profile.created_at)}</span><span>更新: ${formatDateTime(profile.updated_at)}</span>`;
  memoCard.appendChild(metaInfo);
  
  detailSection.appendChild(memoCard);
  
  // ④ アクションエリア
  const btnSection = document.getElementById('detail-buttons');
  btnSection.style.display = 'block';
  btnSection.innerHTML = '';
  btnSection.style.marginTop = 'var(--spacing-lg)';
  
  // 主ボタン2つ横並び
  const mainBtns = document.createElement('div');
  mainBtns.style.display = 'flex';
  mainBtns.style.gap = 'var(--spacing-sm)';
  mainBtns.style.marginBottom = 'var(--spacing-sm)';
  
  const editBtn = document.createElement('button');
  editBtn.textContent = '編集';
  editBtn.style.flex = '1';
  editBtn.style.height = '56px';
  editBtn.style.borderRadius = '30px';
  editBtn.style.border = '1px solid rgba(168, 197, 227, 0.3)';
  editBtn.style.background = 'rgba(255, 255, 255, 0.5)';
  editBtn.style.backdropFilter = 'blur(10px)';
  editBtn.style.webkitBackdropFilter = 'blur(10px)';
  editBtn.style.color = 'var(--color-text-main)';
  editBtn.style.fontSize = '16px';
  editBtn.style.fontWeight = '600';
  editBtn.style.cursor = 'pointer';
  editBtn.style.transition = 'all 0.2s';
  editBtn.style.boxShadow = '0 2px 8px rgba(168, 197, 227, 0.15)';
  editBtn.onclick = () => {
    window.location.href = `edit-profile.html?id=${profile.id}`;
  };
  editBtn.addEventListener('mouseenter', () => {
    editBtn.style.background = 'rgba(255, 255, 255, 0.7)';
    editBtn.style.transform = 'translateY(-1px)';
    editBtn.style.boxShadow = '0 4px 12px rgba(168, 197, 227, 0.25)';
  });
  editBtn.addEventListener('mouseleave', () => {
    editBtn.style.background = 'rgba(255, 255, 255, 0.5)';
    editBtn.style.transform = 'translateY(0)';
    editBtn.style.boxShadow = '0 2px 8px rgba(168, 197, 227, 0.15)';
  });
  mainBtns.appendChild(editBtn);
  
  const addEventBtn = document.createElement('button');
  addEventBtn.textContent = '＋デート登録';
  addEventBtn.style.flex = '1';
  addEventBtn.style.height = '56px';
  addEventBtn.style.borderRadius = '30px';
  addEventBtn.style.border = 'none';
  addEventBtn.style.background = 'rgba(168, 197, 227, 0.7)';
  addEventBtn.style.backdropFilter = 'blur(10px)';
  addEventBtn.style.webkitBackdropFilter = 'blur(10px)';
  addEventBtn.style.color = '#ffffff';
  addEventBtn.style.fontSize = '16px';
  addEventBtn.style.fontWeight = '600';
  addEventBtn.style.cursor = 'pointer';
  addEventBtn.style.transition = 'all 0.2s';
  addEventBtn.style.boxShadow = '0 2px 8px rgba(168, 197, 227, 0.3)';
  addEventBtn.onclick = () => {
    window.location.href = `events.html?profileId=${profile.id}`;
  };
  addEventBtn.addEventListener('mouseenter', () => {
    addEventBtn.style.background = 'rgba(168, 197, 227, 0.85)';
    addEventBtn.style.transform = 'translateY(-1px)';
    addEventBtn.style.boxShadow = '0 4px 12px rgba(168, 197, 227, 0.4)';
  });
  addEventBtn.addEventListener('mouseleave', () => {
    addEventBtn.style.background = 'rgba(168, 197, 227, 0.7)';
    addEventBtn.style.transform = 'translateY(0)';
    addEventBtn.style.boxShadow = '0 2px 8px rgba(168, 197, 227, 0.3)';
  });
  mainBtns.appendChild(addEventBtn);
  
  btnSection.appendChild(mainBtns);
  
  // 削除リンク（テキストのみ）
  const deleteLink = document.createElement('div');
  deleteLink.textContent = '削除';
  deleteLink.style.textAlign = 'center';
  deleteLink.style.marginTop = 'var(--spacing-md)';
  deleteLink.style.color = '#9ca3af';
  deleteLink.style.fontSize = '14px';
  deleteLink.style.fontWeight = '400';
  deleteLink.style.cursor = 'pointer';
  deleteLink.style.transition = 'color 0.2s';
  deleteLink.onclick = async () => {
    if (confirm('このプロフィールを削除しますか？関連するデートも削除されます。')) {
      const user = await ensureLoggedIn();
      if (!user) return;
      const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', profile.id)
        .eq('user_id', user.id);
      if (error) {
        alert(error.message);
        return;
      }
      window.location.href = 'profiles.html';
    }
  };
  deleteLink.addEventListener('mouseenter', () => {
    deleteLink.style.color = '#6b7280';
  });
  deleteLink.addEventListener('mouseleave', () => {
    deleteLink.style.color = '#9ca3af';
  });
  btnSection.appendChild(deleteLink);
}

function formatDateTime(ts) {
  if (!ts) return '-';
  const dateObj = new Date(ts);
  // 年月日と時刻を短く表示（例: 2/13(水) 14:30）
  const weekdays = ['日','月','火','水','木','金','土'];
  const m = dateObj.getMonth() + 1;
  const d = dateObj.getDate();
  const w = weekdays[dateObj.getDay()];
  const hours = dateObj.getHours().toString().padStart(2,'0');
  const mins = dateObj.getMinutes().toString().padStart(2,'0');
  return `${m}/${d}(${w}) ${hours}:${mins}`;
}