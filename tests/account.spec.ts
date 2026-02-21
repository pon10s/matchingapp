import { test, expect } from '@playwright/test';

test.describe('アカウント管理画面', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('/login.html');
    await page.click('#show-login');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'testpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('/index.html');
    
    // アカウント管理画面へ移動
    await page.goto('/account.html');
  });

  test('ACCT-001: LINE未連携状態の表示', async ({ page }) => {
    // LINE未連携の状態を想定
    const lineStatus = page.locator('#line-status');
    await expect(lineStatus).toContainText('未連携');
    
    // 連携ボタンが表示されることを確認
    const connectBtn = page.locator('#line-connect-btn');
    await expect(connectBtn).toBeVisible();
    
    // 解除ボタンは非表示
    const disconnectBtn = page.locator('#line-disconnect-btn');
    await expect(disconnectBtn).not.toBeVisible();
  });

  test('ACCT-003: LINE連携解除', async ({ page }) => {
    // LINE連携済みの場合のみテスト
    const disconnectBtn = page.locator('#line-disconnect-btn');
    
    // ボタンが表示されているか確認
    const isVisible = await disconnectBtn.isVisible();
    
    if (!isVisible) {
      // LINE未連携の場合はスキップ
      test.skip();
      return;
    }
    
    // 確認ダイアログを処理
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('LINE連携を解除');
      dialog.accept();
    });
    
    await disconnectBtn.click();
    
    // 成功メッセージを確認
    await page.waitForEvent('dialog');
  });

  test('ACCT-004: LINE連携解除キャンセル', async ({ page }) => {
    const disconnectBtn = page.locator('#line-disconnect-btn');
    
    // ボタンが表示されているか確認
    const isVisible = await disconnectBtn.isVisible();
    
    if (!isVisible) {
      // LINE未連携の場合はスキップ
      test.skip();
      return;
    }
    
    // 確認ダイアログでキャンセル
    page.on('dialog', dialog => {
      dialog.dismiss();
    });
    
    await disconnectBtn.click();
    
    // ページがリロードされないことを確認
    await expect(page).toHaveURL('/account.html');
  });

  test('ACCT-005: Gemini設定の読み込み', async ({ page }) => {
    // Gemini設定が表示されることを確認
    const apiKeyInput = page.locator('#gemini-api-key');
    await expect(apiKeyInput).toBeVisible();
    
    const enabledCheckbox = page.locator('#gemini-enabled');
    await expect(enabledCheckbox).toBeVisible();
  });

  test('ACCT-007: Gemini設定の保存', async ({ page }) => {
    // APIキーを入力
    await page.fill('#gemini-api-key', 'test-api-key-12345');
    
    // 有効化チェックボックスをON
    await page.check('#gemini-enabled');
    
    // 保存ボタンをクリック
    const geminiForm = page.locator('#gemini-form');
    
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('保存しました');
      dialog.accept();
    });
    
    await geminiForm.locator('button[type="submit"]').click();
  });

  test('ACCT-008: Gemini無効化', async ({ page }) => {
    // チェックボックスをOFF
    await page.uncheck('#gemini-enabled');
    
    // 保存
    const geminiForm = page.locator('#gemini-form');
    
    page.on('dialog', dialog => {
      dialog.accept();
    });
    
    await geminiForm.locator('button[type="submit"]').click();
    
    // ページをリロードして確認
    await page.reload();
    const enabledCheckbox = page.locator('#gemini-enabled');
    await expect(enabledCheckbox).not.toBeChecked();
  });

  test('ニックネーム変更', async ({ page }) => {
    const newNickname = 'テストユーザー更新';
    
    await page.fill('#new-nickname', newNickname);
    await page.click('#nickname-form button[type="submit"]');
    
    // 少し待つ（Supabase更新待ち）
    await page.waitForTimeout(2000);
    
    // フォームがリセットされることを確認
    const input = page.locator('#new-nickname');
    await expect(input).toHaveValue('');
  });
});
