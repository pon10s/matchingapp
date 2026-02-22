import { test, expect } from '@playwright/test';

test.describe('アカウント削除テスト', () => {
  const testEmail = `test-delete-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testNickname = 'テスト削除ユーザー';

  test('アカウント作成→削除→ログイン失敗', async ({ page }) => {
    // 1. アカウント作成
    await page.goto('http://localhost:5500/login.html');
    await page.click('#show-register');
    await page.fill('#register-nickname', testNickname);
    await page.fill('#register-email', testEmail);
    await page.fill('#register-password', testPassword);
    await page.fill('#register-password-confirm', testPassword);
    await page.click('#register-section button[type="submit"]');
    
    // 登録完了を待つ
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(2000);
    
    // 2. ログイン
    await page.click('#show-login');
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/index.html');
    
    // 3. アカウント削除
    await page.goto('http://localhost:5500/account.html');
    await page.waitForSelector('#delete-account-btn');
    
    let alertShown = false;
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.accept();
      if (dialog.message().includes('削除しました')) {
        alertShown = true;
      }
    });
    
    await page.click('#delete-account-btn');
    
    // リダイレクトを待つ
    await page.waitForURL('**/login.html', { timeout: 15000 });
    
    // 4. 削除したアカウントでログイン試行
    await page.click('#show-login');
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Invalid');
      dialog.accept();
    });
    
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // ログイン画面のままであることを確認
    await expect(page).toHaveURL(/login\.html/);
  });
});
