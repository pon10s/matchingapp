// Profiles listing page script
document.addEventListener('DOMContentLoaded', () => {
  const dbInstance = initDb();
  if (!dbInstance) return;
  // Initialize events
  document.getElementById('addNewBtn').addEventListener('click', () => {
    // id=0 indicates new
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
  const db = initDb();
  if (!db) return;
  let profiles = [];
  if (!filter) {
    profiles = await db.profiles.toArray();
  } else {
    const keyword = filter.toLowerCase();
    profiles = await db.profiles.filter(p => {
      return (
        p.nickname.toLowerCase().includes(keyword) ||
        (p.statusTag && p.statusTag.toLowerCase().includes(keyword)) ||
        (p.appTag && p.appTag.toLowerCase().includes(keyword)) ||
        (p.hobbies && p.hobbies.toLowerCase().includes(keyword))
      );
    }).toArray();
  }
  renderProfiles(profiles);
}

function renderProfiles(profiles) {
  const tbody = document.querySelector('#profiles-table tbody');
  tbody.innerHTML = '';
  profiles.forEach(profile => {
    const tr = document.createElement('tr');
    // name
    const nameTd = document.createElement('td');
    nameTd.textContent = profile.nickname;
    tr.appendChild(nameTd);
    // date
    const dateTd = document.createElement('td');
    dateTd.textContent = profile.dateMet || '';
    tr.appendChild(dateTd);
    // status
    const statusTd = document.createElement('td');
    statusTd.textContent = profile.statusTag || '';
    tr.appendChild(statusTd);
    // app
    const appTd = document.createElement('td');
    appTd.textContent = profile.appTag || '';
    tr.appendChild(appTd);
    // summary (hobbies field repurposed)
    const summaryTd = document.createElement('td');
    summaryTd.textContent = profile.hobbies || '';
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
      const db = initDb();
      if (confirm(`「${profile.nickname}」を削除しますか？`)) {
        await db.profiles.delete(profile.id);
        // cascade delete memos and events
        await db.memos.where('profileId').equals(profile.id).delete();
        await db.events.where('profileId').equals(profile.id).delete();
        refreshProfiles();
      }
    });
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}