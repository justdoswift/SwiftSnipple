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
		accented?: boolean;
	};

	let {
		snippet,
		href = `/snippets/${snippet.id}`,
		variant = 'explore',
		featured = false,
		accented = false
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
	data-accented={accented}
	class="snippet-card-shell content-visibility-auto relative gap-0 overflow-hidden py-0 transition-transform duration-[var(--motion-normal)] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 [contain-intrinsic-size:320px_280px]"
>
	<a
		class={`group/card-link flex h-full min-w-0 flex-1 self-stretch no-underline ${featured ? 'flex-col xl:grid xl:grid-cols-[minmax(0,1.16fr)_22rem]' : 'flex-col'} w-full`}
		href={href}
		aria-label={`打开 ${snippet.title}`}
	>
		<div
			class={`preview-canvas relative overflow-hidden ${featured ? 'min-h-[30rem] flex-1 xl:min-h-full xl:border-r xl:border-border/66' : 'h-24 shrink-0 border-b border-border/68'}`}
		>
			{#if featured}
				<SnippetPreviewMedia
					id={snippet.id}
					coverUrl={snippet.media.coverUrl}
					demoUrl={undefined}
					videoMode="controls"
					variant="gallery"
					eyebrow={categoryLabel(snippet.categoryPrimary)}
					metaText={`${difficultyLabel(snippet.difficulty)} · ${reuseLabel}`}
					summary={snippet.summary}
					tags={snippet.tags}
					featured={featured}
					accented={accented}
					className="cover"
					alt={snippet.title}
				/>
				<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(247,248,251,0.34)] via-transparent to-white/10"></div>
			{:else}
				<div
					class={`absolute inset-0 ${
						accented
							? 'bg-[radial-gradient(circle_at_top_left,rgba(161,187,230,0.12),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(249,250,252,0.98)_100%)]'
							: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(249,250,252,0.98)_100%)]'
					}`}
					role="img"
					aria-label={snippet.title}
				></div>
				<div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/78"></div>
				<div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border/72"></div>
				{#if accented}
					<div class="pointer-events-none absolute left-4 top-4 h-1.5 w-9 rounded-full bg-primary/30"></div>
				{/if}
			{/if}
		</div>

		{#if featured}
			<div class="flex flex-col justify-between gap-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(249,250,252,0.98)_100%)] px-5 py-5 xl:px-6 xl:py-6">
				<div class="grid gap-3">
					<p class="section-kicker !mb-0">精选片段</p>
					<div class="grid gap-2.5">
						<h2 class="m-0 font-(family-name:--font-display) text-[clamp(1.5rem,1.7vw,2rem)] leading-[1.02] tracking-tight text-foreground">
							{snippet.title}
						</h2>
						<p class="m-0 text-sm leading-7 text-foreground/72">
							{snippet.summary}
						</p>
					</div>
				</div>

				<div class="grid gap-3">
					<div class="surface-interactive grid gap-2 px-4 py-3">
						<p class="ui-label">适合场景</p>
						<div class="flex flex-wrap gap-2">
							{#each snippet.tags.slice(0, 3) as tag (tag)}
								<span class="glass-pill inline-flex items-center px-3 py-1.5 text-xs text-foreground/76">
									{tag}
								</span>
							{/each}
						</div>
					</div>
					<div class="surface-interactive grid gap-2 px-4 py-3">
						<p class="ui-label">复用方式</p>
						<p class="m-0 text-sm leading-6 text-foreground/76">{metaLine}</p>
					</div>
				</div>
			</div>
		{:else}
			<Card.Content class="grid min-h-[7.6rem] content-start gap-1.5 px-4 pb-4 pt-4">
				<h2 class="m-0 font-(family-name:--font-display) text-[1.02rem] leading-tight tracking-tight text-foreground">
					{snippet.title}
				</h2>
				<p class="m-0 text-[0.82rem] text-foreground/62">{metaLine}</p>
				{#if hasCodeCopy || hasPromptCopy}
					<div class="glass-pill-shell mt-2 inline-flex w-fit gap-1 p-1">
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
				{/if}
			</Card.Content>
		{/if}
	</a>

	{#if featured}
		<div class="glass-pill-shell absolute right-3 top-3 z-20 inline-flex gap-1 p-1">
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
	{/if}
</Card.Root>
