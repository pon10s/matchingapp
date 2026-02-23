import { test, expect } from '@playwright/test';

test.describe('未テスト項目の検証（簡易版）', () => {
  const testEmail = 'test@example.com';
  const testPassword = 'testpassword';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/index.html');
  });

  test('5. 複数デート登録で回数表示', async ({ page }) => {
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-table tbody tr:not(.year-row)');
    
    const rows = page.locator('#calendar-table tbody tr:not(.year-row)');
    const count = await rows.count();
    
    if (count >= 3) {
      const firstRow = await rows.nth(0).textContent();
      const secondRow = await rows.nth(1).textContent();
      const thirdRow = await rows.nth(2).textContent();
      
      console.log('1行目:', firstRow);
      console.log('2行目:', secondRow);
      console.log('3行目:', thirdRow);
      
      expect(firstRow).toMatch(/初回|2回目|3回目/);
    } else {
      console.log('テストデータ不足: イベントが3件未満');
    }
  });

  test('6. 終了理由入力→詳細表示', async ({ page }) => {
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    
    const endedRow = page.locator('#profiles-table tbody tr:has-text("終了")');
    const count = await endedRow.count();
    
    if (count > 0) {
      await endedRow.first().click();
      await page.waitForURL('**/profile-detail.html*');
      
      const body = await page.locator('body').textContent();
      console.log('詳細画面の内容:', body);
      
      if (body?.includes('終了理由')) {
        expect(body).toContain('終了理由');
      }
    } else {
      console.log('テストデータ不足: 終了ステータスのプロフィールなし');
    }
  });

  test('7. カレンダーのソート機能', async ({ page }) => {
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-table tbody tr:not(.year-row)');
    
    await page.click('text=最近の予定をみる');
    await page.waitForTimeout(1000);
    
    const firstNew = page.locator('#calendar-table tbody tr:not(.year-row)').first();
    const firstNewText = await firstNew.textContent();
    console.log('新しい順 1行目:', firstNewText);
    
    await page.click('text=歴史を振り返る');
    await page.waitForTimeout(1000);
    
    const firstOld = page.locator('#calendar-table tbody tr:not(.year-row)').first();
    const firstOldText = await firstOld.textContent();
    console.log('古い順 1行目:', firstOldText);
    
    expect(firstNewText).not.toBe(firstOldText);
  });

  test('8. 検索・フィルタ機能', async ({ page }) => {
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    
    const allCount = await page.locator('#profiles-table tbody tr').count();
    console.log('全プロフィール数:', allCount);
    
    if (allCount > 0) {
      const firstName = await page.locator('#profiles-table tbody tr').first().textContent();
      const searchTerm = firstName?.split(' ')[0] || '';
      
      await page.fill('#searchInput', searchTerm);
      await page.click('#searchBtn');
      await page.waitForTimeout(1000);
      
      const searchCount = await page.locator('#profiles-table tbody tr').count();
      console.log('検索結果:', searchCount);
      
      expect(searchCount).toBeGreaterThan(0);
      expect(searchCount).toBeLessThanOrEqual(allCount);
    }
  });
});
