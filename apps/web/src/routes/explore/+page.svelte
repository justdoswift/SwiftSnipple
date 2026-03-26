<script lang="ts">
	import { goto } from '$app/navigation';
	import FacetChips from '$lib/components/FacetChips.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		booleanLabel,
		categoryLabel,
		difficultyLabel
	} from '$lib/discovery/presentation';
	import SnippetCard from '$lib/components/SnippetCard.svelte';
	import { filtersToSearchParams, withUpdatedFilter } from '$lib/discovery/query';
	import type {
		DiscoveryFilterKey,
		DiscoveryFilters,
		FacetOption,
		SearchResponse
	} from '$lib/discovery/types';

	type Props = {
		data: {
			results: SearchResponse;
			filters: DiscoveryFilters;
		};
	};

	let { data }: Props = $props();
	const hasSecondarySelection = $derived(Boolean(data.filters.hasDemo || data.filters.hasPrompt));
	const activeFilterCount = $derived(
		[
			data.filters.q,
			data.filters.category,
			data.filters.difficulty,
			data.filters.platform,
			data.filters.hasDemo,
			data.filters.hasPrompt
		].filter(Boolean).length
	);
	const resultSummary = $derived(
		activeFilterCount === 0
			? '当前没有额外筛选，适合直接浏览全部作品。'
			: `已启用 ${activeFilterCount} 个筛选，结果会随输入和点选即时刷新。`
	);
	let manualSecondaryFilters = $state(false);
	const showSecondaryFilters = $derived(hasSecondarySelection || manualSecondaryFilters);

	function facetOptions(key: DiscoveryFilterKey, counts: Record<string, number>): FacetOption[] {
		return Object.entries(counts)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([value, count]) => ({
				value,
				label:
					key === 'category'
						? categoryLabel(value)
						: key === 'difficulty'
							? difficultyLabel(value)
							: key === 'hasDemo' || key === 'hasPrompt'
								? booleanLabel(value)
								: value,
				count
			}));
	}

	function updateFilter(key: DiscoveryFilterKey, value: string) {
		const nextFilters = withUpdatedFilter(data.filters, key, value);
		const params = filtersToSearchParams(nextFilters);
		const nextUrl = params.size ? `/explore?${params.toString()}` : '/explore';

		void goto(nextUrl, {
			replaceState: true,
			noScroll: true,
			keepFocus: true,
			invalidateAll: true
		});
	}

	function queryInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		updateFilter('q', target.value);
	}

	function toggleSecondaryFilters() {
		manualSecondaryFilters = !manualSecondaryFilters;
	}
</script>

<svelte:head>
	<title>SwiftSnippet | 发现公开片段</title>
	<meta
		name="description"
		content="Explore 汇集已发布的 SwiftUI 片段，方便你按场景与难度挑到合适的一条。"
	/>
</svelte:head>

<main class="editorial-page grid gap-5 pt-24">
	<div class="page-orb page-orb-primary absolute -left-10 top-12 h-44 w-72"></div>
	<div class="page-orb page-orb-soft absolute right-[10%] top-28 h-36 w-56"></div>
	<div class="page-orb page-orb-warm absolute left-[28%] top-[22rem] h-40 w-64"></div>

	<section class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 max-[1040px]:grid-cols-1">
		<div>
			<p class="section-kicker">Explore</p>
			<h1 class="m-0 max-w-[7ch] font-(family-name:--font-display) text-[clamp(1.7rem,3vw,2.55rem)] leading-none tracking-[-0.04em]">
				挑一条，直接开做。
			</h1>
			<p class="section-copy max-w-[24rem]">适合首屏、动效、状态和 Prompt 协作的内容都集中在这里。</p>
		</div>
		<Button href="/" variant="outline" size="sm" class="hero-link">回首页</Button>
	</section>

	<Card.Root class="surface-card">
		<Card.Content class="space-y-5 py-1">
		<div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-[1040px]:grid-cols-1">
			<label class="search-field grid gap-2" for="search-query">
				<span class="ui-label">搜索片段</span>
				<Input
					id="search-query"
					name="q"
					type="search"
					placeholder="搜索标题、标签或摘要"
					value={data.filters.q}
					oninput={queryInput}
				/>
			</label>

			<Button
				type="button"
				variant="outline"
				size="sm"
				class="secondary-toggle"
				aria-expanded={showSecondaryFilters}
				onclick={toggleSecondaryFilters}
			>
				{showSecondaryFilters ? '收起次级筛选' : '更多筛选'}
			</Button>
		</div>

		<div class="grid gap-4 md:grid-cols-3">
			<FacetChips
				label="分类"
				options={facetOptions('category', data.results.facets.category)}
				activeValue={data.filters.category}
				onselect={(value) => updateFilter('category', value)}
			/>
			<FacetChips
				label="难度"
				options={facetOptions('difficulty', data.results.facets.difficulty)}
				activeValue={data.filters.difficulty}
				onselect={(value) => updateFilter('difficulty', value)}
			/>
			<FacetChips
				label="平台"
				options={facetOptions('platform', data.results.facets.platform)}
				activeValue={data.filters.platform}
				onselect={(value) => updateFilter('platform', value)}
			/>
		</div>

		{#if showSecondaryFilters}
			<div class="grid gap-4 border-t border-white/22 pt-4 md:grid-cols-2">
				<FacetChips
					label="含 Demo"
					options={facetOptions('hasDemo', data.results.facets.hasDemo)}
					activeValue={data.filters.hasDemo}
					tone="secondary"
					onselect={(value) => updateFilter('hasDemo', value)}
				/>
				<FacetChips
					label="含提示词"
					options={facetOptions('hasPrompt', data.results.facets.hasPrompt)}
					activeValue={data.filters.hasPrompt}
					tone="secondary"
					onselect={(value) => updateFilter('hasPrompt', value)}
				/>
			</div>
		{/if}
		</Card.Content>
	</Card.Root>

	<section class="results-section grid gap-4">
		<div class="flex flex-wrap items-end justify-between gap-3 pt-0.5">
			<div>
				<p class="section-kicker">已发布</p>
				<h2 class="section-title">{data.results.total} 条可直接复用的片段</h2>
			</div>
			<div class="surface-muted grid max-w-[22rem] gap-1.5 rounded-[calc(var(--radius)+0.55rem)] px-4 py-3">
				<p class="ui-label">浏览状态</p>
				<p class="m-0 text-sm leading-6 text-foreground/82">{resultSummary}</p>
				<p class="m-0 text-xs leading-5 text-muted-foreground/90">
					先看合不合适，再决定要不要打开细节。
				</p>
			</div>
		</div>

		{#if data.results.items.length > 0}
			<div class="grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-4 md:gap-5">
				{#each data.results.items as snippet (snippet.id)}
					<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} variant="explore" />
				{/each}
			</div>
		{:else}
			<Card.Root class="surface-card">
				<Card.Content class="space-y-3 py-1">
				<h2 class="section-title">这次没找到合适的，先看看这些更常用的。</h2>
				<p class="section-copy">
					换个关键词，或者直接从下面这些已经常用的片段重新开始。
				</p>
				</Card.Content>
			</Card.Root>

			{#if (data.results.fallback ?? []).length > 0}
				<div class="results-grid">
					{#each data.results.fallback ?? [] as snippet (snippet.id)}
						<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} variant="explore" />
					{/each}
				</div>
			{/if}
		{/if}
	</section>
</main>
