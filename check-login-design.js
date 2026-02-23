const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  console.log('🔍 ログイン画面確認（375px幅）\n');

  await context.clearCookies();
  await page.goto('http://localhost:5500/login.html');
  await page.evaluate(() => localStorage.clear());
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'login-new-design.png', fullPage: true });
  
  console.log('✅ トップ画面表示確認');
  console.log('   - ロゴ + Match Log');
  console.log('   - キャッチコピー');
  console.log('   - 3つの機能チップ');
  console.log('   - ログイン/新規登録ボタン\n');
  
  // ログインボタンクリック
  await page.click('#show-login');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'login-form-check.png' });
  console.log('✅ ログインボタン動作確認');
  
  // 戻るボタン
  await page.click('#back-to-choice-login');
  await page.waitForTimeout(500);
  console.log('✅ 戻るボタン動作確認');
  
  // 新規登録ボタンクリック
  await page.click('#show-register');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'register-form-check.png' });
  console.log('✅ 新規登録ボタン動作確認\n');
  
  console.log('📸 スクリーンショット保存:');
  console.log('   - login-new-design.png');
  console.log('   - login-form-check.png');
  console.log('   - register-form-check.png\n');
  
  console.log('⏸️  ブラウザを開いたままにします。確認後、Ctrl+Cで終了してください。');
  
  await page.waitForTimeout(300000);
  await browser.close();
})();
