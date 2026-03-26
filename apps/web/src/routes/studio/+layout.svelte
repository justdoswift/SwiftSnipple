<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import StudioSidebar from '$lib/components/studio/StudioSidebar.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { logoutAdmin } from '$lib/studio/api';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let { children, data } = $props();

	const isStudioRoute = $derived(page.url.pathname.startsWith('/studio'));
	const shellWidthClass = $derived(
		page.url.pathname.startsWith('/studio/snippets/')
			? 'max-w-6xl'
			: page.url.pathname === '/studio'
				? 'max-w-5xl'
				: page.url.pathname === '/studio/snippets'
					? 'max-w-5xl'
					: 'max-w-4xl'
	);

	function routeMeta(pathname: string) {
		if (pathname === '/studio') {
			return {
				title: '内容运营台',
				description: ''
			};
		}

		if (pathname === '/studio/snippets') {
			return {
				title: '内容管理',
				description: ''
			};
		}

		if (pathname === '/studio/snippets/new') {
			return {
				title: '新建内容',
				description: ''
			};
		}

		if (pathname.startsWith('/studio/snippets/')) {
			return {
				title: '编辑内容',
				description: ''
			};
		}

		return {
			title: 'Studio',
			description: ''
		};
	}

	async function handleLogout() {
		await logoutAdmin(fetch);
		await goto('/studio/login');
	}
</script>

{#if page.url.pathname === '/studio/login'}
	<div class="studio-workspace">
		<div class="studio-page-shell flex min-h-screen items-center px-4 py-8 md:px-6">
			<div class="mx-auto w-full max-w-5xl">
				{#if data.sessionError}
					<div class="mb-4 rounded-[calc(var(--radius)+0.1rem)] border border-destructive/20 bg-card px-5 py-4 text-sm text-destructive [box-shadow:var(--shadow-sm)]">
						<strong class="block font-semibold">后台服务暂时不可用</strong>
						<span class="mt-1 block">{data.sessionError}</span>
					</div>
				{/if}
				{@render children()}
			</div>
		</div>
	</div>
{:else}
	<Sidebar.Provider class="studio-workspace">
		<StudioSidebar username={data.session.username} />

		<Sidebar.Inset class="bg-transparent">
			<div class={`studio-page-shell mx-auto flex w-full flex-1 flex-col px-3 pb-8 pt-3 md:px-4 ${shellWidthClass}`}>
				<header class="surface-popover sticky top-3 z-30 mb-5 rounded-[calc(var(--radius)+0.25rem)] px-4 py-3 md:px-5">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div class="flex min-w-0 items-start gap-3">
							<Sidebar.Trigger class="mt-0.5 md:hidden" />

							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
									<span>SwiftSnippet</span>
									<ChevronRightIcon class="size-3" />
									<span>Studio</span>
									<ChevronRightIcon class="size-3" />
									<span>{routeMeta(page.url.pathname).title}</span>
								</div>

								<h1 class="mt-2 text-2xl font-semibold tracking-tight text-foreground">
									{routeMeta(page.url.pathname).title}
								</h1>
								{#if routeMeta(page.url.pathname).description}
									<p class="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
										{routeMeta(page.url.pathname).description}
									</p>
								{/if}
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-3 lg:justify-end">
							<Badge variant="outline">
								内部运营
							</Badge>
							<div class="surface-muted rounded-[calc(var(--radius)-1px)] px-3 py-2">
								<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
									当前会话
								</p>
								<p class="mt-1 text-sm font-medium text-foreground">{data.session.username}</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={handleLogout}
							>
								<LogOutIcon class="size-4" />
								退出登录
							</Button>
						</div>
					</div>
					<Separator class="mt-3" />
				</header>

				{#if isStudioRoute}
					<div class="flex flex-1 flex-col gap-5">
						{@render children()}
					</div>
				{/if}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
