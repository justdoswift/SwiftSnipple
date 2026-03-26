<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { fallbackCoverUrl } from '$lib/discovery/presentation';

	type Props = {
		id: string;
		coverUrl: string;
		demoUrl?: string;
		videoMode?: 'controls' | 'ambient';
		className?: string;
		alt: string;
		loading?: 'lazy' | 'eager';
		variant?: 'default' | 'gallery';
		eyebrow?: string;
		metaText?: string;
		summary?: string;
		tags?: string[];
		featured?: boolean;
		accented?: boolean;
	};

	let {
		id,
		coverUrl,
		demoUrl,
		videoMode = 'controls',
		className = '',
		alt,
		loading = 'lazy',
		variant = 'default',
		eyebrow = '',
		metaText = '',
		summary = '',
		tags = [],
		featured = false,
		accented = false
	}: Props = $props();

	type CoverState = 'cover' | 'fallback' | 'missing';
	let coverState = $state<CoverState>('cover');
	let demoFailed = $state(false);
	const resolvedFallbackCoverUrl = $derived(fallbackCoverUrl(id));
	const activeCoverUrl = $derived(
		coverState === 'fallback' ? resolvedFallbackCoverUrl : coverState === 'cover' ? coverUrl : ''
	);
	const useVideo = $derived(Boolean(demoUrl) && !demoFailed);
	const isGallery = $derived(variant === 'gallery');
	const ambientVideo = $derived(videoMode === 'ambient');
	const isGeneratedCover = $derived(activeCoverUrl.startsWith('/generated-covers/'));
	const isPublishedCover = $derived(activeCoverUrl.startsWith('/published/'));
	const useComposedCover = $derived(isGallery || isGeneratedCover || isPublishedCover);
	const showSourceImage = $derived(Boolean(activeCoverUrl) && !isGeneratedCover && !isPublishedCover);
	const videoPoster = $derived(isPublishedCover ? undefined : activeCoverUrl || undefined);
	const displayTitle = $derived(alt.replace(/ (预览图|详情封面)$/, ''));
	const previewTags = $derived(featured ? tags.slice(0, 2) : []);
	const previewModeLabel = $derived(featured ? '精选内容' : accented ? '推荐预览' : '片段预览');

	function handleCoverError() {
		if (coverState === 'cover') {
			coverState = 'fallback';
			return;
		}
		coverState = 'missing';
	}

	function handleVideoError() {
		demoFailed = true;
	}
</script>

