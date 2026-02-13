// プロフィール詳細ページ用スクリプト

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;
  const profileId = getQueryParam('id');
  if (!profileId) {
    window.location.href = 'profiles.html';
    return;
  }
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .single();
  if (error) {
    console.error(error);
    alert('プロフィールが見つかりません');
    window.location.href = 'profiles.html';
    return;
  }
  renderProfileDetail(profile);
});

function renderProfileDetail(profile) {
  const detailSection = document.getElementById('detail-section');
  detailSection.innerHTML = '';
  // 写真
  if (profile.photo_url) {
    const img = document.createElement('img');
    img.src = profile.photo_url;
    img.alt = `${profile.name} の写真`;
    img.style.maxWidth = '100%';
    img.style.borderRadius = '8px';
    img.style.marginBottom = '1rem';
    detailSection.appendChild(img);
  }
  // 詳細情報をテーブルとして表示
  const table = document.createElement('table');
  const rows = [];
  const pushRow = (label, value) => {
    const tr = document.createElement('tr');
    const tdLabel = document.createElement('th');
    tdLabel.textContent = label;
    const tdVal = document.createElement('td');
    tdVal.textContent = value !== null && value !== undefined && value !== '' ? value : '-';
    tr.appendChild(tdLabel);
    tr.appendChild(tdVal);
    table.appendChild(tr);
  };
  pushRow('名前', profile.name);
  pushRow('年齢', profile.age);
  pushRow('身長', profile.height);
  pushRow('学歴', profile.education);
  pushRow('年収（万円）', profile.income);
  pushRow('職業', profile.occupation);
  pushRow('住み', profile.residence);
  pushRow('ステータス', profile.status);
  pushRow('出会ったアプリ', profile.app);
  pushRow('どんな人', profile.summary);
  pushRow('メモ', profile.memo);
  pushRow('登録日時', formatDateTime(profile.created_at));
  pushRow('更新日時', formatDateTime(profile.updated_at));
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.querySelectorAll('th').forEach(th => {
    th.style.textAlign = 'left';
    th.style.padding = '0.5rem';
    th.style.verticalAlign = 'top';
    th.style.width = '30%';
    th.style.fontWeight = 'bold';
  });
  table.querySelectorAll('td').forEach(td => {
    td.style.padding = '0.5rem';
  });
  detailSection.appendChild(table);
  // ボタン群
  const btnSection = document.getElementById('detail-buttons');
  btnSection.style.display = 'block';
  document.getElementById('editBtn').onclick = () => {
    window.location.href = `edit-profile.html?id=${profile.id}`;
  };
  document.getElementById('deleteBtn').onclick = async () => {
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
      // 削除後は一覧へ戻る
      window.location.href = 'profiles.html';
    }
  };
  document.getElementById('addEventBtn').onclick = () => {
    window.location.href = `events.html?profileId=${profile.id}`;
  };
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