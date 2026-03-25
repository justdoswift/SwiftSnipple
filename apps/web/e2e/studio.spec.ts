import { expect, test } from '@playwright/test';

test.describe('studio surface', () => {
	test('admin can log in and view snippet list', async ({ page }, testInfo) => {
		await page.goto('/studio/login');

		await page.getByLabel('管理员密码').fill('development-admin-password');
		await page.getByRole('button', { name: '登录' }).click();

		await expect(page).toHaveURL(/\/studio$/);
		await expect(page.getByRole('heading', { name: '内部运营台' })).toBeVisible();
		await expect(page.getByRole('link', { name: '内容管理' })).toBeVisible();

		await page.getByRole('link', { name: '内容管理' }).click();
		await expect(page).toHaveURL(/\/studio\/snippets$/);
		await expect(page.getByRole('heading', { name: '录入、筛查、发布全部 snippet。' })).toBeVisible();
		await expect(page.getByText('基础卡片流')).toBeVisible();

		await page.screenshot({ path: testInfo.outputPath('studio-list.png'), fullPage: true });
	});
});
