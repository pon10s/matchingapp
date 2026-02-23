const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5500/profiles.html');
  
  // 10秒待機して確認
  await page.waitForTimeout(10000);
  
  // スクリーンショット
  await page.screenshot({ path: 'profiles-check.png', fullPage: true });
  
  console.log('Screenshot saved as profiles-check.png');
  
  await browser.close();
})();
