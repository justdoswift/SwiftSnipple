<script lang="ts">
	import './layout.css';
	import '@fontsource/fustat/700.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/geist-sans/400.css';
	import '@fontsource/geist-sans/500.css';
	import { Button } from '$lib/components/ui/button/index.js';
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
	<div class="relative min-h-screen">{@render children()}</div>
{:else}
	<div class="relative min-h-screen">
		<div class="pointer-events-none absolute -left-20 -top-36 z-0 h-48 w-88 rounded-full bg-[#60b1ff]/15 blur-3xl"></div>
		<div class="pointer-events-none absolute left-32 top-[-4rem] z-0 h-36 w-56 rounded-full bg-[#319aff]/10 blur-3xl"></div>

		<header class="sticky top-[30px] z-20 flex justify-center px-5 max-[900px]:top-4">
			<div class="inline-flex w-fit items-center gap-3 rounded-2xl border bg-card/92 px-3 py-2 shadow-xs backdrop-blur-sm max-[900px]:w-full max-[900px]:max-w-[calc(100vw-1.5rem)] max-[900px]:justify-between max-[900px]:px-3.5">
				<a class="inline-flex items-center no-underline" href="/">
					<span class="font-(family-name:--font-display) text-base font-bold tracking-tight">
						SwiftSnippet
					</span>
				</a>

				<nav class="flex flex-wrap items-center gap-0.5 max-[900px]:hidden" aria-label="主导航">
					{#each navigation as item (item.href)}
						<a
							class={`rounded-xl px-3 py-2 text-sm font-medium no-underline transition-colors ${
								isActive(item.href, page.url.pathname)
									? 'bg-background text-foreground'
									: 'text-foreground/75 hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground'
							}`}
							href={item.href}
						>
							{item.label}
						</a>
					{/each}
				</nav>

				<Button href="/explore" variant="outline" size="sm" class="rounded-full">
					<span>开始浏览</span>

					<svg class="size-4" viewBox="0 0 20 20" aria-hidden="true">
						<path
							d="M6.25 10h7.5m0 0-3.125-3.125M13.75 10l-3.125 3.125"
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
						></path>
					</svg>
				</Button>
			</div>
		</header>

		<div class="relative z-1">{@render children()}</div>
	</div>
{/if}
