// Events page script

let currentEventId = null;
document.addEventListener('DOMContentLoaded', async () => {
  // ユーザーがログインしているか確認
  const user = await ensureLoggedIn();
  if (!user) return;
  // プロフィールのドロップダウンを初期化
  await populateProfiles();
  // クエリパラメータに profileId がある場合は選択状態にする
  const urlParams = new URLSearchParams(window.location.search);
  const initialProfileId = urlParams.get('profileId');
  if (initialProfileId) {
    document.getElementById('profileSelect').value = initialProfileId;
  }
  
  // 時間帯チップのクリックイベント
  document.querySelectorAll('.time-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('eventType').value = chip.dataset.value;
    });
  });
  
  // フォーム送信処理
  document.getElementById('event-form').addEventListener('submit', async e => {
    e.preventDefault();
    const user = await ensureLoggedIn();
    if (!user) return;
    const profileId = document.getElementById('profileSelect').value;
    const date = document.getElementById('eventDate').value;
    const note = document.getElementById('eventNote').value.trim();
    const eventType = document.getElementById('eventType').value || null;
    if (!profileId || !date) return;
    if (currentEventId) {
      // 編集モード：既存のイベントを更新
      const updateFields = { profile_id: profileId, event_date: date, event_type: eventType };
      // 編集時のみ感想を保存
      updateFields.comment = note;
      const { error } = await supabaseClient
        .from('events')
        .update(updateFields)
        .eq('id', currentEventId)
        .eq('user_id', user.id);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      // 新規登録：コメントは空で挿入
      const { error } = await supabaseClient
        .from('events')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          event_date: date,
          event_type: eventType,
          comment: ''
        });
      if (error) {
        alert(error.message);
        return;
      }
    }
    // フォームリセットと編集モード終了
    document.getElementById('event-form').reset();
    document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('eventType').value = '';
    currentEventId = null;
    document.getElementById('eventSubmitBtn').textContent = '登録';
    document.getElementById('commentField').style.display = 'none';
    const indicator = document.getElementById('editingIndicator');
    if (indicator) indicator.style.display = 'none';
    // 完了画面に遷移
    window.location.href = 'event-success.html';
  });
  // 初期状態では感想入力欄を隠す
  document.getElementById('commentField').style.display = 'none';
});

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

// 回数を日本語表記に変換 (1: 初回, 2: 2回目...)
function formatCountJp(count) {
  if (!count) return '';
  if (count === 1) return '初回';
  return `${count}回目`;
}

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
  // デフォルトオプションを保持
  const defaultOption = select.querySelector('option[value=""]');
  select.innerHTML = '';
  if (defaultOption) {
    select.appendChild(defaultOption);
  }
  profiles.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    select.appendChild(option);
  });
}
