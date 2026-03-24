<script lang="ts">
	import { goto } from '$app/navigation';
	import FacetChips from '$lib/components/FacetChips.svelte';
	import SnippetCard from '$lib/components/SnippetCard.svelte';
	import {
		filtersToSearchParams,
		withUpdatedFilter
	} from '$lib/discovery/query';
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

	const booleanFacetLabels: Record<string, string> = {
		true: 'Yes',
		false: 'No'
	};

	function facetOptions(counts: Record<string, number>): FacetOption[] {
		return Object.entries(counts)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([value, count]) => ({
				value,
				label: booleanFacetLabels[value] ?? value,
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
</script>

<svelte:head>
	<title>Explore SwiftSnippet</title>
	<meta
		name="description"
		content="Search published SwiftUI snippets with live query params, lightweight facets, and fallback recommendations."
	/>
</svelte:head>

<main class="page">
	<section class="intro">
		<div>
			<p class="eyebrow">Explore published snippets</p>
			<h1>Search by intent, then narrow by the reuse signals that matter.</h1>
		</div>
		<p class="lede">
			URL-driven filtering keeps this page shareable and reactive. Every keystroke and chip tap
			refreshes results immediately without an Apply step.
		</p>
	</section>

	<section class="search-shell">
		<label class="search-field" for="search-query">
			<span>Keyword</span>
			<input
				id="search-query"
				name="q"
				type="search"
				placeholder="Search snippets, tags, and summaries"
				value={data.filters.q}
				oninput={queryInput}
			/>
		</label>

		<div class="facet-stack">
			<FacetChips
				label="Category"
				options={facetOptions(data.results.facets.category)}
				activeValue={data.filters.category}
				onselect={(value) => updateFilter('category', value)}
			/>
			<FacetChips
				label="Difficulty"
				options={facetOptions(data.results.facets.difficulty)}
				activeValue={data.filters.difficulty}
				onselect={(value) => updateFilter('difficulty', value)}
			/>
			<FacetChips
				label="Platform"
				options={facetOptions(data.results.facets.platform)}
				activeValue={data.filters.platform}
				onselect={(value) => updateFilter('platform', value)}
			/>
			<FacetChips
				label="Has Demo"
				options={facetOptions(data.results.facets.hasDemo)}
				activeValue={data.filters.hasDemo}
				onselect={(value) => updateFilter('hasDemo', value)}
			/>
			<FacetChips
				label="Has Prompt"
				options={facetOptions(data.results.facets.hasPrompt)}
				activeValue={data.filters.hasPrompt}
				onselect={(value) => updateFilter('hasPrompt', value)}
			/>
		</div>
	</section>

	<section class="results">
		<div class="results-head">
			<div>
				<p class="eyebrow">Results</p>
				<h2>{data.results.total} published matches</h2>
			</div>
			<a href="/">Back to feed</a>
		</div>

		{#if data.results.items.length > 0}
			<div class="results-grid">
				{#each data.results.items as snippet (snippet.id)}
					<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} />
				{/each}
			</div>
		{:else}
			<div class="zero-state">
				<h2>No published snippets matched your current filters</h2>
				<p>
					Try broadening the keyword or clearing one facet. Meanwhile, these published picks can
					help you get back on track.
				</p>
			</div>

			{#if data.results.fallback.length > 0}
				<div class="results-grid">
					{#each data.results.fallback.slice(0, 3) as snippet (snippet.id)}
						<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} />
					{/each}
				</div>
			{/if}
		{/if}
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: "Iowan Old Style", "Palatino Linotype", serif;
		background:
			radial-gradient(circle at top, rgba(244, 194, 149, 0.34), transparent 28%),
			linear-gradient(180deg, #f8f0e6 0%, #efe4d4 100%);
		color: #201916;
	}

	.page {
		max-width: 1180px;
		margin: 0 auto;
		padding: 2rem 1.2rem 4rem;
		display: grid;
		gap: 1.5rem;
	}

	.intro,
	.search-shell,
	.zero-state {
		border-radius: 30px;
		border: 1px solid rgba(85, 59, 39, 0.12);
		background: rgba(255, 250, 243, 0.82);
		backdrop-filter: blur(12px);
		box-shadow: 0 24px 60px rgba(75, 49, 30, 0.08);
		padding: 1.4rem;
	}

	.intro {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
		align-items: end;
	}

	.eyebrow {
		margin: 0 0 0.65rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: #845f42;
	}

	h1,
	h2 {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.2rem, 5vw, 4.3rem);
		line-height: 0.95;
		max-width: 14ch;
	}

	.lede,
	.zero-state p {
		line-height: 1.75;
		color: #4e4035;
	}

	.search-shell {
		display: grid;
		gap: 1.2rem;
	}

	.search-field {
		display: grid;
		gap: 0.6rem;
	}

	.search-field span {
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.75rem;
		color: #6c5a4d;
	}

	input {
		width: 100%;
		padding: 1rem 1.1rem;
		border-radius: 20px;
		border: 1px solid rgba(77, 56, 42, 0.14);
		font: inherit;
		font-size: 1.05rem;
		background: rgba(255, 255, 255, 0.8);
		color: inherit;
	}

	.facet-stack {
		display: grid;
		gap: 1rem;
	}

	.results {
		display: grid;
		gap: 1rem;
	}

	.results-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1rem;
		align-items: end;
	}

	.results-head a {
		color: #1f5b56;
		font-weight: 700;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
		gap: 1.2rem;
	}

	@media (max-width: 800px) {
		.intro {
			grid-template-columns: 1fr;
		}

		h1 {
			max-width: 100%;
		}
	}
</style>
