import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import CodeBlock from '$lib/components/CodeBlock.svelte';
import PromptBlock from '$lib/components/PromptBlock.svelte';
import { filtersFromSearchParams, filtersToSearchParams } from '$lib/discovery/query';
import type { DiscoveryFilters, PublishedSnippetCard, PublishedSnippetRecord } from '$lib/discovery/types';
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
		title: 'Basic Card Feed',
		summary: 'A minimal SwiftUI card feed snippet that ships with demo, source, and prompt assets.',
		categoryPrimary: 'layout',
		difficulty: 'easy',
		platforms: [{ os: 'iOS', minVersion: '17.0' }],
		tags: ['card', 'feed', 'swiftui'],
		media: {
			coverUrl: '/published/basic-card-feed/cover.png',
			demoUrl: '/published/basic-card-feed/demo.mp4'
		},
		hasDemo: true,
		hasPrompt: true,
		featuredRank: 2,
		publishedAt: '2026-03-20T09:00:00.000Z',
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
				content: '# Goal'
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
						fallback: [createCard({ id: 'stacked-hero-card', title: 'Stacked Hero Card' })],
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

		expect(screen.getByText('No published snippets matched your current filters')).toBeTruthy();
		expect(screen.getByText('Stacked Hero Card')).toBeTruthy();
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
				title: 'Prompt Template',
				kind: 'prompt',
				content: '# Goal'
			}
		});

		expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Copy prompt' })).toBeTruthy();
	});

	it('hides the Prompt tab and falls back to cover rendering when demoUrl is missing', () => {
		render(SnippetPage, {
			props: {
				data: {
					notPublic: false,
					snippet: createDetail({
						id: 'stacked-hero-card',
						title: 'Stacked Hero Card',
						hasPrompt: false,
						promptBlocks: [],
						media: {
							coverUrl: '/published/stacked-hero-card/cover.png'
						}
					})
				}
			}
		});

		expect(screen.queryByRole('tab', { name: 'Prompt' })).toBeNull();
		const image = screen.getByAltText('Stacked Hero Card preview') as HTMLImageElement;
		expect(image.getAttribute('src')).toBe('/published/stacked-hero-card/cover.png');
	});
});
