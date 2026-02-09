// Edit or add profile page script

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
  const db = initDb();
  if (!db) return;
  const idParam = getQueryParam('id');
  const form = document.getElementById('profile-form');
  const cancelBtn = document.getElementById('cancelBtn');
  if (idParam) {
    // 編集モード
    document.getElementById('page-title').textContent = 'プロフィール編集';
    const id = parseInt(idParam, 10);
    document.getElementById('profileId').value = id;
    const profile = await db.profiles.get(id);
    if (profile) {
      document.getElementById('nickname').value = profile.nickname || '';
      // dateMet remains as stored
      document.getElementById('dateMet').value = profile.dateMet || '';
      document.getElementById('hobbies').value = profile.hobbies || '';
      document.getElementById('statusTag').value = profile.statusTag || '';
      document.getElementById('appTag').value = profile.appTag || '';
    }
  }
  // Save handler
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const idValue = document.getElementById('profileId').value;
    const data = {
      nickname: document.getElementById('nickname').value.trim(),
      dateMet: document.getElementById('dateMet').value,
      hobbies: document.getElementById('hobbies').value.trim(),
      statusTag: document.getElementById('statusTag').value,
      appTag: document.getElementById('appTag').value.trim(),
    };
    if (!data.nickname) {
      alert('ニックネームは必須です');
      return;
    }
    if (idValue) {
      // Update existing
      await db.profiles.update(parseInt(idValue, 10), data);
    } else {
      // Add new
      await db.profiles.add(data);
    }
    window.location.href = 'profiles.html';
  });
  // Cancel handler
  cancelBtn.addEventListener('click', () => {
    window.location.href = 'profiles.html';
  });
});