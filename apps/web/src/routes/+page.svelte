<script lang="ts">
	import SnippetCard from '$lib/components/SnippetCard.svelte';
	import type { PublishedSnippetCard } from '$lib/discovery/types';

	type Props = {
		data: {
			feed: PublishedSnippetCard[];
		};
	};

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>SwiftSnippet Discovery Feed</title>
	<meta
		name="description"
		content="Browse published SwiftUI snippets with demo-first previews, reusable code, and AI prompt assets."
	/>
</svelte:head>

<main class="page">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">Published SwiftUI snippets</p>
			<h1>Find a believable pattern, inspect the details, and lift it into your next build.</h1>
			<p class="lede">
				SwiftSnippet turns each published entry into a demo-first card with cover media,
				reuse metadata, and a direct path into the full implementation package.
			</p>
		</div>

		<div class="hero-panel">
			<p class="label">Discovery focus</p>
			<ul>
				<li>Portfolio-style feed with cover-first cards</li>
				<li>Difficulty and platform signals before click-through</li>
				<li>Detail pages with demo, code, prompt, and license context</li>
			</ul>
			<a class="explore-link" href="/explore">Open Explore</a>
		</div>
	</section>

	<section class="feed-section">
		<div class="section-head">
			<div>
				<p class="section-label">Featured and fresh</p>
				<h2>Published feed</h2>
			</div>
			<p class="section-copy">Cards are ordered for editorial feel first, with recent releases still visible.</p>
		</div>

		<div class="feed-grid">
			{#each data.feed as snippet (snippet.id)}
				<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} />
			{/each}
		</div>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: "Iowan Old Style", "Palatino Linotype", serif;
		background:
			radial-gradient(circle at top left, rgba(255, 209, 156, 0.44), transparent 24%),
			radial-gradient(circle at right, rgba(83, 132, 126, 0.2), transparent 32%),
			linear-gradient(180deg, #f6efe4 0%, #efe2d2 100%);
		color: #1f1916;
	}

	.page {
		padding: 1.5rem 1.2rem 4rem;
	}

	.hero,
	.feed-section {
		max-width: 1180px;
		margin: 0 auto;
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.75fr);
		gap: 1.2rem;
		padding: 3rem 0;
	}

	.hero-copy,
	.hero-panel {
		border-radius: 32px;
		padding: 1.5rem;
		border: 1px solid rgba(81, 56, 38, 0.12);
		background: rgba(255, 250, 243, 0.78);
		backdrop-filter: blur(14px);
		box-shadow: 0 24px 60px rgba(68, 46, 28, 0.1);
	}

	.eyebrow,
	.section-label,
	.label {
		margin: 0 0 0.7rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: #845f42;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.6rem, 6vw, 5.4rem);
		line-height: 0.92;
		max-width: 12ch;
	}

	.lede,
	.section-copy,
	.hero-panel li {
		font-size: 1.03rem;
		line-height: 1.75;
		color: #473c34;
	}

	.hero-panel ul {
		padding-left: 1.2rem;
		margin: 0 0 1.5rem;
	}

	.explore-link {
		display: inline-flex;
		text-decoration: none;
		border-radius: 999px;
		background: #1f5b56;
		color: #f7f0e6;
		padding: 0.8rem 1.15rem;
		font-weight: 700;
	}

	.feed-section {
		display: grid;
		gap: 1.25rem;
	}

	.section-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1rem;
		align-items: end;
	}

	h2 {
		margin: 0;
		font-size: clamp(1.8rem, 3vw, 2.8rem);
	}

	.feed-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
		gap: 1.2rem;
	}

	@media (max-width: 800px) {
		.hero {
			grid-template-columns: 1fr;
		}

		h1 {
			max-width: 100%;
		}
	}
</style>
