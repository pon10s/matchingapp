// デート編集ページのスクリプト

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;
  
  const eventId = getQueryParam('id');
  const from = getQueryParam('from') || 'calendar';
  
  // ヘッダーの戻るボタンを設定
  const backBtn = document.getElementById('backBtn');
  const backTitle = document.getElementById('backTitle');
  if (from === 'index') {
    backTitle.textContent = 'ホーム';
    backBtn.onclick = () => window.location.href = 'index.html';
  } else {
    backTitle.textContent = '戦歴';
    backBtn.onclick = () => window.location.href = 'calendar.html';
  }
  
  if (!eventId) {
    window.location.href = from === 'index' ? 'index.html' : 'calendar.html';
    return;
  }

  // プロフィール一覧を取得
  await populateProfiles();
  
  // 時間帯チップのクリックイベント
  document.querySelectorAll('.time-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('eventTypeHidden').value = chip.dataset.value;
    });
  });

  // イベント情報を取得
  const { data: event, error } = await supabaseClient
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (error || !event) {
    alert('イベントが見つかりません');
    window.location.href = from === 'index' ? 'index.html' : 'calendar.html';
    return;
  }

  // フォームに値をセット
  document.getElementById('eventId').value = event.id;
  document.getElementById('profileSelect').value = event.profile_id;
  document.getElementById('eventDate').value = event.event_date;
  document.getElementById('eventTypeHidden').value = event.event_type || '';
  document.getElementById('eventNote').value = event.comment || '';
  
  // 時間帯チップをアクティブに
  if (event.event_type) {
    const chip = document.querySelector(`.time-chip[data-value="${event.event_type}"]`);
    if (chip) chip.classList.add('active');
  }

  // 更新処理
  document.getElementById('edit-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const profileId = document.getElementById('profileSelect').value;
    const date = document.getElementById('eventDate').value;
    const eventType = document.getElementById('eventTypeHidden').value || null;
    const note = document.getElementById('eventNote').value.trim();

    const { error: updateError } = await supabaseClient
      .from('events')
      .update({
        profile_id: profileId,
        event_date: date,
        event_type: eventType,
        comment: note
      })
      .eq('id', eventId)
      .eq('user_id', user.id);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    alert('更新しました');
    window.location.href = from === 'index' ? 'index.html' : 'calendar.html';
  });

  // 削除処理
  document.getElementById('deleteBtn').addEventListener('click', async () => {
    if (!confirm('このデートを削除しますか？')) return;

    const { error: deleteError } = await supabaseClient
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    alert('削除しました');
    window.location.href = from === 'index' ? 'index.html' : 'calendar.html';
  });
});

async function populateProfiles() {
  const user = await ensureLoggedIn();
  if (!user) return;
  
  const { data: profiles, error } = await supabaseClient
    .from('profiles')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const select = document.getElementById('profileSelect');
  select.innerHTML = '';
  profiles.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    select.appendChild(option);
  });
}
