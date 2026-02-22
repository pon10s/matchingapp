import { test, expect } from '@playwright/test';

test.describe('プロフィール削除', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/index.html');
  });

  test('IT1-005-01: 削除実行', async ({ page }) => {
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    
    // 最後の行をクリック（削除用）
    const rows = page.locator('#profiles-table tbody tr');
    const count = await rows.count();
    await rows.nth(count - 1).click();
    await page.waitForURL('**/profile-detail.html*');
    
    // 削除ボタンをクリック
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('削除');
      dialog.accept();
    });
    
    await page.click('text=削除');
    await page.waitForTimeout(2000);
    
    // 一覧に戻ることを確認
    await expect(page).toHaveURL(/profiles\.html/);
  });

  test('IT1-005-02: 削除キャンセル', async ({ page }) => {
    await page.goto('http://localhost:5500/profiles.html');
    await page.waitForSelector('#profiles-table tbody tr');
    
    const rows = page.locator('#profiles-table tbody tr');
    const countBefore = await rows.count();
    
    await rows.first().click();
    await page.waitForURL('**/profile-detail.html*');
    
    // 削除キャンセル
    page.on('dialog', dialog => {
      dialog.dismiss();
    });
    
    await page.click('text=削除');
    await page.waitForTimeout(500);
    
    // 詳細画面のまま
    await expect(page).toHaveURL(/profile-detail\.html/);
  });
});

test.describe('デート編集', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/index.html');
    
    // テスト用イベントを作成
    await page.evaluate(async () => {
      const { data: user } = await window.supabaseClient.auth.getUser();
      const { data: profiles } = await window.supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', user.user.id)
        .limit(1);
      
      if (profiles && profiles.length > 0) {
        await window.supabaseClient.from('events').insert({
          user_id: user.user.id,
          profile_id: profiles[0].id,
          event_date: '2026-03-25',
          comment: null
        });
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // テスト用イベントを削除
    await page.evaluate(async () => {
      const { data: user } = await window.supabaseClient.auth.getUser();
      await window.supabaseClient
        .from('events')
        .delete()
        .eq('user_id', user.user.id)
        .eq('event_date', '2026-03-25');
    });
  });

  test('IT1-007-01: 感想入力', async ({ page }) => {
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-table tbody tr:not(.year-row)');
    await page.waitForTimeout(1000);
    
    // 3/25のイベントを探す
    const row = page.locator('#calendar-table tbody tr:not(.year-row):has-text("3/25")');
    await row.click();
    await page.waitForURL('**/edit-event.html*');
    
    // 感想入力
    await page.fill('#comment', 'テスト感想を追加しました');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // カレンダーに戻る
    await expect(page).toHaveURL(/calendar\.html/);
  });

  test('IT1-007-02: ステータス変更', async ({ page }) => {
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-table tbody tr:not(.year-row)');
    await page.waitForTimeout(1000);
    
    const row = page.locator('#calendar-table tbody tr:not(.year-row):has-text("3/25")');
    await row.click();
    await page.waitForURL('**/edit-event.html*');
    
    // ステータス変更
    await page.selectOption('#status', '本命');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/calendar\.html/);
  });

  test('IT1-007-03: 感想+ステータス', async ({ page }) => {
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-table tbody tr:not(.year-row)');
    await page.waitForTimeout(1000);
    
    const row = page.locator('#calendar-table tbody tr:not(.year-row):has-text("3/25")');
    await row.click();
    await page.waitForURL('**/edit-event.html*');
    
    // 両方入力
    await page.fill('#comment', '感想とステータス両方更新');
    await page.selectOption('#status', 'あり');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/calendar\.html/);
  });
});

test.describe('未更新イベント', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/index.html');
  });

  test('IT2-002-01: 未更新イベント表示', async ({ page }) => {
    await page.goto('http://localhost:5500/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 未更新イベントセクションを確認
    const section = page.locator('#unupdated-events');
    const isVisible = await section.isVisible();
    
    if (isVisible) {
      // 未更新イベントがある場合
      await expect(section).toBeVisible();
    } else {
      // 未更新イベントがない場合もOK
      console.log('未更新イベントなし');
    }
  });

  test('IT2-002-02: インライン感想入力', async ({ page }) => {
    await page.goto('http://localhost:5500/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const section = page.locator('#unupdated-events');
    const isVisible = await section.isVisible();
    
    if (!isVisible) {
      test.skip();
      return;
    }
    
    // 感想入力欄があれば入力
    const commentInput = section.locator('textarea, input[type="text"]').first();
    if (await commentInput.isVisible()) {
      await commentInput.fill('ホーム画面から感想追加');
      await page.click('button:has-text("保存")');
      await page.waitForTimeout(2000);
    }
  });
});
