// 編集／登録用ページスクリプト
// 新しいプロフィール項目を扱い、写真アップロードとトリミングをサポートします。

let cropper = null;
let croppedBlob = null;

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
  const cropBtn = document.getElementById('cropBtn');
  
  // プレビュー表示用
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        photoPreview.src = e.target.result;
        photoPreviewContainer.style.display = 'block';
        // Cropper初期化前にクラスをクリア
        photoPreview.classList.remove('cropper-hidden');
        photoPreview.style.display = 'block';
        photoPreview.style.visibility = 'visible';
        // Cropper初期化
        if (cropper) {
          cropper.destroy();
        }
        // スマホ対応: コンテナのサイズを明示的に設定
        photoPreviewContainer.style.maxWidth = '100%';
        photoPreviewContainer.style.height = 'auto';
        photoPreview.style.maxWidth = '100%';
        photoPreview.style.display = 'block';
        
        // 画像読み込み後にCropperを初期化
        setTimeout(() => {
          cropper = new Cropper(photoPreview, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
          });
        }, 100);
        croppedBlob = null;
      };
      reader.readAsDataURL(file);
    } else {
      photoPreviewContainer.style.display = 'none';
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    }
  });
  
  // トリミング決定
  cropBtn.addEventListener('click', () => {
    if (cropper) {
      cropper.getCroppedCanvas({ width: 300, height: 300 }).toBlob((blob) => {
        croppedBlob = blob;
        alert('トリミング完了！保存してください。');
      }, 'image/jpeg', 0.9);
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
      // 終了理由の読み込み
      if (profile.end_reason_type) {
        const radio = document.querySelector(`input[name="end_reason_type"][value="${profile.end_reason_type}"]`);
        if (radio) radio.checked = true;
      }
      document.getElementById('end_reason_detail').value = profile.end_reason_detail || '';
      // ステータスが「終了」なら終了理由フィールド表示
      if (profile.status === '終了') {
        document.getElementById('endReasonFields').style.display = 'block';
      }
      document.getElementById('app').value = profile.app || '';
      document.getElementById('summary').value = profile.summary || '';
      document.getElementById('memo').value = profile.memo || '';
      if (profile.photo_url) {
        photoPreview.src = profile.photo_url;
        photoPreviewContainer.style.display = 'block';
        // Cropper初期化
        if (cropper) {
          cropper.destroy();
        }
        cropper = new Cropper(photoPreview, {
          aspectRatio: 1,
          viewMode: 1,
          autoCropArea: 1,
          responsive: true
        });
      }
    }
  }
  
  // ステータス変更時の終了理由フィールド表示/非表示
  document.getElementById('status').addEventListener('change', (e) => {
    const endReasonFields = document.getElementById('endReasonFields');
    if (e.target.value === '終了') {
      endReasonFields.style.display = 'block';
    } else {
      endReasonFields.style.display = 'none';
      // 値をクリア
      document.querySelectorAll('input[name="end_reason_type"]').forEach(r => r.checked = false);
      document.getElementById('end_reason_detail').value = '';
    }
  });
  
  // 保存処理
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const idValue = document.getElementById('profileId').value;
    const nameVal = document.getElementById('name').value.trim();
    if (!nameVal) {
      alert('名前は必須です');
      return;
    }
    // ステータスが「終了」の場合、終了タイプは必須
    const statusVal = document.getElementById('status').value;
    if (statusVal === '終了') {
      const endReasonType = document.querySelector('input[name="end_reason_type"]:checked');
      if (!endReasonType) {
        alert('終了タイプを選択してください');
        return;
      }
    }
    // 数値項目
    const ageVal = document.getElementById('age').value;
    const heightVal = document.getElementById('height').value;
    const incomeVal = document.getElementById('income').value;
    // 文字項目
    const educationVal = document.getElementById('education').value.trim();
    const occupationVal = document.getElementById('occupation').value.trim();
    const residenceVal = document.getElementById('residence').value.trim();
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
      income: incomeVal || null,
      occupation: occupationVal || null,
      residence: residenceVal || null,
      status: statusVal || null,
      app: appVal || null,
      summary: summaryVal || null,
      memo: memoVal || null,
      end_reason_type: statusVal === '終了' ? (document.querySelector('input[name="end_reason_type"]:checked')?.value || null) : null,
      end_reason_detail: statusVal === '終了' ? (document.getElementById('end_reason_detail').value.trim() || null) : null
    };
    let photoUrl = null;
    if (croppedBlob) {
      try {
        const fileExt = 'jpg';
        const storagePath = `${user.id}/${profileId}/photo.${fileExt}`;
        // upload file (overwrite if exists)
        const { error: uploadErr } = await supabaseClient.storage
          .from('profile-photos')
          .upload(storagePath, croppedBlob, { upsert: true });
        if (uploadErr) {
          console.error(uploadErr);
          alert('写真のアップロードに失敗しました');
        } else {
          const { data: publicData } = supabaseClient.storage
            .from('profile-photos')
            .getPublicUrl(storagePath);
          // キャッシュバスターを追加
          photoUrl = `${publicData.publicUrl}?t=${Date.now()}`;
        }
      } catch (e) {
        console.error(e);
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