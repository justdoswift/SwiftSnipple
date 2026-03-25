import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';

import CodeBlock from '$lib/components/CodeBlock.svelte';
import PromptBlock from '$lib/components/PromptBlock.svelte';
import SnippetCard from '$lib/components/SnippetCard.svelte';
import { filtersFromSearchParams, filtersToSearchParams } from '$lib/discovery/query';
import type { DiscoveryFilters, PublishedSnippetCard, PublishedSnippetRecord } from '$lib/discovery/types';
import HomePage from '../../routes/+page.svelte';
import ExplorePage from '../../routes/explore/+page.svelte';
import SnippetPage from '../../routes/snippets/[id]/+page.svelte';

function createFilters(overrides: Partial<DiscoveryFilters> = {}): DiscoveryFilters {
	return {
		q: '',
		category: '',
		difficulty: '',
		platform: '',
		hasDemo: '',
		hasPrompt: '',
		...overrides
	};
}

function createCard(overrides: Partial<PublishedSnippetCard> = {}): PublishedSnippetCard {
	return {
		id: 'basic-card-feed',
		title: '基础卡片流',
		summary: '一条用于公开发现体验的基础 SwiftUI 卡片流，包含 Demo、源码与提示词资产。',
		categoryPrimary: 'layout',
		difficulty: 'easy',
		platforms: [{ os: 'iOS', minVersion: '17.0' }],
		tags: ['卡片', '信息流', 'SwiftUI'],
		media: {
			coverUrl: '/published/basic-card-feed/cover.png',
			demoUrl: '/published/basic-card-feed/demo.mp4'
		},
		hasDemo: true,
		hasPrompt: true,
		featuredRank: 2,
		publishedAt: '2026-03-20T09:00:00.000Z',
		quickCopy: {
			code: 'import SwiftUI',
			prompt: '# 目标'
		},
		...overrides
	};
}

function createDetail(overrides: Partial<PublishedSnippetRecord> = {}): PublishedSnippetRecord {
	return {
		...createCard(),
		codeBlocks: [
			{
				id: 'basic-card-feed-main',
				filename: 'BasicCardFeedSnippet.swift',
				language: 'swift',
				content: 'import SwiftUI'
			}
		],
		promptBlocks: [
			{
				id: 'basic-card-feed-prompt',
				kind: 'prompt',
				content: '# 目标'
			}
		],
		license: {
			code: 'MIT',
			media: 'CC-BY-4.0',
			thirdPartyNotice: 'LICENSES/THIRD_PARTY.md'
		},
		dependencies: ['SwiftUI'],
		...overrides
	};
}

