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

<main class="mx-auto grid w-full max-w-[680px] gap-5">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl font-semibold tracking-tight">新建内容</Card.Title>
		</Card.Header>
		<Card.Content>
			<form class="grid gap-5" onsubmit={handleSubmit}>
				<label class="grid gap-2">
					<span class="text-sm font-medium text-muted-foreground">内容 ID</span>
					<Input
						bind:value={payload.id}
						required
						placeholder="例如：floating-toolbar"
					/>
				</label>

				<label class="grid gap-2">
					<span class="text-sm font-medium text-muted-foreground">标题</span>
					<Input
						bind:value={payload.title}
						required
						placeholder="例如：浮动工具栏"
					/>
				</label>

				<label class="grid gap-2">
					<span class="text-sm font-medium text-muted-foreground">摘要</span>
					<Textarea
						bind:value={payload.summary}
						rows={5}
						placeholder="例如：适合做首屏强调区的浮动工具栏。"
						class="min-h-28"
					/>
				</label>

				<div class="grid gap-4 md:grid-cols-3">
					<label class="grid gap-2">
						<span class="text-sm font-medium text-muted-foreground">分类</span>
						<Input bind:value={payload.categoryPrimary} />
					</label>
					<label class="grid gap-2">
						<span class="text-sm font-medium text-muted-foreground">难度</span>
						<Input bind:value={payload.difficulty} />
					</label>
					<label class="grid gap-2">
						<span class="text-sm font-medium text-muted-foreground">版本</span>
						<Input bind:value={payload.version} />
					</label>
				</div>

				{#if errorMessage}
					<Alert variant="destructive">
						<AlertTitle>创建失败</AlertTitle>
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				{/if}

				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<Button type="submit" disabled={pending} size="lg">
						{pending ? '创建中...' : '创建内容'}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</main>
