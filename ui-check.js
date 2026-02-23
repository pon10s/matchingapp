const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const page = await context.newPage();

  console.log('🔍 UI統一確認開始...\n');

  try {
    // ログイン
    console.log('1. ログインページ確認');
    await page.goto('http://localhost:5500/login.html');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'ui-check-login.png' });

    // ログインボタンをクリック
    await page.click('#show-login');
    await page.waitForTimeout(500);
    
    // テストユーザーでログイン
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 5000 });
    console.log('✅ ログイン成功\n');

    // ホーム
    console.log('2. ホームページ確認');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'ui-check-index.png', fullPage: true });
    
    // bottom-nav確認
    const bottomNav = await page.locator('.bottom-nav').isVisible();
    console.log(`   bottom-nav表示: ${bottomNav ? '✅' : '❌'}`);
    
    // ヘッダー確認
    const header = await page.locator('header').isVisible();
    console.log(`   header表示: ${header ? '✅' : '❌'}`);
    
    // ログアウトボタン確認
    const logoutBtn = await page.locator('.pill-btn').isVisible();
    console.log(`   ログアウトボタン: ${logoutBtn ? '✅' : '❌'}\n`);

    // プロフィール一覧
    console.log('3. プロフィール一覧確認');
    await page.click('button.nav-btn[onclick*="profiles.html"]');
    await page.waitForURL('**/profiles.html');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'ui-check-profiles.png', fullPage: true });
    
    const profilesNav = await page.locator('.bottom-nav').isVisible();
    console.log(`   bottom-nav表示: ${profilesNav ? '✅' : '❌'}`);
    
    const addBtn = await page.locator('#addNewBtn').isVisible();
    console.log(`   新規登録ボタン: ${addBtn ? '✅' : '❌'}\n`);

    // デート登録
    console.log('4. デート登録確認');
    await page.click('.nav-btn:has-text("登録")');
    await page.waitForURL('**/events.html');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'ui-check-events.png', fullPage: true });
    
    const eventsNav = await page.locator('.bottom-nav').isVisible();
    console.log(`   bottom-nav表示: ${eventsNav ? '✅' : '❌'}`);
    
    const eventForm = await page.locator('#event-form').isVisible();
    console.log(`   フォーム表示: ${eventForm ? '✅' : '❌'}\n`);

    // 戦歴
    console.log('5. 戦歴確認');
    await page.click('.nav-btn:has-text("戦歴")');
    await page.waitForURL('**/calendar.html');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'ui-check-calendar.png', fullPage: true });
    
    const calendarNav = await page.locator('.bottom-nav').isVisible();
    console.log(`   bottom-nav表示: ${calendarNav ? '✅' : '❌'}`);
    
    const sortLinks = await page.locator('.sort-link').count();
    console.log(`   並び替えリンク: ${sortLinks === 2 ? '✅' : '❌'}\n`);

    // アカウント
    console.log('6. アカウント確認');
    await page.click('.nav-btn:has-text("設定")');
    await page.waitForURL('**/account.html');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'ui-check-account.png', fullPage: true });
    
    const accountNav = await page.locator('.bottom-nav').isVisible();
    console.log(`   bottom-nav表示: ${accountNav ? '✅' : '❌'}`);
    
    const nicknameForm = await page.locator('#nickname-form').isVisible();
    console.log(`   ニックネームフォーム: ${nicknameForm ? '✅' : '❌'}\n`);

    // プロフィール編集（新規）
    console.log('7. プロフィール編集確認');
    await page.goto('http://localhost:5500/edit-profile.html');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'ui-check-edit-profile.png', fullPage: true });
    
    const editProfileNav = await page.locator('.bottom-nav').isVisible();
    console.log(`   bottom-nav表示: ${editProfileNav ? '✅' : '❌'}`);
    
    const profileForm = await page.locator('#profile-form').isVisible();
    console.log(`   フォーム表示: ${profileForm ? '✅' : '❌'}\n`);

    console.log('✅ 全ページ確認完了！');
    console.log('\n📸 スクリーンショット保存:');
    console.log('   - ui-check-login.png');
    console.log('   - ui-check-index.png');
    console.log('   - ui-check-profiles.png');
    console.log('   - ui-check-events.png');
    console.log('   - ui-check-calendar.png');
    console.log('   - ui-check-account.png');
    console.log('   - ui-check-edit-profile.png');

  } catch (error) {
    console.error('❌ エラー発生:', error.message);
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
