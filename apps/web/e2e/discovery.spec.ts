import { expect, test } from '@playwright/test';

test.describe('discovery surface', () => {
	test('full click flow navigates between homepage, detail, and explore', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('snippet-card-basic-card-feed').click();
		await expect(page).toHaveURL(/\/snippets\/basic-card-feed$/);
		await expect(page.getByRole('heading', { name: '基础卡片流' })).toBeVisible();

		await page.getByRole('link', { name: '全部片段' }).click();
		await expect(page).toHaveURL(/\/explore$/);

		await page.getByTestId('snippet-card-basic-card-feed').click();
		await expect(page).toHaveURL(/\/snippets\/basic-card-feed$/);
	});

	test('homepage shows the rebuilt hero and featured section', async ({ page }, testInfo) => {
		await page.goto('/');

		await expect(page.getByRole('heading', { name: '把 SwiftUI 片段像作品一样浏览。' })).toBeVisible();
		await expect(page.getByRole('button', { name: '查看全部片段' })).toBeVisible();
		await expect(page.getByRole('heading', { name: '先从这一条开始' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
	});

	test('explore keeps keyword and primary filters visible', async ({ page }, testInfo) => {
		await page.goto('/explore');

		await expect(page.getByRole('heading', { name: '挑一条，直接开做。' })).toBeVisible();
		await expect(page.getByPlaceholder('例如：hero、card、timeline')).toBeVisible();
		await expect(page.getByText('只看含 Demo')).toBeVisible();
		await expect(page.getByText('只看含 Prompt')).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('explore.png'), fullPage: true });
	});

	test('detail page still exposes public and not public states', async ({ page }, testInfo) => {
		await page.goto('/snippets/stacked-hero-card');
		await expect(page.getByRole('heading', { name: '叠层主视觉卡片' })).toBeVisible();
		await expect(page.getByRole('tablist', { name: '片段详情标签页' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('detail.png'), fullPage: true });

		await page.goto('/snippets/internal-draft-sample');
		await expect(page.getByRole('heading', { name: '内容未公开' })).toBeVisible();
		await expect(page.getByRole('button', { name: '回首页' })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath('not-public.png'), fullPage: true });
	});
});