{#if useVideo && demoUrl}
	<video
		class={className}
		src={demoUrl}
		controls={!ambientVideo}
		autoplay={ambientVideo}
		muted={ambientVideo}
		loop={ambientVideo}
		playsinline={ambientVideo}
		preload={ambientVideo ? 'auto' : 'metadata'}
		poster={videoPoster}
		onerror={handleVideoError}
	>
		<track kind="captions" srclang="zh" label="中文字幕" />
		<p>当前浏览器不支持内嵌视频播放。</p>
	</video>
{:else if useComposedCover}
	<div
		class={`preview-canvas relative isolate block size-full min-h-full overflow-hidden ${className}`}
		role="img"
		aria-label={alt}
	>
		{#if showSourceImage}
			<img
				class={`absolute inset-0 size-full scale-[1.02] object-cover saturate-[0.82] brightness-[1.02] ${
					featured ? 'opacity-[0.14]' : accented ? 'opacity-[0.1]' : 'opacity-[0.08]'
				}`}
				src={activeCoverUrl}
				alt={alt}
				{loading}
				onerror={handleCoverError}
			/>
		{/if}

		<div class="page-orb page-orb-primary absolute left-[12%] top-[10%] h-[16%] w-[24%] blur-[20px]"></div>
		<div class="page-orb page-orb-soft absolute bottom-[18%] right-[10%] h-[14%] w-[22%] blur-[20px]"></div>
		<div class="page-orb page-orb-warm absolute bottom-[10%] left-[28%] h-[14%] w-[20%] blur-[24px]"></div>
		<div
			class="preview-grid-mask pointer-events-none absolute inset-0"
			aria-hidden="true"
		></div>

		<div class="absolute left-3 top-3 z-1 flex items-center gap-2">
			<Badge variant="secondary" class="text-[0.62rem] tracking-[0.06em] text-foreground/68">
				{eyebrow || id.replaceAll('-', ' ')}
			</Badge>
			{#if featured || accented}
				<Badge variant="outline" class="text-[0.62rem] tracking-[0.06em] text-foreground/62">
					{featured ? '精选' : '推荐'}
				</Badge>
			{/if}
		</div>

		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<Card.Root
				class={`absolute overflow-hidden rounded-[var(--radius-panel)] ${
					featured ? 'left-[6%] top-[10%] h-[68%] w-[71%]' : 'left-[8%] top-[13%] h-[63%] w-[74%]'
				}`}
			>
				<div class="flex items-center justify-between border-b border-border/62 px-4 py-3">
					<div class="flex gap-1.5">
						<div class="size-2 rounded-full bg-primary/55"></div>
						<div class="size-2 rounded-full bg-foreground/14"></div>
						<div class="size-2 rounded-full bg-foreground/10"></div>
					</div>
					<div class="glass-pill inline-flex items-center gap-2 px-3 py-1.5 text-[0.66rem] text-foreground/64">
						<span class="size-1.5 rounded-full bg-primary/70"></span>
						<span>{previewModeLabel}</span>
					</div>
				</div>
				<div
					class={`grid h-[calc(100%-3.55rem)] gap-3 p-4 ${
						featured ? 'grid-cols-[minmax(0,1.14fr)_12.5rem]' : 'grid-cols-[minmax(0,1fr)_11.5rem]'
					}`}
				>
					<div class="grid gap-3">
						<div
							class={`relative overflow-hidden rounded-[var(--radius-card)] border border-white/56 bg-[linear-gradient(145deg,rgba(255,255,255,0.74),rgba(244,247,252,0.96))] p-4 ${
								featured ? 'min-h-[13.6rem]' : 'min-h-[10.75rem]'
							}`}
						>
							<div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,178,233,0.22),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(244,213,176,0.18),transparent_42%)]"></div>
							<div class="relative z-10 flex h-full flex-col justify-between gap-3">
								<div class="flex items-start justify-between gap-3">
									<div class="glass-pill inline-flex items-center px-3 py-1.5 text-[0.66rem] text-foreground/68">
										{eyebrow || previewModeLabel}
									</div>
									<div class="surface-interactive rounded-full px-2.5 py-1 text-[0.66rem] text-foreground/68">
										SwiftUI
									</div>
								</div>
								<div class="grid gap-2.5">
									<p class="m-0 font-(family-name:--font-display) text-[clamp(1.05rem,1.5vw,1.34rem)] leading-tight tracking-tight text-foreground">
										{displayTitle}
									</p>
									{#if featured && summary}
										<p class="m-0 max-w-[26ch] text-[0.8rem] leading-6 text-foreground/70">
											{summary}
										</p>
									{/if}
								</div>
								{#if previewTags.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each previewTags as tag (tag)}
											<span class="glass-pill inline-flex items-center px-3 py-1.5 text-[0.66rem] text-foreground/72">
												{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						</div>
						<div class="grid grid-cols-[1.08fr_0.92fr] gap-3">
							<div class="surface-interactive grid gap-2 px-3.5 py-3">
								<p class="ui-label">结构重点</p>
								<div class="space-y-2">
									<div class="h-2.5 w-16 rounded-full bg-primary/52"></div>
									<div class="h-2 rounded-full bg-foreground/14"></div>
									<div class="h-2 w-4/5 rounded-full bg-foreground/12"></div>
								</div>
							</div>
							<div class="surface-interactive grid gap-2 px-3.5 py-3">
								<p class="ui-label">交互线索</p>
								<div class="space-y-2">
									<div class="h-2.5 w-14 rounded-full bg-foreground/14"></div>
									<div class="h-8 rounded-[calc(var(--radius-control)-0.14rem)] bg-primary/12"></div>
								</div>
							</div>
						</div>
					</div>
					<div class="grid gap-3">
						<div class="surface-interactive grid gap-2 px-3.5 py-3">
							<p class="ui-label">内容节奏</p>
							<div class="space-y-2">
								<div class="h-2.5 w-12 rounded-full bg-primary/48"></div>
								<div class="h-2 rounded-full bg-foreground/12"></div>
								<div class="h-2 w-5/6 rounded-full bg-foreground/10"></div>
								<div class="h-2 w-3/5 rounded-full bg-foreground/10"></div>
							</div>
						</div>
						<div class="surface-interactive grid gap-2 px-3.5 py-3">
							<p class="ui-label">Prompt</p>
							<div class="space-y-2">
								<div class="h-2 rounded-full bg-foreground/12"></div>
								<div class="h-2 rounded-full bg-foreground/10"></div>
								<div class="h-2 w-3/5 rounded-full bg-foreground/10"></div>
							</div>
						</div>
					</div>
				</div>
			</Card.Root>
			<Card.Root
				class={`surface-floating absolute rounded-[var(--radius-card)] px-4 py-4 ${
					featured ? 'bottom-[9%] right-[7%] w-[29%]' : 'bottom-[14%] right-[8%] w-[31%]'
				}`}
			>
				<p class="ui-label">复用提示</p>
				<div class="mt-2 space-y-2">
					<div class="h-2.5 w-16 rounded-full bg-primary/48"></div>
					<div class="h-2 rounded-full bg-foreground/12"></div>
					<div class="h-2 w-4/5 rounded-full bg-foreground/10"></div>
				</div>
				{#if metaText}
					<p class="mt-3 text-[0.7rem] leading-5 text-foreground/66">{metaText}</p>
				{/if}
			</Card.Root>
		</div>

		{#if !featured}
			<Card.Root class="surface-floating absolute bottom-3 left-3 right-3 z-1 gap-1 rounded-[var(--radius-card)] px-4 py-3">
				<p class="m-0 text-sm font-semibold leading-tight tracking-tight text-foreground">
					{displayTitle}
				</p>
				{#if metaText}
					<span class="m-0 text-xs text-foreground/62">{metaText}</span>
				{/if}
			</Card.Root>
		{/if}
	</div>
{:else if activeCoverUrl}
	<img class={className} src={activeCoverUrl} alt={alt} {loading} onerror={handleCoverError} />
{:else}
	<div
		class={`preview-fallback grid size-full place-items-center text-xl font-bold uppercase tracking-[0.12em] text-foreground/75 ${className}`}
	>
		{id.slice(0, 2).toUpperCase()}
	</div>
{/if}
