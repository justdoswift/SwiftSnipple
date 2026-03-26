<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
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

	function formatUpdatedAt(value: string) {
		return new Date(value).toLocaleString('zh-CN', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>Studio Snippets | SwiftSnippet</title>
</svelte:head>

<main class="grid gap-4">
	<section class="surface-panel snippets-toolbar-panel">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div class="grid gap-2">
				<p class="ui-label">内容管理</p>
				<div class="grid gap-1">
					<h2 class="text-[1.18rem] font-semibold tracking-tight text-foreground">
						共 {filteredItems.length} 条内容
					</h2>
					<p class="max-w-xl text-sm leading-6 text-foreground/68">
						搜索标题或内容 ID，再按状态快速切换，优先处理待评审和草稿。
					</p>
				</div>
			</div>

			<div class="hidden flex-wrap gap-2 lg:flex">
				{#each filters.slice(1) as filter (filter.label)}
					<span class="glass-pill inline-flex items-center gap-2 px-3 py-2 text-xs text-foreground/72">
						<strong class="font-(family-name:--font-display) text-sm font-semibold text-foreground">
							{filter.count}
						</strong>
						<span>{filter.label}</span>
					</span>
				{/each}
			</div>
		</div>

		<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
			<div class="w-full max-w-[28rem]">
				<Input
					bind:value={query}
					type="search"
					placeholder="搜索标题或内容 ID"
					class="h-11"
				/>
			</div>

			<div class="surface-interactive snippets-filter-rail">
				{#each filters as filter (filter.label)}
					<Button
						type="button"
						variant={stateFilter === filter.value ? 'secondary' : 'ghost'}
						size="sm"
						class={`rounded-full px-3.5 ${stateFilter === filter.value ? 'text-foreground' : 'text-foreground/62'}`}
						aria-pressed={stateFilter === filter.value}
						onclick={() => {
							stateFilter = filter.value;
						}}
					>
						{filter.label}
						<span class="text-[0.72rem] font-semibold opacity-70">{filter.count}</span>
					</Button>
				{/each}
			</div>
		</div>
	</section>

	<section class="surface-panel overflow-hidden p-0">
		{#if filteredItems.length === 0}
			<div class="grid gap-2 px-6 py-10">
				<p class="ui-label">没有结果</p>
				<p class="max-w-xl text-sm leading-6 text-foreground/68">
					没有找到相关内容。换个关键词试试，或者直接新建内容。
				</p>
			</div>
		{:else}
			<div class="snippets-table-shell border border-border/72 bg-white/46">
				<Table>
					<TableHeader class="bg-white/66">
						<TableRow class="hover:bg-transparent hover:[box-shadow:none]">
							<TableHead>
								内容
							</TableHead>
							<TableHead>
								状态
							</TableHead>
							<TableHead>
								资产
							</TableHead>
							<TableHead class="text-right">
								更新时间
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filteredItems as item (item.id)}
							<TableRow class="group">
								<TableCell>
									<a class="block min-w-0 space-y-1.5" href={`/studio/snippets/${item.id}`}>
										<p class="truncate text-[0.95rem] font-semibold leading-6 text-foreground">
											{item.title}
										</p>
										<p class="flex flex-wrap gap-x-2 gap-y-1 text-[0.82rem] leading-5 text-foreground/58">
											<span>{item.id}</span>
											<span>版本 {item.version}</span>
										</p>
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
								<TableCell class="text-right align-middle">
									<span class="text-[0.82rem] leading-5 text-foreground/56">
										{formatUpdatedAt(item.updatedAt)}
									</span>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</section>
</main>
