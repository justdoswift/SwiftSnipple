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
		metaText = ''
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
				class="absolute inset-0 size-full scale-[1.02] object-cover opacity-[0.1] saturate-[0.82] brightness-[1.02]"
				src={activeCoverUrl}
				alt={alt}
				{loading}
				onerror={handleCoverError}
			/>
		{/if}

		<div class="page-orb page-orb-primary absolute left-[12%] top-[10%] h-[16%] w-[24%] blur-[20px]"></div>
		<div class="page-orb page-orb-soft absolute bottom-[18%] right-[10%] h-[14%] w-[22%] blur-[20px]"></div>
		<div
			class="preview-grid-mask pointer-events-none absolute inset-0"
			aria-hidden="true"
		></div>

		<div class="absolute left-3 top-3 z-1">
			<Badge variant="outline" class="bg-card/88 text-[0.62rem] tracking-[0.06em] text-muted-foreground">
				{eyebrow || id.replaceAll('-', ' ')}
			</Badge>
		</div>

		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<Card.Root class="absolute left-[10%] top-[14%] h-[58%] w-[72%] overflow-hidden rounded-[calc(var(--radius)+0.75rem)] border-border/75 bg-card/96">
				<div class="flex items-center justify-between border-b px-4 py-3">
					<div class="flex gap-1.5">
						<div class="size-2 rounded-full bg-primary/55"></div>
						<div class="size-2 rounded-full bg-foreground/14"></div>
						<div class="size-2 rounded-full bg-foreground/10"></div>
					</div>
					<div class="h-2 w-20 rounded-full bg-foreground/8"></div>
				</div>
				<div class="grid h-[calc(100%-3.1rem)] grid-cols-[5rem_minmax(0,1fr)]">
					<div class="border-r bg-muted/60 px-3 py-4">
						<div class="mb-3 h-2.5 w-8 rounded-full bg-primary/55"></div>
						<div class="space-y-2">
							<div class="h-2 rounded-full bg-foreground/12"></div>
							<div class="h-2 rounded-full bg-foreground/10"></div>
							<div class="h-2 w-3/4 rounded-full bg-foreground/10"></div>
						</div>
					</div>
					<div class="grid gap-3 px-4 py-4">
						<div class="grid gap-2">
							<div class="h-2.5 w-2/5 rounded-full bg-foreground/16"></div>
							<div class="grid grid-cols-[1.4fr_0.9fr] gap-3">
								<div class="rounded-[calc(var(--radius)+0.2rem)] border border-border/70 bg-background/82 p-3">
									<div class="mb-2 h-24 rounded-[calc(var(--radius)-1px)] bg-primary/12"></div>
									<div class="space-y-2">
										<div class="h-2 rounded-full bg-foreground/12"></div>
										<div class="h-2 w-3/4 rounded-full bg-foreground/10"></div>
									</div>
								</div>
								<div class="grid gap-3">
									<div class="rounded-[calc(var(--radius)+0.2rem)] border border-border/70 bg-background/88 p-3">
										<div class="mb-2 h-2.5 w-12 rounded-full bg-primary/52"></div>
										<div class="space-y-2">
											<div class="h-2 rounded-full bg-foreground/12"></div>
											<div class="h-2 rounded-full bg-foreground/10"></div>
										</div>
									</div>
									<div class="rounded-[calc(var(--radius)+0.2rem)] border border-border/70 bg-background/88 p-3">
										<div class="mb-2 h-2.5 w-10 rounded-full bg-foreground/12"></div>
										<div class="h-10 rounded-[calc(var(--radius)-1px)] bg-muted/80"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Card.Root>
			<Card.Root class="absolute bottom-[14%] right-[10%] w-[30%] rounded-[calc(var(--radius)+0.5rem)] border-border/75 bg-card/96 px-4 py-4">
				<div class="mb-2 h-2.5 w-16 rounded-full bg-primary/52"></div>
				<div class="space-y-2">
					<div class="h-2 rounded-full bg-foreground/12"></div>
					<div class="h-2 w-4/5 rounded-full bg-foreground/10"></div>
					<div class="h-2 w-3/5 rounded-full bg-foreground/10"></div>
				</div>
			</Card.Root>
		</div>

		<Card.Root class="absolute bottom-3 left-3 right-3 z-1 gap-1 rounded-[calc(var(--radius)+0.25rem)] border-border/75 bg-card/94 px-4 py-3">
			<p class="m-0 text-sm font-semibold leading-tight tracking-tight text-foreground">{displayTitle}</p>
			{#if metaText}
				<span class="m-0 text-xs text-muted-foreground">{metaText}</span>
			{/if}
		</Card.Root>
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
