const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const page = await context.newPage();

  console.log('🔍 全ページヘッダー確認...\n');

  // ログイン
  await page.goto('http://localhost:5500/login.html');
  await page.click('#show-login');
  await page.waitForTimeout(500);
  await page.fill('#login-email', 'test@example.com');
  await page.fill('#login-password', 'testpassword');
  await page.click('#login-form button[type="submit"]');
  await page.waitForURL('**/index.html');

  const pages = [
    { name: 'ホーム', url: 'index.html' },
    { name: 'プロフィール一覧', url: 'profiles.html' },
    { name: 'デート登録', url: 'events.html' },
    { name: '戦歴', url: 'calendar.html' },
    { name: 'アカウント', url: 'account.html' },
    { name: 'プロフィール編集', url: 'edit-profile.html' }
  ];

  for (const p of pages) {
    await page.goto(`http://localhost:5500/${p.url}`);
    await page.waitForTimeout(500);
    
    const headerText = await page.locator('header span').first().textContent();
    const hasLogo = await page.locator('header img[alt="logo"]').isVisible();
    const hasLogout = await page.locator('header button.pill-btn').isVisible();
    
    console.log(`${p.name}:`);
    console.log(`  ヘッダーテキスト: ${headerText}`);
    console.log(`  ロゴ表示: ${hasLogo ? '✅' : '❌'}`);
    console.log(`  ログアウトボタン: ${hasLogout ? '✅' : '❌'}`);
    console.log('');
    
    await page.screenshot({ path: `header-check-${p.url.replace('.html', '')}.png` });
  }

  console.log('✅ 確認完了！スクリーンショット保存済み');
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
