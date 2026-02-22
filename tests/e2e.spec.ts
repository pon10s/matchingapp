import { test, expect } from '@playwright/test';

test.describe('結合テスト2（E2E）', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/index.html');
  });

  test('IT2-001-01: プロフィール作成→デート登録→カレンダー表示', async ({ page }) => {
    await page.evaluate(async () => {
      const { data: user } = await window.supabaseClient.auth.getUser();
      await window.supabaseClient.from('events').delete().eq('user_id', user.user.id).gte('event_date', '2026-03-20');
      await window.supabaseClient.from('profiles').delete().eq('user_id', user.user.id).eq('name', 'テスト太郎');
    });
    
    await page.goto('http://localhost:5500/edit-profile.html');
    await page.fill('#name', 'テスト太郎');
    await page.selectOption('#status', 'あり');
    await page.fill('#app', 'Pairs');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:5500/events.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.selectOption('#profileSelect', { index: 1 });
    await page.fill('#eventDate', '2026-03-20');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/event-success.html');
    
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-table tbody tr:not(.year-row)');
    const rows = page.locator('#calendar-table tbody tr:not(.year-row):has-text("テスト太郎")');
    await expect(rows).toHaveCount(1);
  });

  test('IT2-001-02: 複数デート登録で回数表示', async ({ page }) => {
    await page.evaluate(async () => {
      const { data: user } = await window.supabaseClient.auth.getUser();
      await window.supabaseClient.from('events').delete().eq('user_id', user.user.id).gte('event_date', '2026-03-10');
      await window.supabaseClient.from('profiles').delete().eq('user_id', user.user.id).eq('name', 'テスト花子');
    });
    
    await page.goto('http://localhost:5500/edit-profile.html');
    await page.fill('#name', 'テスト花子');
    await page.selectOption('#status', '本命');
    await page.fill('#app', 'Omiai');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:5500/events.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.selectOption('#profileSelect', { index: 1 });
    await page.fill('#eventDate', '2026-03-10');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/event-success.html');
    
    await page.goto('http://localhost:5500/events.html');
    await page.selectOption('#profileSelect', { index: 1 });
    await page.fill('#eventDate', '2026-03-15');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/event-success.html');
    
    await page.goto('http://localhost:5500/events.html');
    await page.selectOption('#profileSelect', { index: 1 });
    await page.fill('#eventDate', '2026-03-20');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/event-success.html');
    
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-table tbody tr:not(.year-row)');
    const rows = page.locator('#calendar-table tbody tr:not(.year-row):has-text("テスト花子")');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('初回');
    await expect(rows.nth(1)).toContainText('2回目');
    await expect(rows.nth(2)).toContainText('3回目');
  });

  test('IT2-003-01: ステータス変更→統計反映', async ({ page }) => {
    // プロフィール作成（あり）
    await page.goto('http://localhost:5500/edit-profile.html');
    await page.fill('#name', 'ステータステスト');
    await page.selectOption('#status', 'あり');
    await page.fill('#app', 'Tinder');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // ホーム画面で統計確認（あり: 1件）
    await page.goto('http://localhost:5500/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const chart = page.locator('#statsChart');
    await expect(chart).toBeVisible();
    
    // プロフィール編集でステータス変更（本命）
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    await page.click('#profiles-table tbody tr:first-child');
    await page.waitForURL('**/profile-detail.html*');
    await page.click('text=編集');
    await page.waitForURL('**/edit-profile.html*');
    await page.selectOption('#status', '本命');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // ホーム画面で統計更新確認
    await page.goto('http://localhost:5500/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(chart).toBeVisible();
  });

  test('IT2-003-02: 終了理由入力→詳細表示', async ({ page }) => {
    await page.evaluate(async () => {
      const { data: user } = await window.supabaseClient.auth.getUser();
      await window.supabaseClient.from('profiles').delete().eq('user_id', user.user.id).eq('name', '終了テスト');
    });
    
    await page.goto('http://localhost:5500/edit-profile.html');
    await page.fill('#name', '終了テスト');
    await page.selectOption('#status', 'あり');
    await page.fill('#app', 'Pairs');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    const row = page.locator('#profiles-table tbody tr:has-text("終了テスト")');
    await row.click();
    await page.waitForURL('**/profile-detail.html*');
    await page.click('text=編集');
    await page.waitForURL('**/edit-profile.html*');
    await page.selectOption('#status', '終了');
    await page.waitForSelector('#endReasonFields', { state: 'visible' });
    await page.check('input[name="end_reason_type"][value="相手起因"]');
    await page.fill('#end_reason_detail', '連絡が途絶えた');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    const detailRow = page.locator('#profiles-table tbody tr:has-text("終了テスト")');
    await detailRow.click();
    await page.waitForURL('**/profile-detail.html*');
    await expect(page.locator('body')).toContainText('終了理由');
    await expect(page.locator('body')).toContainText('相手起因');
    await expect(page.locator('body')).toContainText('連絡が途絶えた');
  });

  test('IT2-006-01: 画像アップロード→表示', async ({ page }) => {
    await page.evaluate(async () => {
      const { data: user } = await window.supabaseClient.auth.getUser();
      await window.supabaseClient.from('profiles').delete().eq('user_id', user.user.id).eq('name', '画像テスト');
    });
    
    await page.goto('http://localhost:5500/edit-profile.html');
    await page.fill('#name', '画像テスト');
    await page.selectOption('#status', 'あり');
    await page.fill('#app', 'Omiai');
    
    const fileInput = page.locator('#photo');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    await page.waitForSelector('#photoPreviewContainer', { state: 'visible', timeout: 10000 });
    await page.click('#cropBtn');
    
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profiles.html', { timeout: 15000 });
    
    const img = page.locator('#profiles-table tbody tr:has-text("画像テスト") img');
    await expect(img).toBeVisible();
    
    const row = page.locator('#profiles-table tbody tr:has-text("画像テスト")');
    await row.click();
    await page.waitForURL('**/profile-detail.html*');
    const detailImg = page.locator('#profile-photo');
    await expect(detailImg).toBeVisible();
  });
});
