import { expect, test } from '@playwright/test';

test.describe('discovery surface', () => {
	test('homepage shows a minimal hero with a single featured entry', async ({ page }, testInfo) => {
		await page.goto('/');

		await expect(
			page.getByRole('heading', { name: '先看精选，再去 Explore 深挖。' })
		).toBeVisible();
		await expect(page.getByText('受一线产品团队信任')).toHaveCount(0);
		await expect(page.getByRole('link', { name: '去 Explore 深挖' })).toBeVisible();
		await expect(page.getByRole('heading', { name: '当前精选' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
	});

	test('explore keeps primary filters visible and secondary filters collapsible', async ({
		page
	}, testInfo) => {
		await page.goto('/explore');

		await expect(page.getByRole('heading', { name: '全部片段，一次看完。' })).toBeVisible();
		await expect(page.getByText('分类')).toBeVisible();
		await expect(page.getByText('难度')).toBeVisible();
		await expect(page.getByText('平台')).toBeVisible();
		await expect(page.getByRole('button', { name: '更多筛选' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('explore.png'), fullPage: true });
	});

	test('detail page still exposes fallback detail states', async ({ page }, testInfo) => {
		await page.goto('/snippets/stacked-hero-card');
		await expect(page.locator('video')).toHaveCount(0);
		await expect(page.locator('.media-panel').first()).toBeVisible();
		await expect(page.locator('.media-panel').first()).toContainText('叠层主视觉卡片 预览图');
		await expect(page.getByRole('tablist', { name: '片段详情标签页' })).toBeVisible();

		await page.goto('/snippets/internal-draft-sample');
		await expect(page.getByRole('heading', { name: '内容未公开' })).toBeVisible();
		await expect(page.getByRole('link', { name: '返回首页' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('not-public.png'), fullPage: true });
	});
});
