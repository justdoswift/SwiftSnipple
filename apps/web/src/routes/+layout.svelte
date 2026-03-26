<script lang="ts">
	import './layout.css';
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
{:else if page.url.pathname.startsWith('/studio')}
	<div class="studio-root-shell">{@render children()}</div>
{:else}
	<div class="site-shell">
		<header class="site-header">
			<div class="site-nav-pill liquid-glass">
				<a class="site-brand" href="/"><span class="site-brand-mark">SwiftSnippet</span></a>

				<nav class="site-nav" aria-label="主导航">
					{#each navigation as item (item.href)}
						<a
							class:active={isActive(item.href, page.url.pathname)}
							href={item.href}
						>{item.label}</a>
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
						></path>
					</svg>
				</a>
			</div>
		</header>

		<div class="site-main">{@render children()}</div>
	</div>
{/if}

<style>
	.site-shell {
		position: relative;
		min-height: 100vh;
	}

	.studio-root-shell {
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
		padding: 0.48rem 0.58rem 0.48rem 0.86rem;
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
		padding: 0.6rem 0.8rem;
		border-radius: 12px;
		color: rgba(17, 17, 17, 0.76);
		font-size: 0.86rem;
		font-weight: 500;
		transition: background 180ms ease,
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
		padding: 0.6rem 0.82rem;
		border-radius: 14px;
		text-decoration: none;
		color: #111111;
		font-size: 0.84rem;
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
		:global(main > section) {
			animation: none;
		}
	}
</style>
