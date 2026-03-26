<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import StudioSidebar from '$lib/components/studio/StudioSidebar.svelte';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert/index.js';
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
					<Alert variant="destructive" class="mb-4">
						<AlertTitle>后台服务暂时不可用</AlertTitle>
						<AlertDescription>{data.sessionError}</AlertDescription>
					</Alert>
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
				<header class="surface-panel studio-shell-header sticky top-3 z-30 mb-5">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div class="flex min-w-0 items-start gap-3">
							<Sidebar.Trigger class="mt-0.5 md:hidden" />

							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold tracking-[0.14em] text-foreground/48 uppercase">
									<span>SwiftSnippet</span>
									<ChevronRightIcon class="size-3" />
									<span>Studio</span>
									<ChevronRightIcon class="size-3" />
									<span>{routeMeta(page.url.pathname).title}</span>
								</div>

								<h1 class="mt-2 text-[1.75rem] font-semibold tracking-tight text-foreground">
									{routeMeta(page.url.pathname).title}
								</h1>
								{#if routeMeta(page.url.pathname).description}
									<p class="mt-1 max-w-xl text-sm leading-6 text-foreground/64">
										{routeMeta(page.url.pathname).description}
									</p>
								{/if}
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-2.5 lg:justify-end">
							<Badge variant="secondary">
								内部运营
							</Badge>
							<div class="surface-interactive rounded-[var(--radius-control)] px-3 py-2.5">
								<p class="text-[0.68rem] font-semibold tracking-[0.1em] text-foreground/46 uppercase">
									当前会话
								</p>
								<p class="mt-1 text-sm font-medium text-foreground/82">{data.session.username}</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onclick={handleLogout}
							>
								<LogOutIcon class="size-4" />
								退出登录
							</Button>
						</div>
					</div>
					<Separator class="mt-3 opacity-60" />
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
