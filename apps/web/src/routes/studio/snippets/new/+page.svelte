<script lang="ts">
	import { goto } from '$app/navigation';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { createAdminSnippet } from '$lib/studio/api';
	import type { AdminCreateSnippetRequest } from '$lib/studio/types';

	let payload = $state<AdminCreateSnippetRequest>({
		id: '',
		title: '',
		summary: '',
		categoryPrimary: 'layout',
		difficulty: 'easy',
		version: '1.0.0'
	});
	let pending = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		pending = true;
		try {
			const created = await createAdminSnippet(fetch, payload);
			await goto(`/studio/snippets/${created.id}`);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : '新建失败';
		} finally {
			pending = false;
		}
	}
</script>

<svelte:head>
	<title>新建内容 | Studio</title>
</svelte:head>

<main class="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
	<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
		<Card.Header class="gap-4 p-6 md:p-7">
			<Badge variant="outline" class="w-fit rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
				Create Snippet
			</Badge>
			<div class="space-y-3">
				<Card.Title
					class="text-[2.2rem] tracking-[-0.05em] text-slate-950"
					style="font-family: var(--font-display)"
				>
					先把骨架生成出来，再进入完整编辑。
				</Card.Title>
				<Card.Description class="max-w-2xl text-sm leading-7 text-slate-600">
					v1 还是文件协议优先。这里先把 slug、标题和基础元信息收干净，然后生成
					`content/snippets/&lt;id&gt;/` 的标准目录。
				</Card.Description>
			</div>
		</Card.Header>

		<Card.Content class="grid gap-4 px-6 pb-6 md:grid-cols-3">
			<div class="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-xs">
				<p class="text-sm font-semibold tracking-[-0.02em] text-slate-900">Slug 先想清楚</p>
				<p class="mt-2 text-sm leading-6 text-slate-500">它会成为目录名和公开 id，后面尽量不要改。</p>
			</div>
			<div class="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-xs">
				<p class="text-sm font-semibold tracking-[-0.02em] text-slate-900">标题先写用户语言</p>
				<p class="mt-2 text-sm leading-6 text-slate-500">列表页和公开站都直接读它，尽量别写工程内部描述。</p>
			</div>
			<div class="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-xs">
				<p class="text-sm font-semibold tracking-[-0.02em] text-slate-900">摘要只写一句</p>
				<p class="mt-2 text-sm leading-6 text-slate-500">先建立识别度，细节留到编辑页再补。</p>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
		<Card.Header class="gap-3 p-6">
			<Badge variant="outline" class="w-fit rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
				Base Metadata
			</Badge>
			<Card.Title
				class="text-[1.9rem] tracking-[-0.05em] text-slate-950"
				style="font-family: var(--font-display)"
			>
				新建骨架
			</Card.Title>
			<Card.Description class="text-sm leading-6 text-slate-600">
				提交后会直接跳到编辑页，继续补代码、Prompt、媒体和发布信息。
			</Card.Description>
		</Card.Header>

		<Card.Content class="px-6 pb-6">
			<form class="grid gap-5" onsubmit={handleSubmit}>
				<label class="grid gap-2">
					<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">
						Slug
					</span>
					<Input
						bind:value={payload.id}
						required
						placeholder="例如：floating-toolbar"
						class="h-11 rounded-2xl border-slate-200 bg-white shadow-none"
					/>
				</label>

				<label class="grid gap-2">
					<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">
						标题
					</span>
					<Input
						bind:value={payload.title}
						required
						placeholder="例如：浮动工具栏"
						class="h-11 rounded-2xl border-slate-200 bg-white shadow-none"
					/>
				</label>

				<label class="grid gap-2">
					<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">
						摘要
					</span>
					<Textarea
						bind:value={payload.summary}
						rows={5}
						placeholder="一句话说明这个 snippet 的核心价值。"
						class="min-h-28 rounded-[24px] border-slate-200 bg-white shadow-none"
					/>
				</label>

				<div class="grid gap-4 md:grid-cols-3">
					<label class="grid gap-2">
						<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">
							分类
						</span>
						<Input bind:value={payload.categoryPrimary} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" />
					</label>
					<label class="grid gap-2">
						<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">
							难度
						</span>
						<Input bind:value={payload.difficulty} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" />
					</label>
					<label class="grid gap-2">
						<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">
							版本
						</span>
						<Input bind:value={payload.version} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" />
					</label>
				</div>

				{#if errorMessage}
					<Alert variant="destructive" class="rounded-[24px] border-rose-200 bg-rose-50/90 text-rose-700 shadow-none">
						<AlertTitle>创建失败</AlertTitle>
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				{/if}

				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p class="text-sm leading-6 text-slate-500">
						创建后会立即生成标准目录骨架，并跳转到编辑页。
					</p>
					<Button type="submit" disabled={pending} class="h-11 rounded-2xl px-5 shadow-none">
						{pending ? '创建中...' : '创建并进入编辑页'}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</main>
