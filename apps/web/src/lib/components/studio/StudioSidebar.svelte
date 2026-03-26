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
			icon: LayoutDashboardIcon
		},
		{
			href: '/studio/snippets',
			label: '内容管理',
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
	<Sidebar.Header class="border-sidebar-border bg-sidebar border-b px-3 py-3">
		<div class="flex items-start gap-3 px-1">
			<div class="surface-muted text-primary flex size-9 items-center justify-center rounded-[calc(var(--radius)-1px)]">
				<SparklesIcon class="size-4" />
			</div>
			<div class="min-w-0 group-data-[collapsible=icon]:hidden">
				<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
					SwiftSnippet
				</p>
				<h2 class="mt-1 text-sm font-medium text-foreground">Studio</h2>
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="px-2 py-3">
		<Sidebar.Group>
			<Sidebar.GroupLabel class="px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
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
										class={`${String(props.class ?? '')} px-3`}
									>
										<item.icon class="size-4" />
										<span>{item.label}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Group class="mt-5">
			<Sidebar.GroupLabel class="px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
				快捷入口
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent class="px-2 pt-2">
				<Button
					href="/studio/snippets/new"
					size="sm"
					class="w-full justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
				>
					<PlusIcon class="size-4" />
					<span class="group-data-[collapsible=icon]:hidden">新建内容</span>
				</Button>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer class="border-sidebar-border border-t px-3 py-3">
		<div class="surface-muted group-data-[collapsible=icon]:hidden rounded-[calc(var(--radius)-1px)] px-3 py-3">
			<div class="flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
						当前会话
					</p>
					<p class="mt-1 truncate text-sm font-medium text-foreground">{username}</p>
				</div>
				<Badge variant="outline">
					内部
				</Badge>
			</div>
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
