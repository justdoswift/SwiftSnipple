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

<main class="grid gap-5">
	<section class="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
		<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
			<Card.Header class="gap-5 p-6 md:p-7">
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div class="max-w-3xl space-y-3">
						<Badge variant="outline" class="rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
							Studio Dashboard
						</Badge>
						<Card.Title
							class="text-3xl leading-none tracking-[-0.05em] text-slate-950 md:text-[2.35rem]"
							style="font-family: var(--font-display)"
						>
							把录入、校验和发布收成一条更安静的后台工作流。
						</Card.Title>
						<Card.Description class="max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
							这里不讲公开站的品牌故事，只服务内部运营动作。先把元信息和媒体补齐，再做
							Review，最后推到公开站。
						</Card.Description>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<Button href="/studio/snippets/new" class="rounded-2xl shadow-none">
							新建内容
						</Button>
						<Button
							href="/studio/snippets"
							variant="outline"
							class="rounded-2xl border-slate-200 bg-white/80 shadow-none"
						>
							进入内容管理
						</Button>
					</div>
				</div>
			</Card.Header>

			<Card.Content class="grid gap-4 px-6 pb-6 md:grid-cols-3 md:px-7 md:pb-7">
				{#each stats as stat (stat.label)}
					<div class="rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-4 shadow-xs">
						<div class="flex items-center justify-between gap-3">
							<p class="text-sm font-medium text-slate-500">{stat.label}</p>
							<div class="flex size-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
								<stat.icon class="size-4" />
							</div>
						</div>
						<p
							class="mt-4 text-[2.2rem] leading-none tracking-[-0.06em] text-slate-950"
							style="font-family: var(--font-display)"
						>
							{stat.value}
						</p>
						<p class="mt-2 text-sm leading-6 text-slate-500">{stat.copy}</p>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>

		<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
			<Card.Header class="gap-3 p-6">
				<Badge variant="outline" class="rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
					当前节奏
				</Badge>
				<Card.Title
					class="text-2xl tracking-[-0.04em] text-slate-950"
					style="font-family: var(--font-display)"
				>
					先补信息，再跑发布动作。
				</Card.Title>
				<Card.Description class="text-sm leading-6 text-slate-600">
					让编辑页专注于内容本身，而不是在很多表单 chrome 上分散注意力。
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4 px-6 pb-6">
				<div class="rounded-[24px] border border-slate-200/80 bg-white/88 p-4">
					<p class="text-[0.72rem] font-semibold tracking-[0.16em] text-slate-400 uppercase">
						推荐顺序
					</p>
					<ol class="mt-3 space-y-2 text-sm leading-6 text-slate-600">
						<li>1. 先补齐标题、摘要、平台和标签。</li>
						<li>2. 再上传 Cover / Demo，让详情页可预览。</li>
						<li>3. 最后运行校验，再送去 Review 和 Publish。</li>
					</ol>
				</div>

				<div class="flex flex-wrap gap-2">
					<Badge class="rounded-full bg-slate-900 px-2.5 py-1 text-white">草稿可继续编辑</Badge>
					<Badge variant="secondary" class="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
						待评审适合复查
					</Badge>
					<Badge variant="secondary" class="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
						已发布同步公开站
					</Badge>
				</div>
			</Card.Content>
		</Card.Root>
	</section>

	<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
		<Card.Header class="gap-4 p-6 md:flex-row md:items-end md:justify-between">
			<div class="space-y-3">
				<Badge variant="outline" class="rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
					Recent Snippets
				</Badge>
				<div>
					<Card.Title
						class="text-[1.9rem] tracking-[-0.04em] text-slate-950"
						style="font-family: var(--font-display)"
					>
						从最近的内容继续往前推。
					</Card.Title>
					<Card.Description class="mt-2 text-sm leading-6 text-slate-600">
						最近改过的条目放在前面，继续补信息或直接进入发布动作。
					</Card.Description>
				</div>
			</div>
			<Button href="/studio/snippets" variant="outline" class="rounded-2xl border-slate-200 bg-white/80 shadow-none">
				查看全部
			</Button>
		</Card.Header>

		<Card.Content class="px-6 pb-6">
			<div class="divide-y divide-slate-200/80 rounded-[24px] border border-slate-200/80 bg-white/88">
				{#each recentItems as item (item.id)}
					<a
						class="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50/80 md:flex-row md:items-center md:justify-between"
						href={`/studio/snippets/${item.id}`}
					>
						<div class="min-w-0">
							<p class="truncate text-[15px] font-semibold tracking-[-0.02em] text-slate-950">
								{item.title}
							</p>
							<p class="mt-1 text-sm text-slate-500">{item.id} · 版本 {item.version}</p>
						</div>
						<div class="flex flex-wrap items-center gap-2 md:justify-end">
							<Badge variant="outline" class={`rounded-full px-2.5 py-1 ${stateClass(item.state)}`}>
								{stateLabel(item.state)}
							</Badge>
							<Badge variant="outline" class="rounded-full border-slate-200 bg-white px-2.5 py-1 text-slate-600">
								{item.hasCover ? '有封面' : '缺封面'}
							</Badge>
							<span class="inline-flex items-center gap-1 text-sm text-slate-500">
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