describe('discovery smoke coverage', () => {
	it('serializes and restores URL filter params', () => {
		const params = filtersToSearchParams(
			createFilters({
				q: 'card',
				category: 'layout',
				difficulty: 'medium',
				platform: 'macOS',
				hasDemo: 'false',
				hasPrompt: 'true'
			})
		);

		expect(params.toString()).toBe(
			'q=card&category=layout&difficulty=medium&platform=macOS&hasDemo=false&hasPrompt=true'
		);
		expect(filtersFromSearchParams(params)).toEqual(
			createFilters({
				q: 'card',
				category: 'layout',
				difficulty: 'medium',
				platform: 'macOS',
				hasDemo: 'false',
				hasPrompt: 'true'
			})
		);
	});

	it('renders zero-result fallback recommendations on the explore page', () => {
		render(ExplorePage, {
			props: {
				data: {
					results: {
						query: {
							q: 'meter',
							category: '',
							difficulty: '',
							platform: '',
							hasDemo: undefined,
							hasPrompt: undefined
						},
						total: 0,
						items: [],
						fallback: [createCard({ id: 'stacked-hero-card', title: '叠层主视觉卡片' })],
						facets: {
							category: { layout: 1 },
							difficulty: { easy: 1 },
							platform: { iOS: 1 },
							hasDemo: { true: 1 },
							hasPrompt: { true: 1 }
						}
					},
					filters: createFilters({ q: 'meter' })
				}
			}
		});

		expect(screen.getByText('没有命中，先从这些精选重新开始。')).toBeTruthy();
		expect(screen.getAllByText('叠层主视觉卡片').length).toBeGreaterThan(0);
	});

	it('renders a minimal landing hero with one featured snippet and no trust strip', () => {
		render(HomePage, {
			props: {
				data: {
					feed: [
						createCard({ id: 'masonry-grid', title: '瀑布流布局', featuredRank: 3 }),
						createCard({ id: 'stacked-hero-card', title: '叠层主视觉卡片', featuredRank: 1 })
					]
				}
			}
		});

		expect(screen.getByText('先看精选，再去 Explore 深挖。')).toBeTruthy();
		expect(screen.getByText('当前精选')).toBeTruthy();
		expect(screen.getByRole('link', { name: '去 Explore 深挖' })).toBeTruthy();
		expect(screen.queryByText('受一线产品团队信任')).toBeNull();
		expect(screen.getByText('叠层主视觉卡片')).toBeTruthy();
		expect(screen.getAllByText('瀑布流布局').length).toBeGreaterThan(0);
	});

	it('shows copy labels for code and prompt blocks', () => {
		render(CodeBlock, {
			props: {
				title: 'BasicCardFeedSnippet.swift',
				language: 'swift',
				content: 'import SwiftUI'
			}
		});
		render(PromptBlock, {
			props: {
				title: '提示词模板',
				kind: 'prompt',
				content: '# 目标'
			}
		});

		expect(screen.getByRole('button', { name: '复制代码' })).toBeTruthy();
		expect(screen.getByRole('button', { name: '复制提示词' })).toBeTruthy();
	});

	it('shows quick copy actions on cards and copies the selected asset', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText }
		});

		render(SnippetCard, {
			props: {
				snippet: createCard(),
				href: '/snippets/basic-card-feed'
			}
		});

		screen.getByRole('button', { name: '复制代码' }).click();
		expect(writeText).toHaveBeenLastCalledWith('import SwiftUI');

		screen.getByRole('button', { name: '复制 Prompt' }).click();
		expect(writeText).toHaveBeenLastCalledWith('# 目标');
	});

	it('renders asset-card variants without summary and tag groups', () => {
		render(SnippetCard, {
			props: {
				snippet: createCard(),
				href: '/snippets/basic-card-feed',
				variant: 'home'
			}
		});

		expect(screen.queryByText('一条用于公开发现体验的基础 SwiftUI 卡片流，包含 Demo、源码与提示词资产。')).toBeNull();
		expect(screen.queryByLabelText('片段标签')).toBeNull();
		expect(screen.queryByText('Demo')).toBeNull();
	});

	it('hides unavailable quick copy actions on cards', () => {
		render(SnippetCard, {
			props: {
				snippet: createCard({
					quickCopy: {
						code: 'import SwiftUI'
					},
					hasPrompt: false
				}),
				href: '/snippets/basic-card-feed'
			}
		});

		expect(screen.getByRole('button', { name: '复制代码' })).toBeTruthy();
		expect(screen.queryByRole('button', { name: '复制 Prompt' })).toBeNull();
	});

	it('keeps has-demo and has-prompt in secondary filters on explore', async () => {
		render(ExplorePage, {
			props: {
				data: {
					results: {
						query: {
							q: '',
							category: '',
							difficulty: '',
							platform: '',
							hasDemo: undefined,
							hasPrompt: undefined
						},
						total: 1,
						items: [{ ...createCard(), score: 1 }],
						fallback: [],
						facets: {
							category: { layout: 1 },
							difficulty: { easy: 1 },
							platform: { iOS: 1 },
							hasDemo: { true: 1 },
							hasPrompt: { true: 1 }
						}
					},
					filters: createFilters()
				}
			}
		});

		expect(screen.queryByText('含 Demo')).toBeNull();
		screen.getByRole('button', { name: '更多筛选' }).click();
		await tick();
		expect(screen.getByText('含 Demo')).toBeTruthy();
		expect(screen.getByText('含提示词')).toBeTruthy();
	});

	it('renders composed gallery cover artwork for cards', async () => {
		render(SnippetCard, {
			props: {
				snippet: createCard(),
				href: '/snippets/basic-card-feed'
			}
		});

		expect(screen.getByRole('img', { name: '基础卡片流' })).toBeTruthy();
		expect(screen.getAllByText('基础卡片流').length).toBeGreaterThan(0);
	});

	it('hides the Prompt tab and falls back to cover rendering when demoUrl is missing', () => {
		render(SnippetPage, {
			props: {
				data: {
					notPublic: false,
					snippet: createDetail({
						id: 'stacked-hero-card',
						title: '叠层主视觉卡片',
						hasPrompt: false,
						promptBlocks: [],
						media: {
							coverUrl: '/published/stacked-hero-card/cover.png'
						}
					})
				}
			}
		});

		expect(screen.queryByRole('tab', { name: '提示词' })).toBeNull();
		expect(screen.getByRole('img', { name: '叠层主视觉卡片 预览图' })).toBeTruthy();
	});
});
