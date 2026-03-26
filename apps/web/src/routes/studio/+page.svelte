<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import Layers3Icon from '@lucide/svelte/icons/layers-3';

	let { data } = $props();

	const draftCount = $derived(data.items.filter((item) => item.state === 'draft').length);
	const reviewCount = $derived(data.items.filter((item) => item.state === 'review').length);
	const publishedCount = $derived(data.items.filter((item) => item.state === 'published').length);
	const recentItems = $derived(data.items.slice(0, 5));
	const homeHeadline = $derived(
		draftCount > 0
			? `先处理 ${draftCount} 条草稿`
			: reviewCount > 0
				? `还有 ${reviewCount} 条待评审`
				: '内容都已处理完'
	);

	const nextTasks = $derived.by(() => {
		const priorities = data.items
			.filter((item) => item.state === 'review' || item.state === 'draft')
			.slice(0, 3)
			.map((item) => ({
				label: item.title,
				href: `/studio/snippets/${item.id}`,
				state: stateLabel(item.state)
			}));

		const tasks: { label: string; href: string; state: string }[] = [...priorities];
		if (tasks.length === 0 && recentItems.length > 0) {
			tasks.push({
				label: recentItems[0].title,
				href: `/studio/snippets/${recentItems[0].id}`,
				state: '最近更新'
			});
		}
		return tasks;
	});

	function stateLabel(state: string) {
		if (state === 'published') return '已发布';
		if (state === 'review') return '待评审';
		return '草稿';
	}

	function stateClass(state: string) {
		if (state === 'published') return 'default';
		if (state === 'review') return 'secondary';
		return 'outline';
	}

	const stats = $derived([
		{
			label: '草稿',
			value: draftCount,
			copy: '还在补信息与媒体',
			icon: CircleDotIcon
		},
		{
			label: '待评审',
			value: reviewCount,
			copy: '适合集中复查',
			icon: Layers3Icon
		},
		{
			label: '已发布',
			value: publishedCount,
			copy: '已同步公开站',
			icon: CheckCheckIcon
		}
	]);
</script>

<svelte:head>
	<title>Studio | SwiftSnippet</title>
</svelte:head>

<main class="grid gap-6">
	<section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
		<Card.Root class="surface-card">
			<Card.Header class="gap-5">
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div class="max-w-xl space-y-2">
						<Card.Title class="max-w-[11ch] text-3xl font-semibold leading-tight tracking-tight">
							{homeHeadline}
						</Card.Title>
					</div>

				</div>
			</Card.Header>

			<Card.Content class="grid gap-4 md:grid-cols-3">
				{#each stats as stat (stat.label)}
					<Card.Root size="sm" class="surface-muted">
						<Card.Content class="flex items-start justify-between gap-3">
							<p class="text-sm font-medium text-muted-foreground">{stat.label}</p>
							<div class="bg-background/72 text-muted-foreground flex size-8 items-center justify-center rounded-[calc(var(--radius)-3px)]">
								<stat.icon class="size-4" />
							</div>
						</Card.Content>
						<Card.Content class="pt-0">
							<p class="text-3xl font-semibold tracking-tight text-foreground">
								{stat.value}
							</p>
							<p class="mt-2 text-sm leading-6 text-muted-foreground">{stat.copy}</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</Card.Content>
		</Card.Root>

		<Card.Root class="surface-card">
			<Card.Header>
				<Card.Title class="text-lg font-semibold tracking-tight">待处理</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#each nextTasks as task (task.label)}
					<a
						href={task.href}
					class="surface-muted flex items-center justify-between gap-3 rounded-[calc(var(--radius)-1px)] px-4 py-3 text-sm transition-[background-color,transform] duration-[var(--motion-fast)] hover:bg-muted/92 hover:-translate-y-px"
					>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-foreground">{task.label}</p>
							<p class="mt-1 text-xs text-muted-foreground">{task.state}</p>
						</div>
						<ArrowRightIcon class="text-muted-foreground size-4 shrink-0" />
					</a>
				{/each}
			</Card.Content>
		</Card.Root>
	</section>

	<Card.Root class="surface-card">
		<Card.Header class="gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<Card.Title class="text-lg font-semibold tracking-tight">最近更新</Card.Title>
			</div>
		</Card.Header>

		<Card.Content>
			<div class="overflow-hidden rounded-[calc(var(--radius)+0.1rem)] border border-border/70 bg-card/72">
				{#each recentItems as item (item.id)}
					<a
						class="group flex flex-col gap-3 px-4 py-4 transition-[background-color] duration-[var(--motion-fast)] hover:bg-muted/72 md:flex-row md:items-center md:justify-between"
						href={`/studio/snippets/${item.id}`}
					>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-foreground">
								{item.title}
							</p>
							<p class="mt-1 text-sm text-muted-foreground">{item.id} · 版本 {item.version}</p>
						</div>
						<div class="flex flex-wrap items-center gap-2 md:justify-end">
							<Badge variant={stateClass(item.state)}>
								{stateLabel(item.state)}
							</Badge>
							<Badge variant="outline">
								{item.hasCover ? '有封面' : '缺封面'}
							</Badge>
							<span class="text-muted-foreground inline-flex items-center gap-1 text-sm">
								继续编辑
								<ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
							</span>
						</div>
					</a>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</main>
