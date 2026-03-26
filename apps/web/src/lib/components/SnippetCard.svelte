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
	class={`overflow-hidden ${featured ? 'flex' : 'gap-0'} content-visibility-auto [contain-intrinsic-size:320px_280px]`}
>
	<div
		class={`relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.96))] ${featured ? 'min-h-[27rem] flex-1' : 'aspect-[16/10.5]'}`}
	>
		<a class="media-link" href={href} aria-label={`打开 ${snippet.title}`}>
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
			<div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.12)_54%,rgba(255,255,255,0.38)),linear-gradient(180deg,transparent_48%,rgba(255,255,255,0.62)_100%)]"></div>
		</a>

		<div
			class={`absolute right-3 top-3 z-10 inline-flex gap-1 transition-opacity duration-200 ${variant === 'home' && !featured ? 'opacity-35 hover:opacity-100 focus-within:opacity-100' : 'opacity-100'}`}
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
			<div class="absolute bottom-4 left-4 z-10 grid max-w-64 gap-1 rounded-xl border bg-card/95 px-4 py-3 shadow-xs">
				<a class="title-link" href={href}>
					<h2 class="m-0 font-(family-name:--font-display) text-[clamp(1.2rem,1.8vw,1.56rem)] leading-tight tracking-tight">
						{snippet.title}
					</h2>
				</a>
				<p class="m-0 text-xs text-muted-foreground">{metaLine}</p>
			</div>
		{/if}
	</div>

	{#if !featured}
		<Card.Content class={`grid content-end gap-1 ${variant === 'explore' ? 'px-4 pb-4 pt-3' : 'px-3.5 pb-4 pt-3'}`}>
			<a class="title-link" href={href}>
				<h2 class="m-0 font-(family-name:--font-display) text-sm leading-tight tracking-tight">{snippet.title}</h2>
			</a>
			<p class="m-0 text-xs text-muted-foreground">{metaLine}</p>
		</Card.Content>
	{/if}
</Card.Root>
