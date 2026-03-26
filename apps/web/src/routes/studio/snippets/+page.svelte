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
		if (state === 'published') {
			return 'border-emerald-200 bg-emerald-50 text-emerald-700';
		}
		if (state === 'review') {
			return 'border-amber-200 bg-amber-50 text-amber-700';
		}
		return 'border-slate-200 bg-slate-50 text-slate-600';
	}
</script>

<svelte:head>
	<title>Studio Snippets | SwiftSnippet</title>
</svelte:head>

<main class="grid gap-5">
	<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
		<Card.Header class="gap-4 p-6 md:flex-row md:items-end md:justify-between">
			<div class="space-y-3">
				<Badge variant="outline" class="rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
					Snippet Library
				</Badge>
				<div>
					<Card.Title
						class="text-[2rem] tracking-[-0.05em] text-slate-950"
						style="font-family: var(--font-display)"
					>
						内容管理
					</Card.Title>
					<Card.Description class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
						把搜索和筛选收成一层轻工具条，主区域只做扫描、筛选和进入编辑。
					</Card.Description>
				</div>
			</div>
			<Button href="/studio/snippets/new" class="rounded-2xl shadow-none">新建内容</Button>
		</Card.Header>

		<Card.Content class="space-y-4 px-6 pb-6">
			<div class="liquid-glass rounded-[26px] px-4 py-4">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div class="w-full max-w-xl">
						<Input
							bind:value={query}
							type="search"
							placeholder="搜索标题或 slug"
							class="h-11 rounded-2xl border-white/75 bg-white/88 shadow-none"
						/>
					</div>

					<div class="flex flex-wrap gap-2">
						{#each filters as filter (filter.label)}
							<Button
								type="button"
								variant={stateFilter === filter.value ? 'default' : 'outline'}
								class={`rounded-2xl shadow-none ${
									stateFilter === filter.value
										? ''
										: 'border-white/75 bg-white/78 text-slate-600 hover:bg-white'
								}`}
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

	<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
		<Card.Header class="gap-3 p-6 md:flex-row md:items-end md:justify-between">
			<div>
				<Card.Title
					class="text-[1.7rem] tracking-[-0.04em] text-slate-950"
					style="font-family: var(--font-display)"
				>
					结果列表
				</Card.Title>
				<Card.Description class="mt-2 text-sm leading-6 text-slate-600">
					当前共 {filteredItems.length} 条结果，点击任意标题进入编辑与发布面板。
				</Card.Description>
			</div>
		</Card.Header>

		<Card.Content class="px-6 pb-6">
			{#if filteredItems.length === 0}
				<div class="rounded-[26px] border border-dashed border-slate-300 bg-white/80 px-5 py-6 text-sm leading-6 text-slate-500">
					没有匹配结果。先清掉筛选，或者直接新建一条内容骨架再进入编辑。
				</div>
			{:else}
				<div class="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/88">
					<Table>
						<TableHeader>
							<TableRow class="border-slate-200/80 bg-slate-50/80 hover:bg-slate-50/80">
								<TableHead class="h-12 px-4 text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">
									内容
								</TableHead>
								<TableHead class="text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">
									状态
								</TableHead>
								<TableHead class="text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">
									资产
								</TableHead>
								<TableHead class="text-right text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">
									更新时间
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredItems as item (item.id)}
								<TableRow class="border-slate-200/80">
									<TableCell class="px-4 py-4 align-middle">
										<a class="block min-w-0" href={`/studio/snippets/${item.id}`}>
											<p class="truncate text-[15px] font-semibold tracking-[-0.02em] text-slate-950">
												{item.title}
											</p>
											<p class="mt-1 text-sm text-slate-500">{item.id} · 版本 {item.version}</p>
										</a>
									</TableCell>
									<TableCell class="align-middle">
										<Badge variant="outline" class={`rounded-full px-2.5 py-1 ${stateClass(item.state)}`}>
											{stateLabel(item.state)}
										</Badge>
									</TableCell>
									<TableCell class="align-middle">
										<div class="flex flex-wrap gap-2">
											<Badge variant="outline" class="rounded-full border-slate-200 bg-white px-2.5 py-1 text-slate-600">
												{item.hasCover ? 'cover' : '缺封面'}
											</Badge>
											{#if item.hasDemo}
												<Badge variant="outline" class="rounded-full border-slate-200 bg-white px-2.5 py-1 text-slate-600">
													demo
												</Badge>
											{/if}
										</div>
									</TableCell>
									<TableCell class="text-right align-middle text-sm text-slate-500">
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
