import { test, expect } from '@playwright/test';

test.describe('デート登録', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html');
    await page.goto('http://localhost:5500/events.html');
  });

  test('TC-EVENT-001: 相手選択・日付入力で登録成功', async ({ page }) => {
    await page.selectOption('#profileSelect', { index: 1 });
    await page.fill('#eventDate', '2026-03-15');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/event-success.html');
    expect(page.url()).toContain('event-success.html');
  });

  test('TC-EVENT-002: 相手未選択でバリデーションエラー', async ({ page }) => {
    await page.fill('#eventDate', '2026-03-15');
    
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('相手');
      dialog.accept();
    });
    
    await page.click('button[type="submit"]');
  });

  test('TC-EVENT-003: 日付未選択でバリデーションエラー', async ({ page }) => {
    await page.selectOption('#profileSelect', { index: 1 });
    
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('日付');
      dialog.accept();
    });
    
    await page.click('button[type="submit"]');
  });
});

test.describe('戦歴カレンダー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html');
    await page.goto('http://localhost:5500/calendar.html');
  });

  test('TC-CAL-001: イベント一覧が日付順に表示される', async ({ page }) => {
    const rows = page.locator('#calendar-table tbody tr:not(.year-row)');
    await expect(rows).toHaveCount(2);
  });

  test('TC-CAL-003: 回数が正しく表示される', async ({ page }) => {
    const firstRow = page.locator('#calendar-table tbody tr:not(.year-row)').first();
    await expect(firstRow).toContainText('1回目');
  });

  test.skip('TC-CAL-005: 新しい順ソート', async ({ page }) => {
    const sortBtn = page.locator('text=最近の予定をみる');
    await sortBtn.click();
    await page.waitForTimeout(2000);
    
    // 最初の行が3/1を含むか確認
    const rows = page.locator('#calendar-table tbody tr:not(.year-row)');
    const firstRowText = await rows.first().textContent();
    expect(firstRowText).toContain('3/1');
  });

  test('TC-CAL-006: 古い順ソート', async ({ page }) => {
    await page.click('text=歴史を振り返る');
    await page.waitForTimeout(500);
    
    const firstRow = page.locator('#calendar-table tbody tr:not(.year-row)').first();
    await expect(firstRow).toContainText('2/15');
  });
});
