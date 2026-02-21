import { test, expect } from '@playwright/test';

test.describe('ホーム画面', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理（実際の認証情報を使用）
    await page.goto('/login.html');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/index.html');
  });

  test('HOME-001: 概要カードの表示（PC）', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/index.html');
    
    // 3つのカードが表示されることを確認
    const cards = page.locator('.stats-cards .card');
    await expect(cards).toHaveCount(3);
    
    // 横並びであることを確認
    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();
    
    expect(firstBox.y).toBe(secondBox.y); // 同じY座標
  });

  test('HOME-002: 概要カードの表示（スマホ）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    
    // 3つのカードが表示されることを確認
    const cards = page.locator('.stats-cards .card');
    await expect(cards).toHaveCount(3);
    
    // 横並びであることを確認（スマホでも）
    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();
    
    expect(firstBox.y).toBe(secondBox.y); // 同じY座標
  });

  test('HOME-003: 登録相手数の表示', async ({ page }) => {
    await page.goto('/index.html');
    
    // 登録相手数が表示されることを確認
    const profilesCount = page.locator('#profiles-count');
    await expect(profilesCount).toBeVisible();
    await expect(profilesCount).toContainText('人');
  });

  test('HOME-006: LINE未連携時のアナウンス表示', async ({ page }) => {
    // user_settingsでline_notify_enabled = falseの状態を想定
    await page.goto('/index.html');
    
    const lineNotice = page.locator('#line-notice');
    await expect(lineNotice).toBeVisible();
    await expect(lineNotice).toContainText('LINE連携');
  });

  test('HOME-009: Gemini未設定時のメッセージ', async ({ page }) => {
    await page.goto('/index.html');
    
    const adviceContent = page.locator('#advice-content');
    await expect(adviceContent).toBeVisible();
    // 設定を促すメッセージまたはプレースホルダーが表示される
    await expect(adviceContent).not.toBeEmpty();
  });

  test('HOME-011: ステータス別グラフの表示', async ({ page }) => {
    await page.goto('/index.html');
    
    // グラフのcanvas要素が表示されることを確認
    const chart = page.locator('#statsChart');
    await expect(chart).toBeVisible();
    
    // ステータス別タブがアクティブであることを確認
    const statusTab = page.locator('.chart-tab[data-chart="status"]');
    await expect(statusTab).toHaveClass(/active/);
  });

  test('HOME-012: 月別推移グラフへの切り替え', async ({ page }) => {
    await page.goto('/index.html');
    
    // 月別推移タブをクリック
    const monthlyTab = page.locator('.chart-tab[data-chart="monthly"]');
    await monthlyTab.click();
    
    // タブがアクティブになることを確認
    await expect(monthlyTab).toHaveClass(/active/);
    
    // グラフが表示されることを確認
    const chart = page.locator('#statsChart');
    await expect(chart).toBeVisible();
  });

  test('HOME-013: アプリ別グラフへの切り替え', async ({ page }) => {
    await page.goto('/index.html');
    
    // アプリ別タブをクリック
    const appTab = page.locator('.chart-tab[data-chart="app"]');
    await appTab.click();
    
    // タブがアクティブになることを確認
    await expect(appTab).toHaveClass(/active/);
    
    // グラフが表示されることを確認
    const chart = page.locator('#statsChart');
    await expect(chart).toBeVisible();
  });
});
