<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';

	let { data } = $props();

	let query = $state('');
	let stateFilter = $state('');

	const filteredItems = $derived(
		data.items.filter((item) => {
			const keyword = query.trim().toLowerCase();
			const matchesQuery =
				keyword === '' ||
				item.title.toLowerCase().includes(keyword) ||
				item.id.toLowerCase().includes(keyword);
			const matchesState = stateFilter === '' || item.state === stateFilter;
			return matchesQuery && matchesState;
		})
	);

	const filters = $derived([
		{ value: '', label: '全部', count: data.items.length },
		{
			value: 'draft',
			label: '草稿',
			count: data.items.filter((item) => item.state === 'draft').length
		},
		{
			value: 'review',
			label: '待评审',
			count: data.items.filter((item) => item.state === 'review').length
		},
		{
			value: 'published',
			label: '已发布',
			count: data.items.filter((item) => item.state === 'published').length
		}
	]);

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
</script>

<svelte:head>
	<title>Studio Snippets | SwiftSnippet</title>
</svelte:head>

<main class="grid gap-5">
	<Card.Root>
		<Card.Content class="space-y-4">
			<div class="bg-muted/60 rounded-lg border px-4 py-4">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div class="w-full max-w-xl">
						<Input
							bind:value={query}
							type="search"
							placeholder="搜索标题或内容 ID"
						/>
					</div>

					<div class="flex flex-wrap gap-2">
						{#each filters as filter (filter.label)}
							<Button
								type="button"
								variant={stateFilter === filter.value ? 'default' : 'outline'}
								size="sm"
								onclick={() => {
									stateFilter = filter.value;
								}}
							>
								{filter.label}
								<span class="text-xs opacity-70">{filter.count}</span>
							</Button>
						{/each}
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="gap-3 md:flex-row md:items-end md:justify-between">
			<div>
				<Card.Title class="text-lg font-semibold tracking-tight">共 {filteredItems.length} 条内容</Card.Title>
			</div>
		</Card.Header>

		<Card.Content>
			{#if filteredItems.length === 0}
				<div class="text-muted-foreground rounded-lg border border-dashed px-5 py-6 text-sm leading-6">
					没有找到相关内容。换个关键词试试，或者直接新建内容。
				</div>
			{:else}
				<div class="overflow-hidden rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="px-4 text-xs font-medium uppercase text-muted-foreground">
									内容
								</TableHead>
								<TableHead class="text-xs font-medium uppercase text-muted-foreground">
									状态
								</TableHead>
								<TableHead class="text-xs font-medium uppercase text-muted-foreground">
									资产
								</TableHead>
								<TableHead class="text-right text-xs font-medium uppercase text-muted-foreground">
									更新时间
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredItems as item (item.id)}
								<TableRow>
									<TableCell class="px-4 py-4 align-middle">
										<a class="block min-w-0" href={`/studio/snippets/${item.id}`}>
											<p class="truncate text-sm font-medium text-foreground">
												{item.title}
											</p>
											<p class="mt-1 text-sm text-muted-foreground">{item.id} · 版本 {item.version}</p>
										</a>
									</TableCell>
									<TableCell class="align-middle">
										<Badge variant={stateClass(item.state)}>
											{stateLabel(item.state)}
										</Badge>
									</TableCell>
									<TableCell class="align-middle">
										<div class="flex flex-wrap gap-2">
											<Badge variant="outline">
												{item.hasCover ? '有封面' : '缺封面'}
											</Badge>
											{#if item.hasDemo}
												<Badge variant="outline">
													有演示
												</Badge>
											{/if}
										</div>
									</TableCell>
									<TableCell class="text-right align-middle text-sm text-muted-foreground">
										{new Date(item.updatedAt).toLocaleString('zh-CN')}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</main>
