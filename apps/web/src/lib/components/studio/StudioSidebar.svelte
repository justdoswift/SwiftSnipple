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
	<Sidebar.Header class="border-sidebar-border/70 bg-sidebar/90 border-b px-3 py-3.5">
		<div class="flex items-start gap-3 px-1">
			<div class="surface-interactive text-primary flex size-9 items-center justify-center rounded-[var(--radius-control)]">
				<SparklesIcon class="size-4" />
			</div>
			<div class="min-w-0 group-data-[collapsible=icon]:hidden">
				<p class="text-[0.7rem] font-semibold tracking-[0.1em] text-foreground/46 uppercase">
					SwiftSnippet
				</p>
				<h2 class="mt-1 text-sm font-medium text-foreground/82">Studio</h2>
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="px-2 py-3.5">
		<Sidebar.Group>
			<Sidebar.GroupLabel class="px-2 text-[0.68rem] font-semibold tracking-[0.1em] text-foreground/42 uppercase">
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
			<Sidebar.GroupLabel class="px-2 text-[0.68rem] font-semibold tracking-[0.1em] text-foreground/42 uppercase">
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

	<Sidebar.Footer class="border-sidebar-border/72 border-t px-3 py-3">
		<div class="surface-interactive group-data-[collapsible=icon]:hidden rounded-[var(--radius-control)] px-3 py-3">
			<div class="flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-[0.68rem] font-semibold tracking-[0.1em] text-foreground/46 uppercase">
						当前会话
					</p>
					<p class="mt-1 truncate text-sm font-medium text-foreground/82">{username}</p>
				</div>
				<Badge variant="secondary">
					内部
				</Badge>
			</div>
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
