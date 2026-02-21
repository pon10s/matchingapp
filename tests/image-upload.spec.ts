import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('プロフィール編集 - 画像アップロード', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('/index.html');
    
    // プロフィール編集画面へ
    await page.goto('/edit-profile.html');
  });

  test('PROF-001: 画像選択（PC）', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');
    
    // テスト用画像のパス
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    // ファイル選択
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles(testImagePath);
    
    // プレビューが表示されることを確認
    const previewContainer = page.locator('#photoPreviewContainer');
    await expect(previewContainer).toBeVisible({ timeout: 10000 });
    
    // プレビュー画像が表示されることを確認
    const previewImage = page.locator('#photoPreview');
    await expect(previewImage).toBeVisible();
  });

  test('PROF-002: トリミング表示（スマホ）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles(testImagePath);
    
    // プレビューコンテナが表示される
    const previewContainer = page.locator('#photoPreviewContainer');
    await expect(previewContainer).toBeVisible({ timeout: 10000 });
    
    // 決定ボタンが表示されることを確認
    const cropBtn = page.locator('#cropBtn');
    await expect(cropBtn).toBeVisible();
  });

  test('PROF-003: トリミング決定', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles(testImagePath);
    
    // 決定ボタンが表示されるまで待機
    const cropBtn = page.locator('#cropBtn');
    await expect(cropBtn).toBeVisible({ timeout: 10000 });
    
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('トリミング完了');
      dialog.accept();
    });
    
    await cropBtn.click();
  });

  test('PROF-004: トリミング後の保存', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // 名前を入力（必須項目）
    await page.fill('#name', 'テスト太郎');
    
    // 画像をアップロード
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles(testImagePath);
    
    // 決定ボタンが表示されるまで待機
    const cropBtn = page.locator('#cropBtn');
    await expect(cropBtn).toBeVisible({ timeout: 10000 });
    
    // トリミング決定
    page.on('dialog', dialog => {
      dialog.accept();
    });
    await cropBtn.click();
    
    // ダイアログ処理を待つ
    await page.waitForTimeout(500);
    
    // フォーム送信
    await page.click('button[type="submit"]');
    
    // プロフィール一覧にリダイレクトされることを確認
    await page.waitForURL('/profiles.html', { timeout: 15000 });
  });

  test('画像なしで保存', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // 名前だけ入力
    await page.fill('#name', 'テスト太郎2');
    
    // 保存
    await page.click('button[type="submit"]');
    
    // 成功することを確認
    await page.waitForURL('**/profiles.html', { timeout: 15000 });
  });
});
