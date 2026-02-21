import { test, expect } from '@playwright/test';

test.describe('認証機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5500/login.html');
  });

  test('TC-AUTH-001: 正しいメール・パスワードでログイン成功', async ({ page }) => {
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/index.html');
    expect(page.url()).toContain('index.html');
  });

  test('TC-AUTH-002: 間違ったパスワードでログイン失敗', async ({ page }) => {
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'wrongpassword');
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('login.html');
  });

  test('TC-AUTH-003: 存在しないメールでログイン失敗', async ({ page }) => {
    await page.click('#show-login');
    await page.fill('#login-email', 'nonexistent@example.com');
    await page.fill('#login-password', 'testpassword');
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('login.html');
  });

  test('TC-AUTH-004: メール形式不正でバリデーションエラー', async ({ page }) => {
    await page.click('#show-login');
    await page.fill('#login-email', 'invalid-email');
    await page.fill('#login-password', 'testpassword');
    
    const emailInput = page.locator('#login-email');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });
});
