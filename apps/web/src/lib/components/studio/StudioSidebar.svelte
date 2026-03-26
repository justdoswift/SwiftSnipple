<script lang="ts">
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import LibraryBigIcon from '@lucide/svelte/icons/library-big';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	type Props = {
		username: string;
	};

	let { username }: Props = $props();

	const primaryLinks = [
		{
			href: '/studio',
			label: '总览',
			description: '今日工作面',
			icon: LayoutDashboardIcon
		},
		{
			href: '/studio/snippets',
			label: '内容管理',
			description: '列表与筛选',
			icon: LibraryBigIcon
		}
	];

	function isActive(href: string) {
		return href === '/studio'
			? page.url.pathname === '/studio'
			: page.url.pathname.startsWith(href);
	}
</script>

<Sidebar.Root
	variant="inset"
	collapsible="icon"
	class="border-sidebar-border/60 bg-transparent"
>
	<Sidebar.Header class="border-sidebar-border/70 bg-white/72 supports-[backdrop-filter]:bg-white/58 border-b px-3 py-3 backdrop-blur-xl">
		<div class="flex items-start gap-3 px-1">
			<div class="from-primary/18 to-primary/8 flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br text-primary shadow-sm ring-1 ring-black/5">
				<SparklesIcon class="size-4" />
			</div>
			<div class="min-w-0 group-data-[collapsible=icon]:hidden">
				<p class="text-[0.68rem] font-semibold tracking-[0.18em] text-slate-500 uppercase">
					SwiftSnippet
				</p>
				<h2 class="mt-1 text-sm font-semibold tracking-[-0.03em] text-slate-950">Studio</h2>
				<p class="mt-1 text-xs leading-5 text-slate-500">内容录入、校验与发布工作台。</p>
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="px-2 py-3">
		<Sidebar.Group>
			<Sidebar.GroupLabel class="px-2 text-[0.68rem] font-semibold tracking-[0.14em] text-slate-400 uppercase">
				工作区
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each primaryLinks as item (item.href)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								size="lg"
								isActive={isActive(item.href)}
								tooltipContent={item.label}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={item.href}
										class={`${String(props.class ?? '')} rounded-2xl px-3 py-3`}
									>
										<item.icon class="size-4" />
										<span>{item.label}</span>
										<span class="ml-auto text-[11px] text-slate-400 group-data-[collapsible=icon]:hidden">
											{item.description}
										</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Group class="mt-5">
			<Sidebar.GroupLabel class="px-2 text-[0.68rem] font-semibold tracking-[0.14em] text-slate-400 uppercase">
				快捷入口
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent class="px-2 pt-2">
				<Button
					href="/studio/snippets/new"
					class="h-11 w-full justify-start rounded-2xl px-3 shadow-none group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
				>
					<PlusIcon class="size-4" />
					<span class="group-data-[collapsible=icon]:hidden">新建内容</span>
				</Button>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer class="border-sidebar-border/70 border-t px-3 py-3">
		<div class="group-data-[collapsible=icon]:hidden rounded-2xl border border-slate-200/80 bg-white/88 px-3 py-3 shadow-xs">
			<div class="flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-[0.68rem] font-semibold tracking-[0.14em] text-slate-400 uppercase">
						当前会话
					</p>
					<p class="mt-1 truncate text-sm font-semibold text-slate-900">{username}</p>
				</div>
				<Badge variant="outline" class="rounded-full border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
					内部
				</Badge>
			</div>
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
