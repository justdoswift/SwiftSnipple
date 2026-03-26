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
	const demoReadyCount = $derived(orderedFeed.filter((snippet) => snippet.hasDemo).length);
	const promptReadyCount = $derived(orderedFeed.filter((snippet) => snippet.hasPrompt).length);
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
		<div class="page-orb page-orb-warm absolute left-[18%] top-[10rem] h-36 w-56"></div>

		<div class="hero-grid relative z-10 grid gap-7 px-0 py-3 min-[1100px]:grid-cols-[minmax(0,40rem)_minmax(0,23rem)]">
			<div class="hero-copy-cluster">
				<p class="section-kicker">SwiftSnippet</p>
				<h1 class="display-title max-w-[8.3ch] text-[clamp(2.3rem,4vw,3.5rem)]">
					把可复用的 SwiftUI 片段直接带走。
				</h1>
				<p class="section-copy max-w-[27rem]">
					从首屏、动效、状态到 Prompt，一眼挑中，再把代码和思路带回项目。
				</p>
				<div class="page-actions pt-1">
					<Button href="/explore" size="lg" class="gap-3 pr-2.5">
						<span>查看全部片段</span>
						<span class="surface-interactive grid size-8 place-items-center rounded-full text-primary">
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
					<p class="max-w-68 text-sm leading-6 text-foreground/74">
						每一条都可继续查看源码、提示词和可用边界。
					</p>
				</div>
			</div>

			{#if orderedFeed.length > 0}
				<div class="hero-aside-stack hidden min-[1100px]:grid">
					<div class="surface-floating hero-note-card">
						<div class="grid gap-1.5">
							<p class="section-kicker !mb-0">浏览方式</p>
							<h2 class="m-0 font-(family-name:--font-display) text-[1.12rem] leading-tight tracking-tight text-foreground">
								先看精选，再去系统筛选。
							</h2>
							<p class="m-0 text-sm leading-6 text-foreground/74">
								首页先帮你缩小选择范围，进入 Explore 再按场景、难度和平台继续深挖。
							</p>
						</div>
					</div>
					<div class="surface-floating hero-stats-card">
						<p class="ui-label">内容状态</p>
						<div class="hero-stat-grid">
							<div class="hero-stat-row">
								<strong class="hero-stat-value">
									{orderedFeed.length}
								</strong>
								<span class="hero-stat-label">条已发布，可直接打开判断风格与复用价值</span>
							</div>
							<div class="hero-stat-row">
								<strong class="hero-stat-value">
									{demoReadyCount}
								</strong>
								<span class="hero-stat-label">条含 Demo，适合先看动效和状态表现</span>
							</div>
							<div class="hero-stat-row">
								<strong class="hero-stat-value">
									{promptReadyCount}
								</strong>
								<span class="hero-stat-label">条含 Prompt，可直接带回 AI 协作工作流</span>
							</div>
						</div>
						<div class="flex flex-wrap gap-2 pt-1">
							<span class="glass-pill inline-flex items-center gap-2 px-3 py-2 text-xs text-foreground/76">
								{orderedFeed.length}
								<span>精选库</span>
							</span>
							<span class="glass-pill inline-flex items-center gap-2 px-3 py-2 text-xs text-foreground/76">
								{demoReadyCount}
								<span>可看演示</span>
							</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	{#if featuredSnippet}
			<section class="editorial-page grid gap-4" id="feed">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p class="section-kicker">本周推荐</p>
						<h2 class="section-title">先从这一条开始</h2>
					</div>
					<div class="surface-interactive home-section-note grid">
						<p class="ui-label">门面卡</p>
						<p class="m-0 text-sm leading-6 text-foreground/76">
							适合直接打开、判断风格，再决定要不要继续复用。
						</p>
					</div>
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

				<div class="home-gallery-grid">
					{#each galleryFeed as snippet, index (snippet.id)}
						<SnippetCard
							snippet={snippet}
							href={`/snippets/${snippet.id}`}
							variant="home"
							accented={index % 6 === 0}
						/>
					{/each}
				</div>
			</section>
		{/if}
</main>
