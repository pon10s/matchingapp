import { test, expect } from '@playwright/test';

const LOGIN_EMAIL = 'test@example.com';
const LOGIN_PASSWORD = 'testpassword';

async function login(page: any) {
  await page.goto('/login.html');
  await page.click('#show-login');
  await page.waitForSelector('#login-section', { state: 'visible' });
  await page.fill('#login-email', LOGIN_EMAIL);
  await page.fill('#login-password', LOGIN_PASSWORD);
  await page.click('#login-form button[type="submit"]');
  await page.waitForURL('**/index.html', { timeout: 15000 });
}

test.describe('回帰テスト - 並列化対象画面', () => {
  test.setTimeout(60000);

  // ===== ホーム画面 (index.js) =====
  test.describe('ホーム画面', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/index.html');
    });

    test('KPIカードに数値が表示される', async ({ page }) => {
      await page.waitForFunction(() => {
        const el = document.getElementById('profiles-count');
        return el && el.textContent !== '--';
      }, { timeout: 10000 });

      const profilesCount = page.locator('#profiles-count');
      const upcomingCount = page.locator('#upcoming-count');
      const pendingCount = page.locator('#pending-count');

      await expect(profilesCount).not.toContainText('--');
      await expect(upcomingCount).not.toContainText('--');
      await expect(pendingCount).not.toContainText('--');
    });

    test('今週の予定セクションが表示される', async ({ page }) => {
      await page.waitForSelector('#schedule-list', { timeout: 10000 });
      await expect(page.locator('#schedule-list')).toBeVisible();
    });

    test('予定が終わったデートセクションが表示される', async ({ page }) => {
      await page.waitForSelector('#pending-list', { timeout: 10000 });
      await expect(page.locator('#pending-list')).toBeVisible();
    });

    test('LINE未連携バナーの表示状態が正しい（表示 or 非表示）', async ({ page }) => {
      await page.waitForFunction(() => {
        const el = document.getElementById('profiles-count');
        return el && el.textContent !== '--';
      }, { timeout: 10000 });
      // バナーは存在する（表示/非表示はLINE連携状態による）
      await expect(page.locator('#line-banner')).toBeAttached();
    });

    test('まちあぷネキのアドバイスエリアが表示される', async ({ page }) => {
      await expect(page.locator('#advice-content')).toBeVisible();
    });

    test('スマホサイズで画面崩れがない', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/index.html');
      await page.waitForFunction(() => {
        const el = document.getElementById('profiles-count');
        return el && el.textContent !== '--';
      }, { timeout: 10000 });

      // app-containerがビューポート内に収まっている
      const container = page.locator('.app-container');
      const box = await container.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(375);

      // ボトムナビが表示されている
      await expect(page.locator('.bottom-nav')).toBeVisible();
    });
  });

  // ===== プロフィール一覧 (profiles.js) =====
  test.describe('プロフィール一覧', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/profiles.html');
      await page.waitForSelector('#profiles-list', { timeout: 10000 });
    });

    test('プロフィールカードが1件以上表示される', async ({ page }) => {
      const cards = page.locator('#profiles-list .card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('各カードに名前が表示される', async ({ page }) => {
      const firstCard = page.locator('#profiles-list .card').first();
      const nameEl = firstCard.locator('span').first();
      const name = await nameEl.textContent();
      expect(name?.trim().length).toBeGreaterThan(0);
    });

    test('ステータスタグが表示される', async ({ page }) => {
      const firstCard = page.locator('#profiles-list .card').first();
      await expect(firstCard.locator('.pill-tag').first()).toBeVisible();
    });

    test('カードクリックで詳細画面に遷移する', async ({ page }) => {
      await page.locator('#profiles-list .card').first().click();
      await page.waitForURL('**/profile-detail.html*', { timeout: 10000 });
      expect(page.url()).toContain('profile-detail.html');
    });

    test('スマホサイズで画面崩れがない', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/profiles.html');
      await page.waitForSelector('#profiles-list', { timeout: 10000 });

      const container = page.locator('.app-container');
      const box = await container.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(375);
    });
  });

  // ===== 戦歴画面 (calendar.js) =====
  test.describe('戦歴画面', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/calendar.html');
      await page.waitForSelector('#calendar-list', { timeout: 10000 });
    });

    test('カレンダーリストが表示される', async ({ page }) => {
      await expect(page.locator('#calendar-list')).toBeVisible();
    });

    test('デートカードが1件以上表示される（データあり）', async ({ page }) => {
      // データがある場合はdate-cardが表示される
      await page.waitForTimeout(1000);
      const cards = page.locator('.date-card');
      const count = await cards.count();
      // データがない場合は空メッセージが表示される
      if (count === 0) {
        await expect(page.locator('#calendar-list')).toContainText('デート履歴がありません');
      } else {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('タブ切替（昇順/降順）が動作する', async ({ page }) => {
      const descBtn = page.locator('#sortDescBtn');
      await descBtn.click();
      await page.waitForTimeout(500);
      await expect(descBtn).toHaveClass(/active/);

      const ascBtn = page.locator('#sortAscBtn');
      await ascBtn.click();
      await page.waitForTimeout(500);
      await expect(ascBtn).toHaveClass(/active/);
    });

    test('スマホサイズで画面崩れがない', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/calendar.html');
      await page.waitForSelector('#calendar-list', { timeout: 10000 });

      const container = page.locator('.app-container');
      const box = await container.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(375);
    });
  });
});
