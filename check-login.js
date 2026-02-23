const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const page = await context.newPage();

  console.log('🔍 ログイン画面確認開始...\n');

  // Cookieとストレージをクリア
  await context.clearCookies();
  await page.goto('http://localhost:5500/login.html');
  await page.evaluate(() => localStorage.clear());
  
  console.log('✅ ログイン画面表示中');
  console.log('📸 スクリーンショット: login-design-check.png\n');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'login-design-check.png', fullPage: true });
  
  console.log('確認項目:');
  console.log('- 背景グラデーション');
  console.log('- ボタンデザイン（ログイン/新規登録）');
  console.log('- フォーム入力欄');
  console.log('- レスポンシブ対応\n');
  
  console.log('⏸️  ブラウザを開いたままにします。確認後、Ctrl+Cで終了してください。');
  
  // ブラウザを開いたまま待機
  await page.waitForTimeout(300000); // 5分間待機
  
  await browser.close();
})();
