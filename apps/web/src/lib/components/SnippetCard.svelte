<script lang="ts">
	import CopyActionButton from '$lib/components/CopyActionButton.svelte';
	import SnippetPreviewMedia from '$lib/components/SnippetPreviewMedia.svelte';
	import { categoryLabel, difficultyLabel } from '$lib/discovery/presentation';
	import type { PublishedSnippetCard } from '$lib/discovery/types';

	type Props = {
		snippet: PublishedSnippetCard;
		href?: string;
		variant?: 'home' | 'explore';
		featured?: boolean;
	};

	let {
		snippet,
		href = `/snippets/${snippet.id}`,
		variant = 'explore',
		featured = false
	}: Props = $props();
	const hasCodeCopy = $derived(Boolean(snippet.quickCopy?.code));
	const hasPromptCopy = $derived(Boolean(snippet.quickCopy?.prompt));
	const reuseLabel = $derived(
		snippet.hasPrompt ? '含 Prompt' : snippet.hasDemo ? '含 Demo' : '仅代码'
	);
	const metaLine = $derived(
		`${categoryLabel(snippet.categoryPrimary)} · ${difficultyLabel(snippet.difficulty)} · ${reuseLabel}`
	);
	let copiedState = $state<'code' | 'prompt' | null>(null);

	async function copyAsset(kind: 'code' | 'prompt') {
		const content = snippet.quickCopy?.[kind];
		if (!content || !navigator?.clipboard) {
			return;
		}

		await navigator.clipboard.writeText(content);
		copiedState = kind;

		setTimeout(() => {
			if (copiedState === kind) {
				copiedState = null;
			}
		}, 1500);
	}
</script>

<article class={`card content-surface ${variant} ${featured ? 'featured' : ''}`}>
	<div class="media-shell">
		<a class="media-link" href={href} aria-label={`打开 ${snippet.title}`}>
			<SnippetPreviewMedia
				id={snippet.id}
				coverUrl={snippet.media.coverUrl}
				demoUrl={featured ? snippet.media.demoUrl : undefined}
				videoMode={featured ? 'ambient' : 'controls'}
				variant="gallery"
				eyebrow={categoryLabel(snippet.categoryPrimary)}
				metaText={`${difficultyLabel(snippet.difficulty)} · ${reuseLabel}`}
				className="cover"
				alt={snippet.title}
			/>
			<div class="media-overlay"></div>
		</a>

		<div class="quick-actions">
			{#if hasCodeCopy}
				<CopyActionButton
					icon="code"
					label="复制代码"
					copied={copiedState === 'code'}
					compact={true}
					onclick={() => copyAsset('code')}
				/>
			{/if}
			{#if hasPromptCopy}
				<CopyActionButton
					icon="prompt"
					label="复制 Prompt"
					copied={copiedState === 'prompt'}
					compact={true}
					onclick={() => copyAsset('prompt')}
				/>
			{/if}
		</div>

		{#if featured}
			<div class="featured-copy">
				<a class="title-link" href={href}>
					<h2 class="title">{snippet.title}</h2>
				</a>
				<p class="meta">{metaLine}</p>
			</div>
		{/if}
	</div>

	{#if !featured}
		<div class="content">
			<a class="title-link" href={href}>
				<h2 class="title">{snippet.title}</h2>
			</a>
			<p class="meta">{metaLine}</p>
		</div>
	{/if}
</article>

<style>
	.card {
		display: grid;
		gap: 0;
		border-radius: 24px;
		content-visibility: auto;
		contain-intrinsic-size: 320px 280px;
	}

	.card.featured {
		display: block;
		border-radius: 30px;
	}

	.media-shell {
		position: relative;
		aspect-ratio: 16 / 10;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.96));
		overflow: hidden;
		border-radius: 22px;
	}

	.card.featured .media-shell {
		aspect-ratio: auto;
		min-height: 32rem;
		border-radius: 30px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.985), rgba(247, 250, 255, 0.95));
	}

	.media-link,
	.title-link {
		color: inherit;
		text-decoration: none;
	}

	.media-overlay {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.18) 58%, rgba(255, 255, 255, 0.5)),
			linear-gradient(180deg, transparent 52%, rgba(255, 255, 255, 0.72) 100%);
		pointer-events: none;
	}

	.quick-actions {
		position: absolute;
		z-index: 1;
	}

	.quick-actions {
		top: 0.72rem;
		right: 0.72rem;
		display: inline-flex;
		gap: 0.28rem;
	}

	.card.home .quick-actions {
		opacity: 0.34;
		transition: opacity 180ms ease;
	}

	.card.home:hover .quick-actions,
	.card.home:focus-within .quick-actions,
	.card.featured .quick-actions {
		opacity: 1;
	}

	.content {
		display: grid;
		align-content: end;
		gap: 0.26rem;
		padding: 0.74rem 0.78rem 0.8rem;
	}

	.card.home .content {
		padding: 0.7rem 0.74rem 0.78rem;
	}

	.card.explore .content {
		padding: 0.76rem 0.8rem 0.84rem;
	}

	.card.featured .content {
		display: none;
	}

	.featured-copy {
		position: absolute;
		left: 1rem;
		bottom: 1rem;
		z-index: 1;
		display: grid;
		gap: 0.3rem;
		max-width: 18rem;
		padding: 0.86rem 0.9rem 0.88rem;
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.84);
		border: 1px solid rgba(17, 17, 17, 0.06);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 10px 22px rgba(17, 17, 17, 0.05);
	}

	.title {
		margin: 0;
		font-family: var(--font-display);
		font-size: 0.88rem;
		line-height: 1.12;
		letter-spacing: -0.02em;
	}

	.card.featured .title {
		font-size: clamp(1.26rem, 2vw, 1.72rem);
		line-height: 1.04;
		max-width: 12ch;
	}

	.meta {
		margin: 0;
		font-size: 0.64rem;
		line-height: 1.3;
		color: rgba(17, 17, 17, 0.46);
		letter-spacing: 0.02em;
	}

	.card.featured .meta {
		font-size: 0.74rem;
		color: rgba(17, 17, 17, 0.52);
	}

	@media (max-width: 920px) {
		.card.featured {
			grid-template-columns: 1fr;
		}

		.card.featured .media-shell {
			min-height: 0;
			aspect-ratio: 16 / 11;
		}
	}
</style>
