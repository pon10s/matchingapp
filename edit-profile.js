// Edit or add profile page script

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await ensureLoggedIn();
  if (!user) return;
  const idParam = getQueryParam('id');
  const form = document.getElementById('profile-form');
  const cancelBtn = document.getElementById('cancelBtn');
  if (idParam) {
    // 編集モード
    document.getElementById('page-title').textContent = 'プロフィール編集';
    const profileId = idParam;
    document.getElementById('profileId').value = profileId;
    // 既存プロフィールを取得
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.error(error);
    } else if (profile) {
      document.getElementById('nickname').value = profile.nickname || '';
      document.getElementById('matchDate').value = profile.match_date || '';
      document.getElementById('summary').value = profile.summary || '';
      document.getElementById('status').value = profile.status || '';
      document.getElementById('app').value = profile.app || '';
    }
  }
  // Save handler
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const idValue = document.getElementById('profileId').value;
    const data = {
      nickname: document.getElementById('nickname').value.trim(),
      match_date: document.getElementById('matchDate').value || null,
      summary: document.getElementById('summary').value.trim(),
      status: document.getElementById('status').value || null,
      app: document.getElementById('app').value.trim()
    };
    if (!data.nickname) {
      alert('ニックネームは必須です');
      return;
    }
    if (idValue) {
      // Update existing profile
      const { error } = await supabaseClient
        .from('profiles')
        .update(data)
        .eq('id', idValue)
        .eq('user_id', user.id);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      // Add new profile
      const insertData = Object.assign({}, data, { user_id: user.id });
      const { error } = await supabaseClient
        .from('profiles')
        .insert(insertData);
      if (error) {
        alert(error.message);
        return;
      }
    }
    window.location.href = 'profiles.html';
  });
  // Cancel handler
  cancelBtn.addEventListener('click', () => {
    window.location.href = 'profiles.html';
  });
});