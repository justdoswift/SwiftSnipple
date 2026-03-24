<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import PromptBlock from '$lib/components/PromptBlock.svelte';
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
	let activeTab = $state<'Demo' | 'Code' | 'Prompt' | 'License'>('Demo');

	function platformLabel(platform: { os: string; minVersion: string }) {
		return `${platform.os} ${platform.minVersion}`;
	}
</script>

<svelte:head>
	<title>
		{data.notPublic ? '内容未公开 - SwiftSnippet' : `${data.snippet.title} - SwiftSnippet`}
	</title>
</svelte:head>

{#if data.notPublic}
	<main class="blocked-page">
		<section class="blocked-card">
			<p class="eyebrow">Discovery visibility</p>
			<h1>内容未公开</h1>
			<p>
				这个 slug 目前不在公开列表中。你可以回到公开 feed 或 Explore，继续浏览当前已发布的
				SwiftUI 片段。
			</p>
			<div class="actions">
				<a href="/">返回首页</a>
				<a href="/explore">去 Explore</a>
			</div>
		</section>
	</main>
{:else}
	{@const snippet = data.snippet}
	{@const promptBlocks = snippet.promptBlocks.filter((block) => block.kind === 'prompt')}
	{@const acceptanceBlocks = snippet.promptBlocks.filter((block) => block.kind !== 'prompt')}

	<main class="page">
		<section class="hero">
			<div class="media-panel">
				{#if snippet.media.demoUrl}
					<video
						class="hero-media"
						src={snippet.media.demoUrl}
						controls
						preload="metadata"
						poster={snippet.media.coverUrl}
					>
						<track kind="captions" srclang="en" label="English captions" />
						<p>Your browser does not support embedded video playback.</p>
					</video>
				{:else}
					<img
						class="hero-media"
						src={snippet.media.coverUrl}
						alt={`${snippet.title} preview`}
					/>
				{/if}
			</div>

			<div class="hero-copy">
				<p class="eyebrow">{snippet.categoryPrimary}</p>
				<h1>{snippet.title}</h1>
				<p class="summary">{snippet.summary}</p>

				<div class="signal-row">
					<span class="badge">{snippet.difficulty}</span>
					<span class="badge">{snippet.hasDemo ? 'Demo ready' : 'Cover fallback only'}</span>
					<span class="badge">{snippet.hasPrompt ? 'Prompt included' : 'Code-only asset pack'}</span>
				</div>

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
		</section>

		<section class="tabs">
			<div class="tab-list" role="tablist" aria-label="Snippet detail tabs">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'Demo'}
					class:active={activeTab === 'Demo'}
					onclick={() => (activeTab = 'Demo')}
				>
					Demo
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'Code'}
					class:active={activeTab === 'Code'}
					onclick={() => (activeTab = 'Code')}
				>
					Code
				</button>
				{#if snippet.hasPrompt}
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === 'Prompt'}
						class:active={activeTab === 'Prompt'}
						onclick={() => (activeTab = 'Prompt')}
					>
						Prompt
					</button>
				{/if}
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'License'}
					class:active={activeTab === 'License'}
					onclick={() => (activeTab = 'License')}
				>
					License
				</button>
			</div>

			<div class="tab-panel">
				{#if activeTab === 'Demo'}
					<div class="demo-panel">
						{#if snippet.media.demoUrl}
							<video
								class="tab-media"
								src={snippet.media.demoUrl}
								controls
								preload="metadata"
								poster={snippet.media.coverUrl}
							>
								<track kind="captions" srclang="en" label="English captions" />
								<p>Your browser does not support embedded video playback.</p>
							</video>
						{:else}
							<img
								class="tab-media"
								src={snippet.media.coverUrl}
								alt={`${snippet.title} detail cover`}
							/>
						{/if}
						<p class="panel-copy">
							Start with the visual output first, then move into the implementation and reuse
							assets once the behavior feels trustworthy.
						</p>
					</div>
				{:else if activeTab === 'Code'}
					<div class="stack">
						{#each snippet.codeBlocks as block (block.id)}
							<CodeBlock title={block.filename} language={block.language} content={block.content} />
						{/each}
					</div>
				{:else if activeTab === 'Prompt' && snippet.hasPrompt}
					<div class="stack">
						{#each promptBlocks as block (block.id)}
							<PromptBlock title="Prompt Template" kind={block.kind} content={block.content} />
						{/each}
						{#each acceptanceBlocks as block (block.id)}
							<PromptBlock title="Acceptance Checklist" kind={block.kind} content={block.content} />
						{/each}
					</div>
				{:else}
					<div class="license-panel">
						<div class="license-grid">
							<article>
								<p class="eyebrow">License</p>
								<h2>Reuse terms</h2>
								<ul>
									<li>Code: {snippet.license.code}</li>
									<li>Media: {snippet.license.media}</li>
									<li>Third-party notice: {snippet.license.thirdPartyNotice}</li>
								</ul>
							</article>

							<article>
								<p class="eyebrow">Dependencies</p>
								<h2>Runtime context</h2>
								{#if snippet.dependencies.length > 0}
									<ul>
										{#each snippet.dependencies as dependency (dependency)}
											<li>{dependency}</li>
										{/each}
									</ul>
								{:else}
									<p>No additional dependencies disclosed.</p>
								{/if}
							</article>
						</div>
					</div>
				{/if}
			</div>
		</section>
	</main>
{/if}

<style>
	:global(body) {
		margin: 0;
		font-family: "Iowan Old Style", "Palatino Linotype", serif;
		background:
			radial-gradient(circle at top, rgba(242, 191, 145, 0.35), transparent 28%),
			linear-gradient(180deg, #f7efe4 0%, #efe3d3 100%);
		color: #1e1714;
	}

	.page,
	.blocked-page {
		max-width: 1180px;
		margin: 0 auto;
		padding: 2rem 1.2rem 4rem;
	}

	.hero,
	.tabs,
	.blocked-card {
		border-radius: 32px;
		border: 1px solid rgba(81, 56, 38, 0.12);
		background: rgba(255, 250, 243, 0.84);
		backdrop-filter: blur(12px);
		box-shadow: 0 24px 60px rgba(68, 46, 28, 0.1);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
		gap: 1.2rem;
		padding: 1.4rem;
	}

	.media-panel,
	.tab-panel {
		min-width: 0;
	}

	.hero-media,
	.tab-media {
		width: 100%;
		display: block;
		border-radius: 24px;
		object-fit: cover;
		background: #d8c6b3;
	}

	.hero-copy {
		display: grid;
		align-content: start;
		gap: 1rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: #845f42;
	}

	h1,
	h2,
	.summary,
	.panel-copy {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.1rem, 5vw, 4rem);
		line-height: 0.95;
	}

	.summary,
	.panel-copy,
	.blocked-card p,
	.license-panel p,
	.license-panel li {
		line-height: 1.75;
		color: #4a3e34;
	}

	.signal-row,
	.platforms,
	.tags,
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		padding: 0;
		margin: 0;
	}

	.badge,
	.platforms span,
	.tags li {
		list-style: none;
		padding: 0.45rem 0.7rem;
		border-radius: 999px;
		background: rgba(95, 129, 123, 0.14);
		color: #234744;
	}

	.tabs {
		margin-top: 1.2rem;
		padding: 1.3rem;
	}

	.tab-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin-bottom: 1rem;
	}

	.tab-list button,
	.actions a {
		border: 0;
		border-radius: 999px;
		background: rgba(34, 42, 41, 0.08);
		color: inherit;
		padding: 0.7rem 1rem;
		font: inherit;
		cursor: pointer;
		text-decoration: none;
	}

	.tab-list button.active {
		background: #1f5b56;
		color: #f5efe6;
	}

	.stack,
	.license-grid {
		display: grid;
		gap: 1rem;
	}

	.license-grid {
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	}

	.license-grid article,
	.blocked-card {
		padding: 1.35rem;
	}

	.blocked-page {
		display: grid;
		align-items: center;
		min-height: 100vh;
	}

	@media (max-width: 860px) {
		.hero {
			grid-template-columns: 1fr;
		}
	}
</style>
