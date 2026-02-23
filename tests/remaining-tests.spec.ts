import { test, expect } from '@playwright/test';

test.describe('未テスト項目の検証', () => {
  const testEmail = 'e2e-test@example.com';
  const testPassword = 'testpassword123';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    
    // ログイン試行
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    await page.click('#login-form button[type="submit"]');
    
    const url = await page.url();
    if (!url.includes('index.html')) {
      // ログイン失敗＝アカウントがないので作成
      await page.goto('http://localhost:5500/login.html');
      await page.click('#show-register');
      await page.fill('#register-nickname', 'E2Eテスト');
      await page.fill('#register-email', testEmail);
      await page.fill('#register-password', testPassword);
      await page.fill('#register-password-confirm', testPassword);
      
      page.on('dialog', dialog => dialog.accept());
      await page.click('#register-section button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // 再ログイン
      await page.goto('http://localhost:5500/login.html');
      await page.click('#show-login');
      await page.fill('#login-email', testEmail);
      await page.fill('#login-password', testPassword);
      await page.click('#login-form button[type="submit"]');
    }
    
    await page.waitForURL('**/index.html', { timeout: 10000 });
    
    // 既存データをクリーンアップ
    await page.evaluate(async () => {
      const { data: user } = await window.supabaseClient.auth.getUser();
      if (user?.user) {
        await window.supabaseClient.from('events').delete().eq('user_id', user.user.id);
        await window.supabaseClient.from('profiles').delete().eq('user_id', user.user.id);
      }
    });
    
    // テスト用プロフィールを3件作成
    const profiles = [
      { name: 'テスト花子', status: '本命', app: 'Pairs', age: 28 },
      { name: 'テスト美咲', status: 'あり', app: 'Omiai', age: 25 },
      { name: 'テスト愛', status: '終了', app: 'Tinder', age: 30, 
        end_reason_type: '相手起因', end_reason_detail: '連絡が途絶えた' }
    ];
    
    for (const profile of profiles) {
      await page.goto('http://localhost:5500/edit-profile.html');
      await page.fill('#name', profile.name);
      if (profile.age) await page.fill('#age', profile.age.toString());
      await page.selectOption('#status', profile.status);
      await page.fill('#app', profile.app);
      
      if (profile.status === '終了') {
        await page.check(`input[name="end_reason_type"][value="${profile.end_reason_type}"]`);
        await page.fill('#end_reason_detail', profile.end_reason_detail);
      }
      
      await page.click('button[type="submit"]');
      await page.waitForURL('**/profiles.html');
      await page.waitForTimeout(1000);
    }
    
    // テスト花子に3回のデートを登録
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    const hanakoRow = page.locator('#profiles-table tbody tr:has-text("テスト花子")');
    await hanakoRow.click();
    await page.waitForURL('**/profile-detail.html*');
    
    const dates = ['2026-01-10', '2026-01-20', '2026-02-01'];
    for (const date of dates) {
      await page.click('#addEventBtn');
      await page.waitForURL('**/events.html*');
      await page.waitForTimeout(1000);
      await page.selectOption('#profileSelect', { index: 1 });
      await page.fill('#eventDate', date);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/event-success.html');
    }
    
    await page.close();
  });

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
    
    const rows = page.locator('#calendar-table tbody tr:not(.year-row):has-text("テスト花子")');
    await expect(rows).toHaveCount(3);
    
    await expect(rows.nth(0)).toContainText('初回');
    await expect(rows.nth(1)).toContainText('2回目');
    await expect(rows.nth(2)).toContainText('3回目');
  });

  test('6. 終了理由入力→詳細表示', async ({ page }) => {
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    
    const aiRow = page.locator('#profiles-table tbody tr:has-text("テスト愛")');
    await aiRow.click();
    await page.waitForURL('**/profile-detail.html*');
    
    await expect(page.locator('body')).toContainText('終了理由');
    await expect(page.locator('body')).toContainText('相手起因');
    await expect(page.locator('body')).toContainText('連絡が途絶えた');
  });

  test('7. カレンダーのソート機能', async ({ page }) => {
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-table tbody tr:not(.year-row)');
    
    // 新しい順
    await page.click('text=最近の予定をみる');
    await page.waitForTimeout(1000);
    const firstNew = page.locator('#calendar-table tbody tr:not(.year-row)').first();
    const firstNewText = await firstNew.textContent();
    expect(firstNewText).toContain('2/');
    
    // 古い順
    await page.click('text=歴史を振り返る');
    await page.waitForTimeout(1000);
    const firstOld = page.locator('#calendar-table tbody tr:not(.year-row)').first();
    const firstOldText = await firstOld.textContent();
    expect(firstOldText).toContain('1/');
  });

  test('8. 検索・フィルタ機能', async ({ page }) => {
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    
    // 名前検索
    await page.fill('#searchInput', '花子');
    await page.click('#searchBtn');
    await page.waitForTimeout(1000);
    
    const searchRows = page.locator('#profiles-table tbody tr');
    await expect(searchRows).toHaveCount(1);
    await expect(searchRows.first()).toContainText('テスト花子');
    
    // 検索クリア
    await page.fill('#searchInput', '');
    await page.click('#searchBtn');
    await page.waitForTimeout(1000);
    
    // ステータスフィルタ
    await page.locator('#advanced-filter summary').click();
    await page.check('input[value="本命"]');
    await page.click('#applyFilter');
    await page.waitForTimeout(1000);
    
    const filterRows = page.locator('#profiles-table tbody tr');
    await expect(filterRows).toHaveCount(1);
    await expect(filterRows.first()).toContainText('テスト花子');
    
    // フィルタクリア
    await page.click('#clearFilter');
    await page.waitForTimeout(1000);
    const allRows = page.locator('#profiles-table tbody tr');
    await expect(allRows).toHaveCount(3);
  });
});
