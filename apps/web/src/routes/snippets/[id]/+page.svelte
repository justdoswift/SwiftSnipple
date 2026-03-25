<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import {
		categoryLabel,
		demoAvailabilityLabel,
		difficultyLabel,
		platformLabel,
		promptAvailabilityLabel
	} from '$lib/discovery/presentation';
	import PromptBlock from '$lib/components/PromptBlock.svelte';
	import SnippetPreviewMedia from '$lib/components/SnippetPreviewMedia.svelte';
	import type { PublishedSnippetRecord } from '$lib/discovery/types';

	type DetailData =
		| {
				notPublic: true;
				id: string;
		  }
		| {
				notPublic: false;
				snippet: PublishedSnippetRecord;
		  };

	type Props = {
		data: DetailData;
	};

	let { data }: Props = $props();
	let activeTab = $state<'demo' | 'code' | 'prompt' | 'license'>('demo');
</script>

<svelte:head>
	<title>
		{data.notPublic ? '内容未公开 - SwiftSnippet' : `${data.snippet.title} - SwiftSnippet`}
	</title>
</svelte:head>

{#if data.notPublic}
	<main class="blocked-page">
		<section class="blocked-card content-surface">
			<p class="section-kicker">公开可见性</p>
			<h1>内容未公开</h1>
			<p class="section-copy">
				这个 slug 当前不在公开列表中。可以回到首页或 Explore，继续浏览已发布片段。
			</p>
			<div class="actions">
				<a class="back-link" href="/">返回首页</a>
				<a class="back-link" href="/explore">去发现页</a>
			</div>
		</section>
	</main>
{:else}
	{@const snippet = data.snippet}
	{@const promptBlocks = snippet.promptBlocks.filter((block) => block.kind === 'prompt')}
	{@const acceptanceBlocks = snippet.promptBlocks.filter((block) => block.kind !== 'prompt')}

	<main class="page">
		<div class="back-row">
			<a class="back-link" href="/">返回首页</a>
			<a class="back-link" href="/explore">继续发现</a>
		</div>

		<section class="hero">
			<div class="hero-copy">
				<p class="section-kicker">{categoryLabel(snippet.categoryPrimary)}</p>
				<h1 class="section-title page-title">{snippet.title}</h1>
				<p class="summary section-copy">{snippet.summary}</p>

				<div class="signal-row">
					<span class="badge">{difficultyLabel(snippet.difficulty)}</span>
					<span class="badge">{demoAvailabilityLabel(snippet.hasDemo)}</span>
					<span class="badge">{promptAvailabilityLabel(snippet.hasPrompt)}</span>
				</div>

				<div class="meta-panel">
					<div class="platforms">
						{#each snippet.platforms as platform (`${platform.os}-${platform.minVersion}`)}
							<span>{platformLabel(platform)}</span>
						{/each}
					</div>

					<ul class="tags">
						{#each snippet.tags as tag (tag)}
							<li>{tag}</li>
						{/each}
					</ul>
				</div>
			</div>

			<div class="media-panel content-surface">
				<SnippetPreviewMedia
					id={snippet.id}
					coverUrl={snippet.media.coverUrl}
					demoUrl={snippet.media.demoUrl}
					eyebrow={categoryLabel(snippet.categoryPrimary)}
					metaText={`${difficultyLabel(snippet.difficulty)} · ${promptAvailabilityLabel(snippet.hasPrompt)}`}
					className="hero-media"
					alt={`${snippet.title} 预览图`}
					loading="eager"
				/>
			</div>
		</section>

		<section class="tabs glass-panel">
			<div class="tabs-layout">
				<div class="tab-list" role="tablist" aria-label="片段详情标签页">
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === 'demo'}
						class:active={activeTab === 'demo'}
						onclick={() => (activeTab = 'demo')}
					>
						演示
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === 'code'}
						class:active={activeTab === 'code'}
						onclick={() => (activeTab = 'code')}
					>
						代码
					</button>
					{#if snippet.hasPrompt}
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === 'prompt'}
							class:active={activeTab === 'prompt'}
							onclick={() => (activeTab = 'prompt')}
						>
							提示词
						</button>
					{/if}
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === 'license'}
						class:active={activeTab === 'license'}
						onclick={() => (activeTab = 'license')}
					>
						许可
					</button>
				</div>

				<div class="tab-panel">
					{#if activeTab === 'demo'}
						<div class="demo-panel">
							<SnippetPreviewMedia
								id={snippet.id}
								coverUrl={snippet.media.coverUrl}
								demoUrl={snippet.media.demoUrl}
								eyebrow={categoryLabel(snippet.categoryPrimary)}
								metaText={`${difficultyLabel(snippet.difficulty)} · ${demoAvailabilityLabel(snippet.hasDemo)}`}
								className="tab-media"
								alt={`${snippet.title} 详情封面`}
								loading="eager"
							/>
							<p class="panel-copy section-copy">
								详情页保留完整的源码、Prompt、License 与演示上下文，用来承接卡片层的快速复制动作。
							</p>
						</div>
					{:else if activeTab === 'code'}
						<div class="stack">
							{#each snippet.codeBlocks as block (block.id)}
								<CodeBlock title={block.filename} language={block.language} content={block.content} />
							{/each}
						</div>
					{:else if activeTab === 'prompt' && snippet.hasPrompt}
						<div class="stack">
							{#each promptBlocks as block (block.id)}
								<PromptBlock title="提示词模板" kind={block.kind} content={block.content} />
							{/each}
							{#each acceptanceBlocks as block (block.id)}
								<PromptBlock title="验收清单" kind={block.kind} content={block.content} />
							{/each}
						</div>
					{:else}
						<div class="license-grid">
							<article class="license-card content-surface">
								<p class="section-kicker">许可</p>
								<h2 class="section-title">复用边界</h2>
								<ul>
									<li>代码：{snippet.license.code}</li>
									<li>媒体：{snippet.license.media}</li>
									<li>第三方声明：{snippet.license.thirdPartyNotice}</li>
								</ul>
							</article>

							<article class="license-card content-surface">
								<p class="section-kicker">依赖</p>
								<h2 class="section-title">运行环境</h2>
								{#if snippet.dependencies.length > 0}
									<ul>
										{#each snippet.dependencies as dependency (dependency)}
											<li>{dependency}</li>
										{/each}
									</ul>
								{:else}
									<p class="section-copy">没有额外披露的运行依赖。</p>
								{/if}
							</article>
						</div>
					{/if}
				</div>
			</div>
		</section>
	</main>
{/if}

<style>
	.page,
	.blocked-page {
		width: min(var(--page-width), calc(100vw - 3rem));
		margin: 0 auto;
		padding: 6.8rem clamp(1rem, 2.2vw, 1.8rem) 4rem;
	}

	.back-row,
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 0.9rem;
	}

	.back-link {
		text-decoration: none;
		color: rgba(17, 17, 17, 0.58);
		font-size: 0.84rem;
		font-weight: 600;
	}

	.hero,
	.tabs,
	.blocked-card {
		border-radius: 24px;
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(260px, 0.7fr) minmax(620px, 1.3fr);
		gap: 1rem;
		align-items: start;
	}

	.hero-copy,
	.media-panel,
	.tabs,
	.blocked-card {
		border-radius: 24px;
	}

	.hero-copy {
		padding: 0.35rem 0.1rem 0.15rem;
	}

	.media-panel {
		min-height: 34rem;
		padding: 0.72rem;
		align-items: stretch;
	}

	.media-panel :global(.hero-media),
	.demo-panel :global(.tab-media) {
		width: 100%;
		display: block;
		border-radius: 20px;
		object-fit: cover;
		background: rgba(255, 255, 255, 0.9);
	}

	h1,
	h2,
	.summary,
	.panel-copy {
		margin: 0;
	}

	.page-title {
		font-size: clamp(1.7rem, 2.4vw, 2.34rem);
		line-height: 1.06;
		max-width: 10ch;
	}

	.summary,
	.panel-copy,
	.license-card li {
		line-height: 1.68;
	}

	.summary {
		max-width: 24rem;
		font-size: 0.88rem;
	}

	.signal-row,
	.platforms,
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		padding: 0;
		margin: 0;
	}

	.meta-panel {
		display: grid;
		gap: 0.54rem;
		padding-top: 0.54rem;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
	}

	.badge,
	.platforms span,
	.tags li {
		list-style: none;
		padding: 0.32rem 0.54rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.84);
		color: rgba(17, 17, 17, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.06);
		font-size: 0.69rem;
		line-height: 1.2;
	}

	.media-panel {
		min-height: 34rem;
	}

	.tabs {
		margin-top: 0.8rem;
		padding: 0.82rem;
	}

	.tabs-layout {
		display: grid;
		gap: 0.74rem;
	}

	.tab-list {
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		gap: 0.46rem;
		padding-bottom: 0.2rem;
		margin: 0;
		scrollbar-width: none;
	}

	.tab-list::-webkit-scrollbar {
		display: none;
	}

	.tab-list button {
		border-radius: 999px;
		border: 1px solid rgba(0, 0, 0, 0.07);
		background: rgba(255, 255, 255, 0.7);
		color: rgba(17, 17, 17, 0.68);
		padding: 0.62rem 0.82rem;
		font: inherit;
		font-weight: 600;
		font-size: 0.82rem;
		cursor: pointer;
		text-align: left;
		white-space: nowrap;
	}

	.tab-list button.active {
		background: rgba(0, 132, 255, 0.08);
		border-color: rgba(0, 132, 255, 0.18);
		color: rgba(0, 132, 255, 0.88);
	}

	.stack,
	.license-grid {
		display: grid;
		gap: 0.82rem;
	}

	.license-grid {
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	}

	.license-card,
	.blocked-card {
		padding: 0.96rem;
	}

	.demo-panel {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.8fr);
		gap: 0.82rem;
		align-items: end;
	}

	.panel-copy {
		padding: 0.9rem 0.95rem;
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.blocked-page {
		display: grid;
		align-items: center;
		min-height: 100vh;
	}

	.blocked-card h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(2.6rem, 7vw, 4.6rem);
		line-height: 0.96;
	}

	@media (max-width: 900px) {
		.page,
		.blocked-page {
			padding-top: 6.3rem;
		}

		.hero,
		.demo-panel {
			grid-template-columns: 1fr;
		}

		.media-panel {
			min-height: 0;
		}
	}
</style>
