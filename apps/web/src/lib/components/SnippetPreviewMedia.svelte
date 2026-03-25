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
			<div class="gallery-grid" aria-hidden="true"></div>

			<div class="gallery-top">
				<span>{eyebrow || id.replaceAll('-', ' ')}</span>
			</div>

			<div class="gallery-chrome gallery-chrome-a" aria-hidden="true">
				<div></div>
				<div></div>
				<div></div>
			</div>

			<div class="gallery-chrome gallery-chrome-b" aria-hidden="true">
				<div></div>
				<div></div>
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
		position: relative;
		isolation: isolate;
		overflow: hidden;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(244, 248, 255, 0.97)),
			radial-gradient(circle at 16% 16%, rgba(96, 177, 255, 0.18), transparent 28%);
	}

	.gallery-source {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.06;
		filter: saturate(0.64) brightness(1.03);
		transform: scale(1.03);
	}

	.gallery-glow {
		position: absolute;
		border-radius: 999px;
		filter: blur(16px);
		pointer-events: none;
	}

	.gallery-glow-a {
		top: -8%;
		left: 10%;
		width: 26%;
		height: 20%;
		background: rgba(96, 177, 255, 0.18);
	}

	.gallery-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(17, 17, 17, 0.035) 1px, transparent 1px),
			linear-gradient(90deg, rgba(17, 17, 17, 0.03) 1px, transparent 1px);
		background-size: 100% 100%, 13rem 100%;
		mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.5), transparent 88%);
	}

	.gallery-top,
	.gallery-footer,
	.gallery-chrome {
		position: absolute;
		z-index: 1;
	}

	.gallery-top {
		top: 0.78rem;
		left: 0.78rem;
	}

	.gallery-top span {
		display: inline-flex;
		padding: 0.36rem 0.62rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.82);
		border: 1px solid rgba(17, 17, 17, 0.05);
		font-size: 0.62rem;
		letter-spacing: 0.06em;
		color: rgba(17, 17, 17, 0.56);
	}

	.gallery-chrome {
		border-radius: 1.35rem;
		border: 1px solid rgba(17, 17, 17, 0.05);
		background: rgba(255, 255, 255, 0.78);
		box-shadow: 0 10px 22px rgba(17, 17, 17, 0.04);
	}

	.gallery-chrome-a {
		top: 18%;
		right: 10%;
		display: grid;
		gap: 0.48rem;
		width: 34%;
		padding: 0.88rem;
	}

	.gallery-chrome-a div:nth-child(1) {
		width: 62%;
		height: 0.72rem;
		border-radius: 999px;
		background: rgba(0, 132, 255, 0.52);
	}

	.gallery-chrome-a div:nth-child(2),
	.gallery-chrome-a div:nth-child(3) {
		height: 0.62rem;
		border-radius: 999px;
		background: rgba(17, 17, 17, 0.08);
	}

	.gallery-chrome-b {
		left: 12%;
		bottom: 18%;
		display: grid;
		gap: 0.48rem;
		width: 40%;
		padding: 0.92rem;
	}

	.gallery-chrome-b div:nth-child(1) {
		width: 72%;
		height: 0.78rem;
		border-radius: 999px;
		background: rgba(17, 17, 17, 0.12);
	}

	.gallery-chrome-b div:nth-child(2) {
		width: 50%;
		height: 0.74rem;
		border-radius: 999px;
		background: rgba(17, 17, 17, 0.08);
	}

	.gallery-footer {
		left: 0.78rem;
		right: 0.78rem;
		bottom: 0.78rem;
		display: grid;
		gap: 0.18rem;
		padding: 0.72rem 0.78rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.88);
		border: 1px solid rgba(17, 17, 17, 0.05);
		box-shadow: 0 10px 22px rgba(17, 17, 17, 0.045);
	}

	.gallery-footer p,
	.gallery-footer span {
		margin: 0;
	}

	.gallery-footer p {
		font-size: 0.8rem;
		font-weight: 600;
		line-height: 1.16;
		letter-spacing: -0.02em;
		color: rgba(17, 17, 17, 0.82);
	}

	.gallery-footer span {
		font-size: 0.66rem;
		color: rgba(17, 17, 17, 0.5);
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
