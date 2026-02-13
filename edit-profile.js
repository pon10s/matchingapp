// 編集／登録用ページスクリプト
// 新しいプロフィール項目を扱い、写真アップロードもサポートします。

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
  const photoInput = document.getElementById('photo');
  const photoPreviewContainer = document.getElementById('photoPreviewContainer');
  const photoPreview = document.getElementById('photoPreview');
  // プレビュー表示用
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      photoPreview.src = url;
      photoPreviewContainer.style.display = 'block';
    } else {
      photoPreview.src = '';
      photoPreviewContainer.style.display = 'none';
    }
  });
  if (idParam) {
    // 編集モード
    document.getElementById('page-title').textContent = 'プロフィール編集';
    document.getElementById('profileId').value = idParam;
    // プロフィール取得
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', idParam)
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.error(error);
    } else if (profile) {
      document.getElementById('name').value = profile.name || '';
      document.getElementById('age').value = profile.age || '';
      document.getElementById('height').value = profile.height || '';
      document.getElementById('education').value = profile.education || '';
      document.getElementById('income').value = profile.income || '';
      document.getElementById('occupation').value = profile.occupation || '';
      document.getElementById('residence').value = profile.residence || '';
      document.getElementById('status').value = profile.status || '';
      document.getElementById('app').value = profile.app || '';
      document.getElementById('summary').value = profile.summary || '';
      document.getElementById('memo').value = profile.memo || '';
      if (profile.photo_url) {
        photoPreview.src = profile.photo_url;
        photoPreviewContainer.style.display = 'block';
      }
    }
  }
  // 保存処理
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const idValue = document.getElementById('profileId').value;
    const nameVal = document.getElementById('name').value.trim();
    if (!nameVal) {
      alert('名前は必須です');
      return;
    }
    // 数値項目
    const ageVal = document.getElementById('age').value;
    const heightVal = document.getElementById('height').value;
    const incomeVal = document.getElementById('income').value;
    // 文字項目
    const educationVal = document.getElementById('education').value.trim();
    const occupationVal = document.getElementById('occupation').value.trim();
    const residenceVal = document.getElementById('residence').value.trim();
    const statusVal = document.getElementById('status').value;
    const appVal = document.getElementById('app').value.trim();
    const summaryVal = document.getElementById('summary').value.trim();
    const memoVal = document.getElementById('memo').value.trim();
    // Photo file
    const file = photoInput.files[0];
    let profileId = idValue;
    if (!profileId) {
      // 新規作成の場合はUUIDを生成
      profileId = crypto.randomUUID();
    }
    // prepare data object
    const data = {
      id: profileId,
      user_id: user.id,
      name: nameVal,
      age: ageVal ? parseInt(ageVal, 10) : null,
      height: heightVal ? parseInt(heightVal, 10) : null,
      education: educationVal || null,
      income: incomeVal ? parseInt(incomeVal, 10) : null,
      occupation: occupationVal || null,
      residence: residenceVal || null,
      status: statusVal || null,
      app: appVal || null,
      summary: summaryVal || null,
      memo: memoVal || null
    };
    let photoUrl = null;
f (file) {
  try {
    const fileExt = file.name.split('.').pop();
    const storagePath = `${user.id}/${profileId}/photo.${fileExt}`;
    
    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    
    // upload file (overwrite if exists)
    const { error: uploadErr } = await supabaseClient.storage
      .from('profile-photos')
      .upload(storagePath, arrayBuffer, { 
        upsert: true,
        contentType: file.type  // ← これも追加すると良い
      });
    
    if (uploadErr) {
      console.error(uploadErr);
      alert('写真のアップロードに失敗しました');
    } else {
      const { data: publicData } = supabaseClient.storage
        .from('profile-photos')
        .getPublicUrl(storagePath);
      photoUrl = publicData.publicUrl;
    }
  } catch (e) {
    console.error(e);
    alert('ファイル処理中にエラーが発生しました');
  }
}
    if (photoUrl) {
      data.photo_url = photoUrl;
    }
    try {
      if (idValue) {
        // update existing
        const { error: updErr } = await supabaseClient
          .from('profiles')
          .update(data)
          .eq('id', idValue)
          .eq('user_id', user.id);
        if (updErr) throw updErr;
      } else {
        // insert new (with specified id)
        const { error: insErr } = await supabaseClient
          .from('profiles')
          .insert(data);
        if (insErr) throw insErr;
      }
      // 保存完了後、詳細画面または一覧に戻る
      window.location.href = 'profiles.html';
    } catch (err) {
      alert(err.message);
    }
  });
  // キャンセル処理
  cancelBtn.addEventListener('click', () => {
    window.location.href = 'profiles.html';
  });
});