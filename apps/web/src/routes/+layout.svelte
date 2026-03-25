<script lang="ts">
	import '@fontsource/fustat/700.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/geist-sans/400.css';
	import '@fontsource/geist-sans/500.css';

	import { page } from '$app/state';

	let { children } = $props();

	const navigation = [
		{ href: '/#hero', label: '首页' },
		{ href: '/#feed', label: '片段库' },
		{ href: '/explore', label: '发现' },
		{ href: '/#trust', label: '品牌' }
	];

	function isActive(href: string, pathname: string) {
		if (href.startsWith('/#')) {
			return pathname === '/';
		}

		return href === '/' ? pathname === '/' : pathname.startsWith(href);
	}
</script>

{#if page.url.pathname === '/health'}
	{@render children()}
{:else}
	<div class="site-shell">
		<header class="site-header">
			<div class="site-nav-pill liquid-glass">
				<a class="site-brand" href="/">
					<span class="site-brand-mark">SwiftSnippet</span>
				</a>

				<nav class="site-nav" aria-label="主导航">
					{#each navigation as item (item.href)}
						<a class:active={isActive(item.href, page.url.pathname)} href={item.href}>
							{item.label}
						</a>
					{/each}
				</nav>

				<a class="site-cta liquid-glass" href="/explore">
					<span>开始浏览</span>
					<svg viewBox="0 0 20 20" aria-hidden="true">
						<path
							d="M6.25 10h7.5m0 0-3.125-3.125M13.75 10l-3.125 3.125"
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
						/>
					</svg>
				</a>
			</div>
		</header>

		<div class="site-main">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	:global(html) {
		background: #ffffff;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(body) {
		--page-width: 1720px;
		--site-bg: #ffffff;
		--site-panel: rgba(255, 255, 255, 0.38);
		--site-panel-strong: rgba(255, 255, 255, 0.62);
		--site-panel-soft: rgba(255, 255, 255, 0.52);
		--site-surface: rgba(255, 255, 255, 0.9);
		--site-surface-soft: rgba(251, 253, 255, 0.96);
		--site-border: rgba(0, 0, 0, 0.1);
		--site-border-strong: rgba(0, 0, 0, 0.14);
		--site-text: #111111;
		--site-muted: rgba(17, 17, 17, 0.68);
		--site-soft: rgba(17, 17, 17, 0.48);
		--site-accent: #0084ff;
		--site-accent-soft: rgba(0, 132, 255, 0.12);
		--site-chip: rgba(255, 255, 255, 0.65);
		--font-display: "Fustat", "Geist Sans", "PingFang SC", "Hiragino Sans GB", sans-serif;
		--font-body: "Inter", "Geist Sans", "PingFang SC", "Hiragino Sans GB", sans-serif;
		margin: 0;
		background:
			radial-gradient(42rem 22rem at 11% 4%, rgba(96, 177, 255, 0.22), transparent 58%),
			radial-gradient(32rem 18rem at 18% 10%, rgba(49, 154, 255, 0.18), transparent 60%),
			linear-gradient(180deg, #ffffff 0%, #fbfdff 48%, #f7fbff 100%);
		color: var(--site-text);
		font-family: var(--font-body);
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(a) {
		color: inherit;
	}

	:global(button),
	:global(input),
	:global(textarea) {
		font: inherit;
	}

	:global(::selection) {
		background: rgba(0, 132, 255, 0.14);
		color: #111111;
	}

	:global(.editorial-page) {
		position: relative;
		width: min(var(--page-width), calc(100vw - 3rem));
		margin: 0 auto;
		padding: 1rem clamp(1rem, 2.2vw, 1.8rem) 4rem;
	}

	:global(.editorial-panel) {
		border: 1px solid var(--site-border);
		background: var(--site-panel);
		border-radius: 1.4rem;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.62),
			0 16px 34px rgba(17, 17, 17, 0.06);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	:global(.section-kicker) {
		margin: 0 0 0.72rem;
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(17, 17, 17, 0.48);
		font-weight: 600;
	}

	:global(.display-title) {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(2.35rem, 5.8vw, 4.4rem);
		line-height: 1.03;
		letter-spacing: -0.035em;
	}

	:global(.section-title) {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(1.48rem, 2.9vw, 2.35rem);
		line-height: 1.08;
		letter-spacing: -0.03em;
	}

	:global(.section-copy) {
		margin: 0;
		color: var(--site-muted);
		line-height: 1.68;
		font-size: 0.92rem;
	}

	:global(.liquid-glass) {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0.3)),
			rgba(255, 255, 255, 0.28);
		backdrop-filter: blur(14px) saturate(1.08);
		-webkit-backdrop-filter: blur(14px) saturate(1.08);
		border: 1px solid rgba(255, 255, 255, 0.52);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.74),
			inset 0 -1px 0 rgba(255, 255, 255, 0.16),
			0 10px 28px rgba(17, 17, 17, 0.06);
		position: relative;
		overflow: hidden;
	}

	:global(.glass-panel) {
		background: rgba(255, 255, 255, 0.52);
		border: 1px solid rgba(255, 255, 255, 0.46);
		backdrop-filter: blur(10px) saturate(1.03);
		-webkit-backdrop-filter: blur(10px) saturate(1.03);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.62),
			0 10px 22px rgba(17, 17, 17, 0.04);
		position: relative;
		overflow: hidden;
	}

	:global(.content-surface) {
		background: linear-gradient(180deg, var(--site-surface), var(--site-surface-soft));
		border: 1px solid rgba(17, 17, 17, 0.06);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.92),
			0 16px 32px rgba(17, 17, 17, 0.045);
		position: relative;
		overflow: hidden;
	}

	:global(.liquid-glass::before) {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 1px;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.72) 0%,
			rgba(255, 255, 255, 0.34) 14%,
			rgba(255, 255, 255, 0.06) 34%,
			rgba(255, 255, 255, 0) 55%,
			rgba(255, 255, 255, 0.06) 78%,
			rgba(255, 255, 255, 0.3) 100%
		);
		-webkit-mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
	}

	.site-shell {
		position: relative;
		min-height: 100vh;
	}

	.site-shell::before,
	.site-shell::after {
		content: '';
		position: absolute;
		pointer-events: none;
		z-index: 0;
		border-radius: 999px;
		filter: blur(48px);
	}

	.site-shell::before {
		top: -9rem;
		left: -5rem;
		width: 22rem;
		height: 12rem;
		background: rgba(96, 177, 255, 0.14);
	}

	.site-shell::after {
		top: -4rem;
		left: 8rem;
		width: 14rem;
		height: 9rem;
		background: rgba(49, 154, 255, 0.1);
	}

	.site-header,
	.site-main {
		position: relative;
		z-index: 1;
	}

	.site-header {
		position: sticky;
		top: 30px;
		display: flex;
		justify-content: center;
		padding: 0 1.2rem;
		z-index: 20;
	}

	.site-nav-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		width: fit-content;
		padding: 0.52rem 0.62rem 0.52rem 0.9rem;
		border-radius: 16px;
	}

	.site-brand {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}

	.site-brand-mark {
		font-family: var(--font-display);
		font-size: 0.98rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.site-nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.15rem;
	}

	.site-nav a {
		text-decoration: none;
		padding: 0.64rem 0.86rem;
		border-radius: 12px;
		color: rgba(17, 17, 17, 0.8);
		font-size: 0.9rem;
		font-weight: 500;
		transition:
			background 180ms ease,
			color 180ms ease;
	}

	.site-nav a.active,
	.site-nav a:hover,
	.site-nav a:focus-visible {
		background: rgba(255, 255, 255, 0.42);
		color: #111111;
	}

	.site-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.64rem 0.88rem;
		border-radius: 14px;
		text-decoration: none;
		color: #111111;
		font-size: 0.88rem;
		font-weight: 500;
	}

	.site-cta svg {
		width: 1rem;
		height: 1rem;
	}

	@keyframes section-rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(main > section) {
		animation: section-rise 320ms cubic-bezier(0.2, 0.7, 0.18, 1) both;
	}

	:global(main > section:nth-of-type(2)) {
		animation-delay: 40ms;
	}

	:global(main > section:nth-of-type(3)) {
		animation-delay: 80ms;
	}

	@media (max-width: 900px) {
		.site-header {
			top: 16px;
		}

		.site-nav-pill {
			width: 100%;
			max-width: calc(100vw - 1.5rem);
			justify-content: space-between;
			padding-inline: 0.8rem;
		}

		.site-nav {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(*),
		:global(*::before),
		:global(*::after) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
			scroll-behavior: auto !important;
		}
	}
</style>
