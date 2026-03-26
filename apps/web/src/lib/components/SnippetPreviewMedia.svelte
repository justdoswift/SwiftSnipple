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
		class={`relative isolate block size-full min-h-full overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(244,248,255,0.96)),radial-gradient(circle_at_16%_16%,rgba(96,177,255,0.24),transparent_30%),linear-gradient(135deg,rgba(0,132,255,0.03),transparent_34%)] ${className}`}
		role="img"
		aria-label={alt}
	>
		{#if showSourceImage}
			<img
				class="absolute inset-0 size-full scale-[1.03] object-cover opacity-[0.18] saturate-[0.76] brightness-[1.01]"
				src={activeCoverUrl}
				alt={alt}
				{loading}
				onerror={handleCoverError}
			/>
		{/if}

		<div class="pointer-events-none absolute left-[10%] top-[-8%] h-[22%] w-[30%] rounded-full bg-[#60b1ff]/22 blur-[20px]"></div>
		<div class="pointer-events-none absolute bottom-[16%] right-[8%] h-[18%] w-[26%] rounded-full bg-[#319aff]/16 blur-[20px]"></div>
		<div
			class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.04)_1px,transparent_1px)] [background-size:100%_100%,13rem_100%] [mask-image:linear-gradient(180deg,rgba(255,255,255,0.6),transparent_88%)]"
			aria-hidden="true"
		></div>
		<div
			class="absolute left-[12%] top-[18%] h-3.5 w-[22%] rounded-full bg-[#0084ff]/72 shadow-[0_10px_24px_rgba(0,132,255,0.18)]"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute left-[6%] right-[6%] top-[42%] -translate-y-1/2 whitespace-nowrap font-(family-name:--font-display) text-[clamp(4.4rem,16vw,11rem)] leading-[0.9] tracking-[-0.07em] text-black/12 uppercase"
			aria-hidden="true"
		>
			{(eyebrow || id.replaceAll('-', ' ')).slice(0, 14)}
		</div>

		<div class="absolute left-3 top-3 z-1">
			<Badge variant="outline" class="bg-card/90 text-[0.62rem] tracking-[0.06em] text-muted-foreground">
				{eyebrow || id.replaceAll('-', ' ')}
			</Badge>
		</div>

		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<Card.Root class="absolute right-[10%] top-[14%] w-[38%] gap-2 rounded-[1.45rem] border bg-card/90 px-4 py-4 shadow-xs">
				<div class="h-[0.72rem] w-[66%] rounded-full bg-[#0084ff]/72"></div>
				<div class="h-[0.6rem] rounded-full bg-black/14"></div>
				<div class="h-[0.6rem] rounded-full bg-black/14"></div>
			</Card.Root>
			<Card.Root class="absolute bottom-[16%] left-[12%] w-[48%] gap-2 rounded-[1.45rem] border bg-card/90 px-4 py-4 shadow-xs">
				<div class="h-[0.8rem] w-[78%] rounded-full bg-black/18"></div>
				<div class="h-[0.74rem] w-[62%] rounded-full bg-black/14"></div>
				<div class="h-[0.74rem] w-[46%] rounded-full bg-[#0084ff]/34"></div>
			</Card.Root>
		</div>

		<Card.Root class="absolute bottom-3 left-3 right-3 z-1 gap-1 rounded-2xl border bg-card/95 px-4 py-3 shadow-xs">
			<p class="m-0 text-sm font-semibold leading-tight tracking-tight text-foreground">{alt}</p>
			{#if metaText}
				<span class="m-0 text-xs text-muted-foreground">{metaText}</span>
			{/if}
		</Card.Root>
	</div>
{:else if activeCoverUrl}
	<img class={className} src={activeCoverUrl} alt={alt} {loading} onerror={handleCoverError} />
{:else}
	<div
		class={`grid size-full place-items-center bg-[radial-gradient(circle_at_18%_18%,rgba(96,177,255,0.3),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(49,154,255,0.2),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,247,255,0.96))] text-xl font-bold uppercase tracking-[0.12em] text-black/75 ${className}`}
	>
		{id.slice(0, 2).toUpperCase()}
	</div>
{/if}
