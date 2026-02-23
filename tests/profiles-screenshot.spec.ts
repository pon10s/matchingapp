import { test } from '@playwright/test';

test('プロフィール一覧画面のスクリーンショット', async ({ page }) => {
  // スマホサイズに設定
  await page.setViewportSize({ width: 375, height: 667 });
  
  // ログイン画面を開く
  await page.goto('http://localhost:5500/login.html');
  
  // ログイン（テストユーザーの情報を使用）
  await page.click('#show-login');
  await page.waitForTimeout(500);
  await page.fill('#login-email', 'test@example.com');
  await page.fill('#login-password', 'password123');
  await page.click('#login-form button[type="submit"]');
  
  // プロフィール一覧画面に遷移
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5500/profiles.html');
  await page.waitForTimeout(1000);
  
  // スクリーンショット
  await page.screenshot({ path: 'profiles-initial.png', fullPage: true });
  
  // 検索ボタンをクリック
  await page.click('#toggleSearch');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'profiles-search-open.png', fullPage: true });
});
