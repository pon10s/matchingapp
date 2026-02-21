import { test, expect } from '@playwright/test';

test.describe('プロフィール詳細', () => {
  let profileId: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html');
    
    await page.goto('http://localhost:5500/profiles.html');
    await page.locator('#profiles-table tbody tr').first().click();
    await page.waitForURL('**/profile-detail.html*');
    
    const url = new URL(page.url());
    profileId = url.searchParams.get('id') || '';
  });

  test('TC-DETAIL-001: 全項目が正しく表示される', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('山田花子');
    await expect(page.locator('body')).toContainText('28');
    await expect(page.locator('body')).toContainText('本命');
    await expect(page.locator('body')).toContainText('Pairs');
  });

  test('TC-DETAIL-005: 編集ボタンで編集画面へ遷移', async ({ page }) => {
    await page.click('#editBtn');
    await page.waitForURL('**/edit-profile.html*');
    expect(page.url()).toContain('edit-profile.html');
    expect(page.url()).toContain(`id=${profileId}`);
  });

  test('TC-DETAIL-006: デート登録ボタンでデート登録画面へ遷移', async ({ page }) => {
    await page.click('#addEventBtn');
    await page.waitForURL('**/events.html*');
    expect(page.url()).toContain('events.html');
  });

  test('TC-DETAIL-009: 削除キャンセル', async ({ page }) => {
    page.on('dialog', dialog => dialog.dismiss());
    await page.click('#deleteBtn');
    
    await page.waitForTimeout(500);
    expect(page.url()).toContain('profile-detail.html');
  });

  test('TC-DETAIL-010: 戻るボタンで一覧画面へ遷移', async ({ page }) => {
    await page.click('#backBtn');
    await page.waitForURL('**/profiles.html');
    expect(page.url()).toContain('profiles.html');
  });
});
