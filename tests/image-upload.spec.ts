import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('プロフィール編集 - 画像アップロード', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login.html');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/index.html');
    
    // プロフィール編集画面へ
    await page.goto('/edit-profile.html');
  });

  test('PROF-001: 画像選択（PC）', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // テスト用画像のパス
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    // ファイル選択
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles(testImagePath);
    
    // プレビューが表示されることを確認
    const previewContainer = page.locator('#photoPreviewContainer');
    await expect(previewContainer).toBeVisible();
    
    // プレビュー画像が表示されることを確認
    const previewImage = page.locator('#photoPreview');
    await expect(previewImage).toBeVisible();
  });

  test('PROF-002: トリミング表示（スマホ）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles(testImagePath);
    
    // プレビューコンテナが表示される
    const previewContainer = page.locator('#photoPreviewContainer');
    await expect(previewContainer).toBeVisible();
    
    // Cropper.jsが初期化されるまで待機
    await page.waitForTimeout(1000);
    
    // 決定ボタンが表示されることを確認
    const cropBtn = page.locator('#cropBtn');
    await expect(cropBtn).toBeVisible();
  });

  test('PROF-003: トリミング決定', async ({ page }) => {
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles(testImagePath);
    
    // Cropper初期化待機
    await page.waitForTimeout(1000);
    
    // 決定ボタンをクリック
    const cropBtn = page.locator('#cropBtn');
    
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('トリミング完了');
      dialog.accept();
    });
    
    await cropBtn.click();
  });

  test('PROF-004: トリミング後の保存', async ({ page }) => {
    // 名前を入力（必須項目）
    await page.fill('#name', 'テスト太郎');
    
    // 画像をアップロード
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles(testImagePath);
    
    // Cropper初期化待機
    await page.waitForTimeout(1000);
    
    // トリミング決定
    page.on('dialog', dialog => {
      dialog.accept();
    });
    await page.click('#cropBtn');
    
    // フォーム送信
    await page.click('button[type="submit"]');
    
    // プロフィール一覧にリダイレクトされることを確認
    await page.waitForURL('/profiles.html');
  });

  test('画像なしで保存', async ({ page }) => {
    // 名前だけ入力
    await page.fill('#name', 'テスト太郎');
    
    // 保存
    await page.click('button[type="submit"]');
    
    // 成功することを確認
    await page.waitForURL('/profiles.html');
  });
});
