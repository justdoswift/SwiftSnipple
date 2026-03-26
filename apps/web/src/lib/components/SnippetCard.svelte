<script lang="ts">
	import CopyActionButton from '$lib/components/CopyActionButton.svelte';
	import SnippetPreviewMedia from '$lib/components/SnippetPreviewMedia.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
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

<Card.Root
	data-testid={`snippet-card-${snippet.id}`}
	class={`content-visibility-auto relative overflow-hidden [contain-intrinsic-size:320px_280px] ${featured ? 'flex flex-col md:flex-row' : 'gap-0'}`}
>
	<a class="absolute inset-0 z-10" href={href} aria-label={`打开 ${snippet.title}`}></a>
	<div
		class={`preview-canvas relative overflow-hidden ${featured ? 'min-h-[28rem] flex-1' : 'aspect-[16/10.8]'}`}
	>
		<SnippetPreviewMedia
			id={snippet.id}
			coverUrl={snippet.media.coverUrl}
			demoUrl={undefined}
			videoMode="controls"
			variant="gallery"
			eyebrow={categoryLabel(snippet.categoryPrimary)}
			metaText={`${difficultyLabel(snippet.difficulty)} · ${reuseLabel}`}
			className="cover"
			alt={snippet.title}
		/>
		<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/72 via-transparent to-white/12"></div>

		<div
			class={`absolute right-3 top-3 z-20 inline-flex gap-1 rounded-full border border-border/70 bg-card/78 p-1 backdrop-blur-sm transition-opacity duration-[var(--motion-fast)] ${variant === 'home' && !featured ? 'opacity-40 hover:opacity-100 focus-within:opacity-100' : 'opacity-100'}`}
		>
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
			<div class="surface-popover absolute bottom-4 left-4 z-20 grid max-w-80 gap-1 rounded-[calc(var(--radius)+0.1rem)] px-4 py-3">
				<h2 class="m-0 font-(family-name:--font-display) text-[clamp(1.16rem,1.7vw,1.5rem)] leading-tight tracking-tight">
					{snippet.title}
				</h2>
				<p class="m-0 text-xs text-muted-foreground">{metaLine}</p>
			</div>
		{/if}
	</div>

	{#if !featured}
		<Card.Content class={`grid content-end gap-1.5 ${variant === 'explore' ? 'px-4 pb-4 pt-3.5' : 'px-4 pb-4 pt-3.5'}`}>
			<h2 class="m-0 font-(family-name:--font-display) text-[0.98rem] leading-tight tracking-tight">{snippet.title}</h2>
			<p class="m-0 text-[0.8rem] text-muted-foreground">{metaLine}</p>
		</Card.Content>
	{/if}
</Card.Root>
