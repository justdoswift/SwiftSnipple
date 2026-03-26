<script lang="ts">
	import { goto } from '$app/navigation';
	import FacetChips from '$lib/components/FacetChips.svelte';
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

<main class="editorial-page gallery-page">
	<section class="gallery-hero">
		<div>
			<p class="section-kicker">Explore / 主浏览页</p>
			<h1 class="gallery-title">全部片段，一次看完。</h1>
			<p class="hero-copy section-copy">直接筛、直接复制；详情页只负责承接完整上下文。</p>
		</div>
		<a class="hero-link" href="/">首页看精选</a>
	</section>

	<section class="toolbar glass-panel">
		<div class="toolbar-top">
			<label class="search-field" for="search-query">
				<span>搜索片段</span>
				<input
					id="search-query"
					name="q"
					type="search"
					placeholder="搜索标题、标签或摘要"
					value={data.filters.q}
					oninput={queryInput}
				/>
			</label>

			<button
				type="button"
				class="secondary-toggle"
				aria-expanded={showSecondaryFilters}
				onclick={toggleSecondaryFilters}
			>
				{showSecondaryFilters ? '收起次级筛选' : '更多筛选'}
			</button>
		</div>

		<div class="facet-rows primary">
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
			<div class="facet-rows secondary">
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
	</section>

	<section class="results-section">
		<div class="results-head">
			<div>
				<p class="section-kicker">结果</p>
				<h2 class="section-title">共 {data.results.total} 条作品</h2>
			</div>
			<p class="section-copy">先看封面与节奏，需要时再进详情。</p>
		</div>

		{#if data.results.items.length > 0}
			<div class="results-grid">
				{#each data.results.items as snippet (snippet.id)}
					<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} variant="explore" />
				{/each}
			</div>
		{:else}
			<div class="zero-state content-surface">
				<h2 class="section-title">没有命中，先从这些精选重新开始。</h2>
				<p class="section-copy">
					放宽关键词，或者打开次级筛选重来一遍。下面这些已发布片段适合作为新的起点。
				</p>
			</div>

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

<style>
	.gallery-page {
		display: grid;
		gap: 0.72rem;
		padding-top: 6.55rem;
	}

	.gallery-hero,
	.toolbar,
	.zero-state {
		border-radius: 24px;
	}

	.gallery-hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.45rem;
		padding: 0.05rem 0 0;
		align-items: center;
	}

	.gallery-title,
	.hero-copy {
		margin: 0;
	}

	.gallery-title {
		font-family: var(--font-display);
		font-size: clamp(1.58rem, 3vw, 2.4rem);
		line-height: 1.04;
		letter-spacing: -0.04em;
		max-width: 7ch;
	}

	.hero-copy {
		max-width: 22rem;
		font-size: 0.8rem;
		color: rgba(17, 17, 17, 0.54);
	}

	.toolbar {
		display: grid;
		gap: 0.6rem;
		padding: 0.72rem 0.74rem 0.78rem;
	}

	.zero-state {
		display: grid;
		gap: 0.52rem;
		padding: 1.08rem 1rem;
	}

	.toolbar-top {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: end;
		gap: 0.8rem;
	}

	.search-field {
		display: grid;
		gap: 0.48rem;
	}

	.search-field span {
		font-size: 0.68rem;
		font-weight: 600;
		color: rgba(17, 17, 17, 0.54);
	}

	input {
		width: 100%;
		padding: 0.76rem 0.88rem;
		border-radius: 16px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.9);
		color: var(--site-text);
		font: inherit;
		font-size: 0.88rem;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.96),
			0 1px 2px rgba(17, 17, 17, 0.02);
	}

	.secondary-toggle,
	.hero-link {
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: rgba(255, 255, 255, 0.82);
		border-radius: 999px;
		padding: 0.58rem 0.8rem;
		color: rgba(17, 17, 17, 0.68);
		font: inherit;
		font-size: 0.78rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	input:focus {
		outline: none;
		border-color: rgba(0, 132, 255, 0.28);
		box-shadow:
			inset 0 4px 4px rgba(255, 255, 255, 0.24),
			0 0 0 4px rgba(0, 132, 255, 0.08);
	}

	.facet-rows,
	.results-section {
		display: grid;
		gap: 0.66rem;
	}

	.facet-rows.primary {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.facet-rows.secondary {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		padding-top: 0.18rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.results-head {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 0.72rem;
		padding-top: 0.12rem;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 0.92rem;
	}

	.zero-state {
		display: grid;
		gap: 0.72rem;
		padding: 0.94rem;
	}

	@media (max-width: 1040px) {
		.gallery-hero {
			grid-template-columns: 1fr;
		}

		.toolbar-top,
		.facet-rows.primary,
		.facet-rows.secondary {
			grid-template-columns: 1fr;
		}

	}

	@media (max-width: 720px) {
		.gallery-page {
			padding-top: 6.2rem;
		}
	}
</style>
