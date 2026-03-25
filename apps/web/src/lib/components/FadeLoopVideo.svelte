<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		src: string;
		className?: string;
		poster?: string;
	};

	let { src, className = '', poster }: Props = $props();

	let videoEl: HTMLVideoElement | undefined;

	onMount(() => {
		const video = videoEl;

		if (!video) {
			return;
		}

		let frame = 0;
		let restartTimer: ReturnType<typeof setTimeout> | undefined;
		const fadeDuration = 0.5;

		const updateOpacity = () => {
			const duration = Number.isFinite(video.duration) ? video.duration : 0;
			const currentTime = video.currentTime || 0;

			let opacity = duration > 0 ? 1 : 0;

			if (duration > 0) {
				if (currentTime < fadeDuration) {
					opacity = Math.min(currentTime / fadeDuration, 1);
				} else if (duration - currentTime < fadeDuration) {
					opacity = Math.max((duration - currentTime) / fadeDuration, 0);
				}
			}

			video.style.opacity = `${opacity}`;
			frame = requestAnimationFrame(updateOpacity);
		};

		const ensurePlayback = async () => {
			try {
				await video.play();
			} catch {
				// Browsers may block autoplay until muted metadata is ready.
			}
		};

		const restart = () => {
			video.style.opacity = '0';

			if (restartTimer) {
				clearTimeout(restartTimer);
			}

			restartTimer = setTimeout(() => {
				video.currentTime = 0;
				void ensurePlayback();
			}, 100);
		};

		video.addEventListener('ended', restart);
		video.addEventListener('loadeddata', ensurePlayback);

		void ensurePlayback();
		frame = requestAnimationFrame(updateOpacity);

		return () => {
			cancelAnimationFrame(frame);
			video.removeEventListener('ended', restart);
			video.removeEventListener('loadeddata', ensurePlayback);

			if (restartTimer) {
				clearTimeout(restartTimer);
			}
		};
	});
</script>

<video
	bind:this={videoEl}
	class={className}
	src={src}
	{poster}
	autoplay
	muted
	playsinline
	preload="auto"
>
	<track kind="captions" srclang="zh" label="中文字幕" />
</video>
