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

	function routeMeta(pathname: string) {
		if (pathname === '/studio') {
			return {
				title: '内容运营台',
				description: '把录入、补媒体、校验和发布收在同一套后台骨架里。'
			};
		}

		if (pathname === '/studio/snippets') {
			return {
				title: '内容管理',
				description: '筛选、扫描并进入单条内容的编辑与发布工作流。'
			};
		}

		if (pathname === '/studio/snippets/new') {
			return {
				title: '新建骨架',
				description: '先生成标准目录，再进入完整编辑。'
			};
		}

		if (pathname.startsWith('/studio/snippets/')) {
			return {
				title: '编辑内容',
				description: '围绕文件协议直接编辑，避免后台和仓库产生双份真相。'
			};
		}

		return {
			title: 'Studio',
			description: '内部内容运营后台。'
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
					<div class="mb-4 rounded-3xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm text-rose-700 shadow-sm">
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
			<div class="studio-page-shell flex flex-1 flex-col px-3 pb-8 pt-3 md:px-4">
				<header class="liquid-glass sticky top-3 z-30 mb-5 rounded-[28px] px-4 py-3 md:px-5">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div class="flex min-w-0 items-start gap-3">
							<Sidebar.Trigger class="mt-0.5 rounded-2xl border border-white/60 bg-white/70 text-slate-700 shadow-none hover:bg-white/90 md:hidden" />

							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
									<span>SwiftSnippet</span>
									<ChevronRightIcon class="size-3" />
									<span>Studio</span>
									<ChevronRightIcon class="size-3" />
									<span>{routeMeta(page.url.pathname).title}</span>
								</div>

								<h1
									class="mt-2 text-2xl tracking-[-0.04em] text-slate-950 md:text-[2rem]"
									style="font-family: var(--font-display)"
								>
									{routeMeta(page.url.pathname).title}
								</h1>
								<p class="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
									{routeMeta(page.url.pathname).description}
								</p>
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-3 lg:justify-end">
							<Badge
								variant="outline"
								class="rounded-full border-white/80 bg-white/72 px-2.5 py-1 text-[11px] font-medium text-slate-600"
							>
								内部运营
							</Badge>
							<div class="rounded-2xl border border-white/80 bg-white/80 px-3 py-2 shadow-xs">
								<p class="text-[0.68rem] font-semibold tracking-[0.14em] text-slate-400 uppercase">
									当前会话
								</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{data.session.username}</p>
							</div>
							<Button
								type="button"
								variant="outline"
								class="rounded-2xl border-white/80 bg-white/80 shadow-none hover:bg-white"
								onclick={handleLogout}
							>
								<LogOutIcon class="size-4" />
								退出登录
							</Button>
						</div>
					</div>
					<Separator class="mt-3 bg-white/70" />
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
