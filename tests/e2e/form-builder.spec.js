import { expect, test } from "@playwright/test";

async function login(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('input').first().fill('login@example.com');
  await page.locator('button[type="submit"]').click();
  await page.locator('input').last().fill('password');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('フォームを作成・管理')).toBeVisible();
}

test('create, save, publish guard, and JSON diff', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: /新規フォーム作成/ }).click();
  await expect(page.getByText('未保存の変更あり')).toBeVisible();

  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('下書きを保存しました。')).toBeVisible();

  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByText('公開として保存').click();
  await expect(page.getByText('公開前に確認が必要です')).toBeVisible();
  await page.getByRole('button', { name: '下書きに戻る' }).click();

  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByText('JSONインポート/出力').click();
  await expect(page.getByText('差分')).toBeVisible();
});

test('role switch and created form filters', async ({ page }) => {
  await login(page);
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByLabel('権限ロール').selectOption('viewer');
  await page.getByRole('button', { name: /新規フォーム作成/ }).click();
  await expect(page.getByText('権限: 閲覧者')).toBeVisible();
  await expect(page.getByRole('button', { name: '保存' })).toBeDisabled();

  await page.getByRole('button', { name: /フォーム管理/ }).click();
  await expect(page.getByText('フォームを作成・管理')).toBeVisible();
  await page.locator('button').filter({ hasText: '作成済み' }).click();
  await page.getByPlaceholder('フォーム名、公開範囲、状態で検索').fill('研修');
  await expect(page.getByText('研修参加申請フォーム').first()).toBeVisible();
});

test('respondent submission appears in response dashboard and audit log', async ({ page }) => {
  await login(page);
  await page.goto('/google-form-clone/#/respond/c1');
  await page.reload();
  await expect(page.getByText('フォーム回答')).toBeVisible();
  await page.locator('main input').nth(0).fill('テスト 太郎');
  await page.locator('main input').nth(1).fill('QA部');
  await page.getByLabel('7月15日').check();
  await page.getByRole('button', { name: '次へ' }).click();
  await page.locator('textarea').first().fill('事前質問です');
  await page.getByLabel('基礎理解').check();
  await page.locator('select').selectOption('オンライン');
  await page.getByRole('button', { name: '次へ' }).click();
  await page.getByRole('button', { name: /回答を送信|送信/ }).click();
  await expect(page.getByText(/送信が完了しました|申請を受け付けました/)).toBeVisible();

  await page.goto('/');
  await page.locator('input').first().fill('login@example.com');
  await page.locator('button[type="submit"]').click();
  await page.locator('input').last().fill('password');
  await page.locator('button[type="submit"]').click();
  await page.locator('button').filter({ hasText: '作成済み' }).click();
  await expect(page.getByPlaceholder('フォーム名、公開範囲、状態で検索')).toBeVisible();
  await page.getByRole('button', { name: '回答', exact: true }).first().click();
  await expect(page.getByText('login@example.com').first()).toBeVisible();

  await page.getByRole('button', { name: /フォーム管理/ }).click();
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByText('監査ログ').click();
  await expect(page.getByText('回答送信').first()).toBeVisible();
});
