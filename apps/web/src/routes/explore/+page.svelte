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
	let showSecondaryFilters = $state(false);

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
		showSecondaryFilters = !showSecondaryFilters;
	}

	$effect(() => {
		if (hasSecondarySelection) {
			showSecondaryFilters = true;
		}
	});
</script>

<svelte:head>
	<title>SwiftSnippet | 发现公开片段</title>
	<meta
		name="description"
		content="Explore 是 SwiftSnippet 的主浏览页，用轻工具条筛选并直接复制 SwiftUI 片段资产。"
	/>
</svelte:head>

<main class="editorial-page grid gap-3 pt-[6.55rem]">
	<section class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 max-[1040px]:grid-cols-1">
		<div>
			<p class="section-kicker">Explore / 主浏览页</p>
			<h1 class="m-0 max-w-[7ch] font-(family-name:--font-display) text-[clamp(1.58rem,3vw,2.4rem)] leading-none tracking-[-0.04em]">
				全部片段，一次看完。
			</h1>
			<p class="section-copy max-w-[22rem]">直接筛、直接复制；详情页只负责承接完整上下文。</p>
		</div>
		<Button href="/" variant="outline" size="sm" class="hero-link">首页看精选</Button>
	</section>

	<Card.Root>
		<Card.Content class="space-y-4">
		<div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-[1040px]:grid-cols-1">
			<label class="search-field" for="search-query">
				<span class="text-xs font-medium text-muted-foreground">搜索片段</span>
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

		<div class="grid gap-3 md:grid-cols-3">
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
			<div class="grid gap-3 border-t pt-3 md:grid-cols-2">
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

	<section class="results-section">
		<div class="flex flex-wrap items-end justify-between gap-3 pt-0.5">
			<div>
				<p class="section-kicker">结果</p>
				<h2 class="section-title">共 {data.results.total} 条作品</h2>
			</div>
			<p class="section-copy">先看封面与节奏，需要时再进详情。</p>
		</div>

		{#if data.results.items.length > 0}
			<div class="grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-4">
				{#each data.results.items as snippet (snippet.id)}
					<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} variant="explore" />
				{/each}
			</div>
		{:else}
			<Card.Root>
				<Card.Content class="space-y-3">
				<h2 class="section-title">没有命中，先从这些精选重新开始。</h2>
				<p class="section-copy">
					放宽关键词，或者打开次级筛选重来一遍。下面这些已发布片段适合作为新的起点。
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
