<script lang="ts">
	import SnippetCard from '$lib/components/SnippetCard.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
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
	<section
		id="hero"
		class="relative mx-auto w-[min(var(--page-width),calc(100vw-3rem))] overflow-hidden px-[clamp(1rem,2.2vw,1.8rem)] pb-0.5 pt-14"
	>
		<div class="pointer-events-none absolute -left-8 -top-16 h-36 w-72 rounded-full bg-[#60b1ff]/15 blur-3xl"></div>
		<div class="pointer-events-none absolute left-32 top-0 h-28 w-48 rounded-full bg-[#319aff]/10 blur-3xl"></div>

		<div class="relative z-10 grid max-w-[37rem] gap-3 px-0 py-1">
			<p class="section-kicker">SwiftSnippet / 首页精选</p>
			<h1 class="m-0 max-w-[8.6ch] font-(family-name:--font-display) text-[clamp(2rem,3.5vw,3.05rem)] leading-none tracking-[-0.04em]">
				先看精选，再去 Explore 深挖。
			</h1>
			<p class="m-0 max-w-[22rem] text-sm leading-6 tracking-[-0.02em] text-muted-foreground">
				SwiftUI 片段、源码与 Prompt 先给你一条最值得打开的，其余内容交给作品墙继续扫。
			</p>
			<div class="flex flex-wrap items-center gap-x-4 gap-y-3 pt-0.5">
				<Button href="/explore" size="lg" class="primary-cta">
					<span>去 Explore 深挖</span>
					<span class="grid size-8 place-items-center rounded-full bg-background text-primary">
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
				</Button>
				<p class="m-0 max-w-60 text-xs leading-5 text-muted-foreground">
					首页只放精选，真正的主浏览和快速复制都在 Explore。
				</p>
			</div>
		</div>
	</section>

	{#if featuredSnippet}
		<section class="editorial-page grid gap-3" id="feed">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p class="section-kicker">精选入口</p>
					<h2 class="section-title">当前精选</h2>
				</div>
				<p class="section-copy max-w-72">先记住作品，再去 Explore 深挖全部。</p>
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
		<section class="editorial-page grid gap-3">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div>
					<p class="section-kicker">作品墙</p>
					<h2 class="section-title">更多作品</h2>
				</div>
				<Button href="/explore" variant="ghost" size="sm">去 Explore 看全部</Button>
			</div>

			<div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
				{#each galleryFeed as snippet (snippet.id)}
					<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} variant="home" />
				{/each}
			</div>
		</section>
	{/if}
</main>
