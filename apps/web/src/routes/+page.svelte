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
	<title>SwiftSnippet | SwiftUI 片段精选</title>
	<meta
		name="description"
		content="SwiftSnippet 用精选内容和公开作品墙，帮助你更快找到可直接复用的 SwiftUI 片段。"
	/>
</svelte:head>

<main class="landing-page">
	<section id="hero" class="editorial-hero">
		<div class="page-orb page-orb-primary absolute -left-8 -top-16 h-36 w-72"></div>
		<div class="page-orb page-orb-soft absolute left-32 top-0 h-28 w-48"></div>

		<div class="relative z-10 grid max-w-[39rem] gap-4 px-0 py-3">
			<p class="section-kicker">SwiftSnippet</p>
			<h1 class="display-title max-w-[8.3ch] text-[clamp(2.3rem,4vw,3.5rem)]">
				把可复用的 SwiftUI 片段直接带走。
			</h1>
			<p class="section-copy max-w-[25rem] text-[0.96rem] leading-7 tracking-[-0.01em]">
				从首屏、动效、状态到 Prompt，一眼挑中，再把代码和思路带回项目。
			</p>
			<div class="page-actions pt-1">
				<Button href="/explore" size="lg" class="gap-3 pr-2.5">
					<span>查看全部片段</span>
					<span class="surface-muted grid size-8 place-items-center rounded-full text-primary">
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
				<p class="max-w-60 text-sm leading-6 text-muted-foreground">
					每一条都可继续查看源码、提示词和可用边界。
				</p>
			</div>
		</div>
	</section>

	{#if featuredSnippet}
		<section class="editorial-page grid gap-4" id="feed">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p class="section-kicker">本周推荐</p>
					<h2 class="section-title">先从这一条开始</h2>
				</div>
				<p class="section-copy max-w-72">适合直接打开、判断风格，再决定要不要继续复用。</p>
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
		<section class="editorial-page grid gap-4">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div>
					<p class="section-kicker">继续浏览</p>
					<h2 class="section-title">更多可直接复用的片段</h2>
				</div>
				<Button href="/explore" variant="ghost" size="sm">进入 Explore</Button>
			</div>

			<div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 md:gap-5">
				{#each galleryFeed as snippet (snippet.id)}
					<SnippetCard snippet={snippet} href={`/snippets/${snippet.id}`} variant="home" />
				{/each}
			</div>
		</section>
	{/if}
</main>
