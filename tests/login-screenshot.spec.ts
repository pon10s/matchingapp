import { test } from '@playwright/test';

test('ログイン画面のスクリーンショット', async ({ page }) => {
  // スマホサイズに設定
  await page.setViewportSize({ width: 375, height: 667 });
  
  // ログイン画面を開く
  await page.goto('http://localhost:5500/login.html');
  
  // トップ画面
  await page.screenshot({ path: 'login-top.png', fullPage: true });
  
  // ログインフォームを表示
  await page.click('#show-login');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'login-form.png', fullPage: true });
  
  // 戻る
  await page.click('#back-to-choice-login');
  await page.waitForTimeout(500);
  
  // 新規登録フォームを表示
  await page.click('#show-register');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'register-form.png', fullPage: true });
});
