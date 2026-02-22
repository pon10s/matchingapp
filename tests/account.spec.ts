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
    await page.goto('/index.html');
    const adviceContent = page.locator('#advice-content');
    await expect(adviceContent).toBeVisible();
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

  test('メールアドレス変更', async ({ page }) => {
    const newEmail = 'test-updated@example.com';
    
    await page.fill('#new-email', newEmail);
    
    page.on('dialog', dialog => {
      dialog.accept();
    });
    
    await page.click('#email-form button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // フォームがリセットされることを確認
    const input = page.locator('#new-email');
    await expect(input).toHaveValue('');
  });

  test('パスワード変更（正常）', async ({ page }) => {
    await page.fill('#new-password', 'newpassword123');
    await page.fill('#new-password-confirm', 'newpassword123');
    
    page.on('dialog', dialog => {
      dialog.accept();
    });
    
    await page.click('#password-form button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // フォームがリセットされることを確認
    const input = page.locator('#new-password');
    await expect(input).toHaveValue('');
  });

  test('パスワード変更（不一致）', async ({ page }) => {
    await page.fill('#new-password', 'newpassword123');
    await page.fill('#new-password-confirm', 'differentpassword');
    
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('一致');
      dialog.accept();
    });
    
    await page.click('#password-form button[type="submit"]');
    await page.waitForTimeout(500);
  });

  test('アカウント削除（キャンセル）', async ({ page }) => {
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('削除');
      dialog.dismiss();
    });
    
    await page.click('#delete-account-btn');
    await page.waitForTimeout(500);
    
    // ページがそのままであることを確認
    await expect(page).toHaveURL('/account.html');
  });
});
