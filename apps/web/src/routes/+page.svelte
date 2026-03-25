<script lang="ts">
	import SnippetCard from '$lib/components/SnippetCard.svelte';
	import type { PublishedSnippetCard } from '$lib/discovery/types';

	type Props = {
		data: {
			feed: PublishedSnippetCard[];
		};
	};

	let { data }: Props = $props();
	const orderedFeed = $derived(
		[...data.feed].sort((left, right) => {
			if (left.featuredRank !== right.featuredRank) {
				return left.featuredRank - right.featuredRank;
			}

			return right.publishedAt.localeCompare(left.publishedAt);
		})
	);
	const featuredSnippet = $derived(
		orderedFeed.find((snippet) => snippet.hasDemo && snippet.media.demoUrl) ?? orderedFeed[0]
	);
	const galleryFeed = $derived(
		featuredSnippet ? orderedFeed.filter((snippet) => snippet.id !== featuredSnippet.id) : orderedFeed
	);
</script>

<svelte:head>
	<title>SwiftSnippet | 高保真液态玻璃首页</title>
	<meta
		name="description"
		content="SwiftSnippet 首页以一条精选内容建立品牌门面，再引导进入 Explore 深挖全部可复用片段。"
	/>
</svelte:head>

<main class="landing-page">
	<section class="hero-section" id="hero">
		<div class="hero-glow hero-glow-a"></div>
		<div class="hero-glow hero-glow-b"></div>

		<div class="hero-copy">
			<p class="section-kicker">SwiftSnippet / 首页精选</p>
			<h1>先看精选，再去 Explore 深挖。</h1>
			<p class="hero-subcopy">
				SwiftUI 片段、源码与 Prompt 先给你一条最值得打开的，其余内容交给作品墙继续扫。
			</p>
			<div class="hero-actions">
				<a class="primary-cta" href="/explore">
					<span>去 Explore 深挖</span>
					<span class="cta-icon">
						<svg viewBox="0 0 20 20" aria-hidden="true">
							<path
								d="M6.25 10h7.5m0 0-3.125-3.125M13.75 10l-3.125 3.125"
								fill="none"
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
							/>
						</svg>
					</span>
				</a>
				<p class="hero-note">首页只放精选，真正的主浏览和快速复制都在 Explore。</p>
			</div>
		</div>
	</section>

	{#if featuredSnippet}
		<section class="featured-section editorial-page" id="feed">
			<div class="section-row">
				<div>
					<p class="section-kicker">精选入口</p>
					<h2 class="section-title">当前精选</h2>
				</div>
				<p class="section-copy">先记住作品，再去 Explore 深挖全部。</p>
			</div>

			<SnippetCard
				snippet={featuredSnippet}
				href={`/snippets/${featuredSnippet.id}`}
				variant="home"
				featured={true}
			/>
		</section>
	{/if}

	{#if galleryFeed.length > 0}
		<section class="gallery-section editorial-page">
			<div class="section-row compact">
				<div>
					<p class="section-kicker">作品墙</p>
					<h2 class="section-title">更多作品</h2>
				</div>
				<a class="section-link" href="/explore">去 Explore 看全部</a>
			</div>

			<div class="feed-grid">
				{#each galleryFeed as snippet (snippet.id)}
					<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} variant="home" />
				{/each}
			</div>
		</section>
	{/if}
</main>

<style>
	.landing-page {
		display: grid;
		gap: 1.25rem;
		padding-bottom: 4rem;
	}

	.hero-section {
		position: relative;
		width: min(var(--page-width), calc(100vw - 3rem));
		margin: 0 auto;
		padding: 3.8rem clamp(1rem, 2.2vw, 1.8rem) 0.2rem;
		overflow: hidden;
	}

	.hero-glow {
		position: absolute;
		border-radius: 999px;
		filter: blur(58px);
		pointer-events: none;
	}

	.hero-glow-a {
		top: -4rem;
		left: -2rem;
		width: 18rem;
		height: 9rem;
		background: rgba(96, 177, 255, 0.14);
	}

	.hero-glow-b {
		top: 0;
		left: 8rem;
		width: 12rem;
		height: 7rem;
		background: rgba(49, 154, 255, 0.1);
	}

	.hero-copy {
		position: relative;
		z-index: 1;
		display: grid;
		gap: 0.72rem;
		max-width: 37rem;
		padding: 0.2rem 0 0.4rem;
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(2.15rem, 3.8vw, 3.35rem);
		line-height: 1.02;
		letter-spacing: -0.04em;
		max-width: 8.6ch;
	}

	.hero-subcopy {
		margin: 0;
		max-width: 22rem;
		font-size: 0.86rem;
		line-height: 1.54;
		letter-spacing: -0.02em;
		color: rgba(17, 17, 17, 0.62);
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
		padding-top: 0.12rem;
	}

	.primary-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.9rem;
		width: fit-content;
		padding: 0.76rem 0.82rem 0.76rem 0.94rem;
		border-radius: 16px;
		background: rgba(0, 132, 255, 0.8);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		box-shadow:
			inset 0 4px 4px rgba(255, 255, 255, 0.35),
			0 20px 30px rgba(0, 132, 255, 0.2);
		color: white;
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 600;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
	}

	.primary-cta:hover,
	.primary-cta:focus-visible {
		transform: scale(1.02);
		box-shadow:
			inset 0 4px 4px rgba(255, 255, 255, 0.35),
			0 24px 36px rgba(0, 132, 255, 0.24);
	}

	.cta-icon {
		display: inline-grid;
		place-items: center;
		width: 2.05rem;
		height: 2.05rem;
		border-radius: 999px;
		background: white;
		color: rgba(0, 132, 255, 0.95);
	}

	.cta-icon svg {
		width: 1rem;
		height: 1rem;
	}

	.hero-note {
		margin: 0;
		max-width: 15rem;
		font-size: 0.72rem;
		line-height: 1.48;
		color: rgba(17, 17, 17, 0.48);
	}

	.featured-section,
	.gallery-section {
		display: grid;
		gap: 0.86rem;
	}

	.section-row {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 0.9rem;
	}

	.section-row .section-copy {
		max-width: 20rem;
	}

	.compact {
		align-items: center;
	}

	.section-link {
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(17, 17, 17, 0.62);
	}

	.feed-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 1.12rem;
	}

	@media (max-width: 720px) {
		.hero-section {
			width: calc(100vw - 1rem);
			padding-inline: 0.5rem;
			padding-top: 4rem;
		}

		h1 {
			max-width: none;
			font-size: clamp(2.2rem, 11vw, 3.35rem);
			letter-spacing: -1px;
		}

		.hero-subcopy {
			max-width: none;
		}
	}
</style>
