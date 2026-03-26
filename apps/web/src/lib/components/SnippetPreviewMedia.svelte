<script lang="ts">
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
{:else}
	{#if useComposedCover}
		<div class={`gallery-cover ${className}`} role="img" aria-label={alt}>
			{#if showSourceImage}
				<img
					class="gallery-source"
					src={activeCoverUrl}
					alt={alt}
					{loading}
					onerror={handleCoverError}
				/>
			{/if}

			<div class="gallery-glow gallery-glow-a"></div>
			<div class="gallery-glow gallery-glow-b"></div>
			<div class="gallery-grid" aria-hidden="true"></div>
			<div class="gallery-accent" aria-hidden="true"></div>
			<div class="gallery-watermark" aria-hidden="true">
				{(eyebrow || id.replaceAll('-', ' ')).slice(0, 14)}
			</div>

			<div class="gallery-top">
				<span>{eyebrow || id.replaceAll('-', ' ')}</span>
			</div>

			<div class="gallery-stage" aria-hidden="true">
				<div class="gallery-card gallery-card-primary">
					<div></div>
					<div></div>
					<div></div>
				</div>
				<div class="gallery-card gallery-card-secondary">
					<div></div>
					<div></div>
					<div></div>
				</div>
			</div>

			<div class="gallery-footer">
				<p>{alt}</p>
				{#if metaText}
					<span>{metaText}</span>
				{/if}
			</div>
		</div>
	{:else if activeCoverUrl}
		<img class={className} src={activeCoverUrl} alt={alt} {loading} onerror={handleCoverError} />
	{:else}
		<div class={`fallback-cover ${className}`}>{id.slice(0, 2).toUpperCase()}</div>
	{/if}
{/if}

<style>
	.cover,
	.feature-image,
	.hero-media,
	.tab-media {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.gallery-cover {
		display: block;
		position: relative;
		isolation: isolate;
		overflow: hidden;
		width: 100%;
		height: 100%;
		min-height: 100%;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.985), rgba(244, 248, 255, 0.96)),
			radial-gradient(circle at 16% 16%, rgba(96, 177, 255, 0.24), transparent 30%),
			linear-gradient(135deg, rgba(0, 132, 255, 0.03), transparent 34%);
	}

	.gallery-source {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.18;
		filter: saturate(0.76) brightness(1.01);
		transform: scale(1.03);
	}

	.gallery-glow {
		position: absolute;
		border-radius: 999px;
		filter: blur(20px);
		pointer-events: none;
	}

	.gallery-glow-a {
		top: -8%;
		left: 10%;
		width: 30%;
		height: 22%;
		background: rgba(96, 177, 255, 0.22);
	}

	.gallery-glow-b {
		right: 8%;
		bottom: 16%;
		width: 26%;
		height: 18%;
		background: rgba(49, 154, 255, 0.16);
	}

	.gallery-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(17, 17, 17, 0.045) 1px, transparent 1px),
			linear-gradient(90deg, rgba(17, 17, 17, 0.04) 1px, transparent 1px);
		background-size: 100% 100%, 13rem 100%;
		mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.6), transparent 88%);
	}

	.gallery-top,
	.gallery-footer,
	.gallery-stage,
	.gallery-watermark {
		position: absolute;
		z-index: 1;
	}

	.gallery-watermark {
		left: 6%;
		right: 6%;
		top: 42%;
		transform: translateY(-50%);
		font-family: var(--font-display);
		font-size: clamp(4.4rem, 16vw, 11rem);
		letter-spacing: -0.07em;
		line-height: 0.9;
		color: rgba(17, 17, 17, 0.12);
		text-transform: uppercase;
		white-space: nowrap;
		pointer-events: none;
	}

	.gallery-accent {
		position: absolute;
		top: 18%;
		left: 12%;
		width: 22%;
		height: 0.86rem;
		border-radius: 999px;
		background: rgba(0, 132, 255, 0.72);
		box-shadow: 0 10px 24px rgba(0, 132, 255, 0.18);
	}

	.gallery-top {
		top: 0.78rem;
		left: 0.78rem;
	}

	.gallery-top span {
		display: inline-flex;
		padding: 0.36rem 0.62rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(17, 17, 17, 0.08);
		font-size: 0.62rem;
		letter-spacing: 0.06em;
		color: rgba(17, 17, 17, 0.62);
	}

	.gallery-stage {
		inset: 0;
		pointer-events: none;
	}

	.gallery-card {
		position: absolute;
		display: grid;
		gap: 0.5rem;
		padding: 0.92rem;
		border-radius: 1.45rem;
		border: 1px solid rgba(17, 17, 17, 0.08);
		background: rgba(255, 255, 255, 0.88);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.94),
			0 14px 26px rgba(17, 17, 17, 0.05);
	}

	.gallery-card-primary {
		top: 14%;
		right: 10%;
		width: 38%;
	}

	.gallery-card-primary div:nth-child(1) {
		width: 66%;
		height: 0.72rem;
		border-radius: 999px;
		background: rgba(0, 132, 255, 0.72);
	}

	.gallery-card-primary div:nth-child(2),
	.gallery-card-primary div:nth-child(3) {
		height: 0.6rem;
		border-radius: 999px;
		background: rgba(17, 17, 17, 0.14);
	}

	.gallery-card-secondary {
		left: 12%;
		bottom: 16%;
		width: 48%;
	}

	.gallery-card-secondary div:nth-child(1) {
		width: 78%;
		height: 0.8rem;
		border-radius: 999px;
		background: rgba(17, 17, 17, 0.18);
	}

	.gallery-card-secondary div:nth-child(2) {
		width: 62%;
		height: 0.74rem;
		border-radius: 999px;
		background: rgba(17, 17, 17, 0.14);
	}

	.gallery-card-secondary div:nth-child(3) {
		width: 46%;
		height: 0.74rem;
		border-radius: 999px;
		background: rgba(0, 132, 255, 0.34);
	}

	.gallery-footer {
		left: 0.78rem;
		right: 0.78rem;
		bottom: 0.78rem;
		display: grid;
		gap: 0.18rem;
		padding: 0.7rem 0.76rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(17, 17, 17, 0.08);
		box-shadow: 0 10px 22px rgba(17, 17, 17, 0.05);
	}

	.gallery-footer p,
	.gallery-footer span {
		margin: 0;
	}

	.gallery-footer p {
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.16;
		letter-spacing: -0.02em;
		color: rgba(17, 17, 17, 0.88);
	}

	.gallery-footer span {
		font-size: 0.66rem;
		color: rgba(17, 17, 17, 0.56);
	}

	.fallback-cover {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		font-size: 1.2rem;
		font-weight: 700;
		color: rgba(17, 17, 17, 0.76);
		text-transform: uppercase;
		background:
			radial-gradient(circle at 18% 18%, rgba(96, 177, 255, 0.3), transparent 34%),
			radial-gradient(circle at 78% 12%, rgba(49, 154, 255, 0.2), transparent 30%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 247, 255, 0.96));
		letter-spacing: 0.12em;
	}
</style>
