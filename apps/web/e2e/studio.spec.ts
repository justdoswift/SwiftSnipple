import { expect, test } from '@playwright/test';

async function loginToStudio(page: import('@playwright/test').Page) {
	await page.setViewportSize({ width: 1728, height: 1117 });
	await page.goto('/studio/login');
	await page.getByLabel('管理员密码').fill('development-admin-password');
	await page.getByRole('button', { name: '进入 Studio' }).click();
	await expect(page).toHaveURL(/\/studio$/);
}

test.describe('studio surface', () => {
	test('admin can log in and view snippet list', async ({ page }, testInfo) => {
	await loginToStudio(page);
	await expect(page.getByRole('heading', { name: '内容运营台' })).toBeVisible();
	await expect(page.getByText('待处理')).toBeVisible();
	await page.screenshot({ path: testInfo.outputPath('studio-home.png'), fullPage: true });

	await page.getByRole('link', { name: '内容管理' }).first().click();
	await expect(page).toHaveURL(/\/studio\/snippets$/);
		await expect(page.getByRole('heading', { name: '内容管理' })).toBeVisible();
		await expect(page.getByText('基础卡片流')).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('studio-list.png'), fullPage: true });

		await page.getByRole('link', { name: '新建内容' }).first().click();
		await expect(page).toHaveURL(/\/studio\/snippets\/new$/);
		await expect(page.getByRole('heading', { name: '新建内容' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('studio-new.png'), fullPage: true });

		await page.goto('/studio/snippets/basic-card-feed');
		await expect(page.getByRole('heading', { name: '基础卡片流' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('studio-editor.png'), fullPage: true });
	});

	test('editor exposes dirty state, grouped fields, media states, and publish feedback', async ({
		page
	}, testInfo) => {
	await loginToStudio(page);
	await page.goto('/studio/snippets/basic-card-feed');

	await expect(page.getByText('检查项')).toBeVisible();
	await expect(page.getByText('当前状态')).toBeVisible();
	await expect(page.getByText('上传封面')).toBeVisible();
	await expect(page.getByText('上传演示')).toBeVisible();
	await expect(page.getByText('已有演示')).toBeVisible();

		await page.getByLabel('标题').fill('基础卡片流 临时修改');
		await expect(page.getByText('你有未保存修改', { exact: true }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: '保存修改' })).toBeVisible();

		await page.getByRole('tab', { name: '提示词与许可' }).click();
		await expect(page.getByLabel('代码许可')).toBeVisible();

		await page.getByRole('button', { name: '运行校验' }).click();
		await expect(
			page.getByRole('alert').filter({ hasText: /校验通过|校验未通过/ }).first()
		).toBeVisible();

		await page.screenshot({ path: testInfo.outputPath('studio-editor-feedback.png'), fullPage: true });
	});
});
