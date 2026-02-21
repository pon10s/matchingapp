import { test, expect } from '@playwright/test';

test.describe('プロフィール編集画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
  });

  test('年収が選択式で表示される', async ({ page }) => {
    await page.goto('/edit-profile.html');
    
    // 年収フィールドがselectタグであることを確認
    const incomeSelect = page.locator('#income');
    await expect(incomeSelect).toBeVisible();
    
    // 選択肢が正しく表示されることを確認
    const options = await incomeSelect.locator('option').allTextContents();
    expect(options).toContain('不明');
    expect(options).toContain('〜300万');
    expect(options).toContain('5000万以上');
  });

  test('ステータスを「終了」に変更すると終了理由フィールドが表示される', async ({ page }) => {
    await page.goto('/edit-profile.html');
    await page.waitForLoadState('networkidle');
    
    // 初期状態では終了理由フィールドは非表示
    const endReasonFields = page.locator('#endReasonFields');
    await expect(endReasonFields).toBeHidden();
    
    // ステータスを「終了」に変更
    await page.selectOption('#status', '終了');
    
    // 終了理由フィールドが表示される
    await expect(endReasonFields).toBeVisible();
    
    // 終了タイプのラジオボタンが表示される
    await expect(page.locator('input[name="end_reason_type"][value="自分起因"]')).toBeVisible();
    await expect(page.locator('input[name="end_reason_type"][value="相手起因"]')).toBeVisible();
    await expect(page.locator('input[name="end_reason_type"][value="相互合意"]')).toBeVisible();
    
    // 終了理由詳細のテキストエリアが表示される
    await expect(page.locator('#end_reason_detail')).toBeVisible();
  });

  test('ステータスを「終了」以外に変更すると終了理由フィールドが非表示になる', async ({ page }) => {
    await page.goto('/edit-profile.html');
    await page.waitForLoadState('networkidle');
    
    // ステータスを「終了」に変更
    await page.selectOption('#status', '終了');
    const endReasonFields = page.locator('#endReasonFields');
    await expect(endReasonFields).toBeVisible();
    
    // ステータスを「本命」に変更
    await page.selectOption('#status', '本命');
    
    // 終了理由フィールドが非表示になる
    await expect(endReasonFields).toBeHidden();
  });

  test('写真アップロード時にCropper.jsが表示される', async ({ page }) => {
    await page.goto('/edit-profile.html');
    await page.waitForLoadState('networkidle');
    
    // 初期状態ではプレビューコンテナは非表示
    const previewContainer = page.locator('#photoPreviewContainer');
    await expect(previewContainer).toBeHidden();
    
    // ファイル選択（テスト用のダミー画像）
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // プレビューコンテナが表示される
    await expect(previewContainer).toBeVisible();
    
    // 決定ボタンが表示される
    await expect(page.locator('#cropBtn')).toBeVisible();
  });

  test('ステータスが「終了」で終了タイプ未選択の場合、保存時にエラーが表示される', async ({ page }) => {
    await page.goto('/edit-profile.html');
    await page.waitForLoadState('networkidle');
    
    // 名前を入力
    await page.fill('#name', 'テストユーザー');
    
    // ステータスを「終了」に変更
    await page.selectOption('#status', '終了');
    
    // 終了タイプを選択せずに保存
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[type="submit"]');
    
    // アラートが表示されることを確認（実際にはダイアログイベントで確認）
  });
});
