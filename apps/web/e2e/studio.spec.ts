import { expect, test } from '@playwright/test';

test.describe('studio surface', () => {
	test('admin can log in and view snippet list', async ({ page }, testInfo) => {
		await page.goto('/studio/login');

		await page.getByLabel('管理员密码').fill('development-admin-password');
		await page.getByRole('button', { name: '进入 Studio' }).click();

		await expect(page).toHaveURL(/\/studio$/);
		await expect(page.getByRole('heading', { name: '内容运营台' })).toBeVisible();
		await expect(page.getByRole('link', { name: '进入内容管理' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('studio-home.png'), fullPage: true });

		await page.getByRole('link', { name: '进入内容管理' }).click();
		await expect(page).toHaveURL(/\/studio\/snippets$/);
		await expect(page.getByRole('heading', { name: '内容管理' })).toBeVisible();
		await expect(page.getByText('基础卡片流')).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('studio-list.png'), fullPage: true });

		await page.getByRole('main').getByRole('link', { name: '新建内容' }).first().click();
		await expect(page).toHaveURL(/\/studio\/snippets\/new$/);
		await expect(page.getByRole('heading', { name: '新建骨架' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('studio-new.png'), fullPage: true });

		await page.goto('/studio/snippets/basic-card-feed');
		await expect(page.getByRole('heading', { name: '基础卡片流' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('studio-editor.png'), fullPage: true });
	});
});
