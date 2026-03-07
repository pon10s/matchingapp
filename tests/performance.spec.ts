import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword';

// ログインしてセッションを取得するヘルパー
async function login(page: any) {
  await page.goto('http://localhost:5500/login.html');
  await page.click('#show-login');
  await page.waitForSelector('#login-section', { state: 'visible' });
  await page.fill('#login-email', TEST_EMAIL);
  await page.fill('#login-password', TEST_PASSWORD);
  await page.click('#login-form button[type="submit"]');
  await page.waitForURL('**/index.html', { timeout: 15000 });
}

// ページのパフォーマンス指標を取得するヘルパー
async function getPerformanceMetrics(page: any) {
  return await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      // DOM構築完了まで
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      // ページ完全読み込み
      loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
      // サーバー応答時間
      ttfb: Math.round(nav.responseStart - nav.requestStart),
    };
  });
}

test.describe('性能テスト', () => {
  test.setTimeout(60000);

  test('PERF-001: ホーム画面の読み込み時間', async ({ page }) => {
    await login(page);

    // Supabaseへのリクエスト時間を計測
    const apiTimes: number[] = [];
    page.on('response', response => {
      if (response.url().includes('supabase')) {
        const timing = response.request().timing();
        apiTimes.push(Math.round(timing.responseEnd - timing.requestStart));
      }
    });

    const start = Date.now();
    await page.goto('http://localhost:5500/index.html');
    // KPIカードが数値で表示されるまで待機（データ読み込み完了の目安）
    await page.waitForFunction(() => {
      const el = document.getElementById('profiles-count');
      return el && el.textContent !== '--';
    }, { timeout: 15000 });
    const totalTime = Date.now() - start;

    const metrics = await getPerformanceMetrics(page);

    console.log('=== ホーム画面 ===');
    console.log(`ページ読み込み完了: ${metrics.loadComplete}ms`);
    console.log(`DOMContentLoaded: ${metrics.domContentLoaded}ms`);
    console.log(`TTFB: ${metrics.ttfb}ms`);
    console.log(`データ表示まで: ${totalTime}ms`);
    if (apiTimes.length > 0) {
      console.log(`Supabase APIレスポンス: ${apiTimes.join('ms, ')}ms`);
      console.log(`Supabase API平均: ${Math.round(apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length)}ms`);
    }

    // 基準値: データ表示まで10秒以内
    expect(totalTime).toBeLessThan(10000);
  });

  test('PERF-002: プロフィール一覧の読み込み時間', async ({ page }) => {
    await login(page);

    const apiTimes: number[] = [];
    page.on('response', response => {
      if (response.url().includes('supabase')) {
        const timing = response.request().timing();
        apiTimes.push(Math.round(timing.responseEnd - timing.requestStart));
      }
    });

    const start = Date.now();
    await page.goto('http://localhost:5500/profiles.html');
    // profiles-listが表示されるまで待機
    await page.waitForSelector('#profiles-list', { timeout: 15000 });
    const totalTime = Date.now() - start;

    const metrics = await getPerformanceMetrics(page);

    console.log('=== プロフィール一覧 ===');
    console.log(`ページ読み込み完了: ${metrics.loadComplete}ms`);
    console.log(`データ表示まで: ${totalTime}ms`);
    if (apiTimes.length > 0) {
      console.log(`Supabase API平均: ${Math.round(apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length)}ms`);
    }

    expect(totalTime).toBeLessThan(10000);
  });

  test('PERF-003: カレンダー画面の読み込み時間', async ({ page }) => {
    await login(page);

    const start = Date.now();
    await page.goto('http://localhost:5500/calendar.html');
    await page.waitForSelector('#calendar-list', { timeout: 15000 });
    const totalTime = Date.now() - start;

    const metrics = await getPerformanceMetrics(page);

    console.log('=== カレンダー画面 ===');
    console.log(`ページ読み込み完了: ${metrics.loadComplete}ms`);
    console.log(`データ表示まで: ${totalTime}ms`);

    expect(totalTime).toBeLessThan(10000);
  });

  test('PERF-004: 分析画面（グラフ）の読み込み時間', async ({ page }) => {
    await login(page);

    const start = Date.now();
    await page.goto('http://localhost:5500/analytics.html');
    await page.waitForSelector('canvas', { timeout: 15000 });
    const totalTime = Date.now() - start;

    const metrics = await getPerformanceMetrics(page);

    console.log('=== 分析画面 ===');
    console.log(`ページ読み込み完了: ${metrics.loadComplete}ms`);
    console.log(`グラフ表示まで: ${totalTime}ms`);

    expect(totalTime).toBeLessThan(10000);
  });

  test('PERF-005: 画面遷移の連続操作', async ({ page }) => {
    await login(page);

    const pages = [
      { url: 'profiles.html', selector: '#profiles-list' },
      { url: 'events.html', selector: '#profileSelect' },
      { url: 'calendar.html', selector: '#calendar-list' },
      { url: 'analytics.html', selector: 'canvas' },
      { url: 'account.html', selector: '#current-email' },
      { url: 'index.html', selector: '#profiles-count' },
    ];

    const times: { page: string; ms: number }[] = [];

    for (const p of pages) {
      const start = Date.now();
      await page.goto(`http://localhost:5500/${p.url}`);
      await page.waitForSelector(p.selector, { timeout: 15000 });
      const ms = Date.now() - start;
      times.push({ page: p.url, ms });
    }

    console.log('=== 画面遷移時間 ===');
    times.forEach(t => console.log(`${t.page}: ${t.ms}ms`));
    const avg = Math.round(times.reduce((a, b) => a + b.ms, 0) / times.length);
    console.log(`平均: ${avg}ms`);

    // 全画面10秒以内
    times.forEach(t => expect(t.ms).toBeLessThan(10000));
  });
});
