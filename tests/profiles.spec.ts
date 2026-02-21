import { test, expect } from '@playwright/test';

test.describe('プロフィール一覧', () => {
  test.beforeEach(async ({ page, context }) => {
    // LocalStorageをクリア
    await context.clearCookies();
    await page.goto('http://localhost:5500/login.html');
    await page.evaluate(() => localStorage.clear());
    
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html');
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForLoadState('networkidle');
  });

  test('TC-PROF-001: プロフィール一覧が表示される', async ({ page }) => {
    const table = page.locator('#profiles-table tbody tr');
    await expect(table).toHaveCount(3);
  });

  test('TC-PROF-002: ステータス順にソートされている', async ({ page }) => {
    const rows = page.locator('#profiles-table tbody tr');
    const firstStatus = await rows.nth(0).locator('td').nth(1).textContent();
    expect(firstStatus).toBe('本命');
  });

  test('TC-PROF-005: 名前で検索成功', async ({ page }) => {
    await page.fill('#searchInput', '山田');
    await page.click('#searchBtn');
    await page.waitForTimeout(1000);
    
    const rows = page.locator('#profiles-table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('山田花子');
  });

  test('TC-PROF-006: どんな人で検索成功', async ({ page }) => {
    await page.fill('#searchInput', '明るくて');
    await page.click('#searchBtn');
    await page.waitForTimeout(1000);
    
    const rows = page.locator('#profiles-table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('山田花子');
  });

  test('TC-PROF-007: 部分一致検索成功', async ({ page }) => {
    await page.fill('#searchInput', '佐藤');
    await page.click('#searchBtn');
    await page.waitForTimeout(1000);
    
    const rows = page.locator('#profiles-table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('佐藤美咲');
  });

  test('TC-PROF-008: 検索結果0件の表示', async ({ page }) => {
    await page.fill('#searchInput', '存在しない名前');
    await page.click('#searchBtn');
    
    const rows = page.locator('#profiles-table tbody tr');
    await expect(rows).toHaveCount(0);
  });

  test('TC-PROF-009: ステータスフィルタ（単一）', async ({ page }) => {
    await page.locator('#advanced-filter summary').click();
    await page.check('input[value="本命"]');
    await page.click('#applyFilter');
    await page.waitForTimeout(1000);
    
    const rows = page.locator('#profiles-table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('山田花子');
  });

  test('TC-PROF-015: フィルタクリア', async ({ page }) => {
    await page.locator('#advanced-filter summary').click();
    await page.check('input[value="本命"]');
    await page.click('#applyFilter');
    
    await page.click('#clearFilter');
    
    const rows = page.locator('#profiles-table tbody tr');
    await expect(rows).toHaveCount(3);
  });

  test('TC-PROF-018: 新規登録ボタンで編集画面へ遷移', async ({ page }) => {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('#addNewBtn')
    ]);
    expect(page.url()).toContain('edit-profile.html');
  });

  test('TC-PROF-019: 行クリックで詳細画面へ遷移', async ({ page }) => {
    await page.locator('#profiles-table tbody tr').first().click();
    await page.waitForURL('**/profile-detail.html*');
    expect(page.url()).toContain('profile-detail.html');
  });
});
