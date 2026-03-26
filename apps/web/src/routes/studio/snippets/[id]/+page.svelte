<script lang="ts">
	import { goto } from '$app/navigation';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		moveSnippetToReview,
		normalizeAdminSnippetEditorPayload,
		publishSnippetVersion,
		saveAdminSnippet,
		uploadAdminAsset,
		validateAdminSnippet
	} from '$lib/studio/api';
	import type { AdminSnippetEditorPayload, AdminValidationResponse } from '$lib/studio/types';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import FileCode2Icon from '@lucide/svelte/icons/file-code-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	let { data } = $props();

	const cloneEditor = () =>
		structuredClone(normalizeAdminSnippetEditorPayload(data.editor)) as AdminSnippetEditorPayload;

	let editor = $state<AdminSnippetEditorPayload>(cloneEditor());
	let tagsText = $state(cloneEditor().tags.join(', '));
	let validation = $state<AdminValidationResponse | null>(null);
	let saveMessage = $state('');
	let saveTone = $state<'success' | 'error'>('success');
	let pendingSave = $state(false);
	let pendingValidate = $state(false);
	let pendingReview = $state(false);
	let pendingPublish = $state(false);
	let dirty = $state(false);
	let activeTab = $state('meta');

	const statusLabel = $derived(
		editor.state === 'published' ? '已发布' : editor.state === 'review' ? '待评审' : '草稿'
	);

	const statusClass = $derived(
		editor.state === 'published'
			? 'border-emerald-200 bg-emerald-50 text-emerald-700'
			: editor.state === 'review'
				? 'border-amber-200 bg-amber-50 text-amber-700'
				: 'border-slate-200 bg-slate-50 text-slate-600'
	);

	$effect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			if (!dirty) return;
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	function touch() {
		dirty = true;
		saveMessage = '';
	}

	function syncTags() {
		editor.tags = tagsText
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
		touch();
	}

	function updatePlatform(index: number, key: 'os' | 'minVersion', value: string) {
		editor.platforms[index][key] = value;
		touch();
	}

	function updateFile(files: 'codeFiles' | 'promptFiles', index: number, value: string) {
		editor[files][index].content = value;
		touch();
	}

	function addPlatform() {
		editor.platforms = [...editor.platforms, { os: '', minVersion: '' }];
		touch();
	}

	async function handleSave() {
		pendingSave = true;
		saveMessage = '';
		try {
			editor.tags = tagsText
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean);
			editor = await saveAdminSnippet(fetch, editor.id, editor);
			tagsText = editor.tags.join(', ');
			saveTone = 'success';
			saveMessage = '已保存草稿';
			dirty = false;
		} catch (error) {
			saveTone = 'error';
			saveMessage = error instanceof Error ? error.message : '保存失败';
		} finally {
			pendingSave = false;
		}
	}

	async function handleValidate() {
		pendingValidate = true;
		try {
			validation = await validateAdminSnippet(fetch, editor.id);
		} finally {
			pendingValidate = false;
		}
	}

	async function handleReview() {
		pendingReview = true;
		try {
			await moveSnippetToReview(fetch, editor.id);
			await goto(`/studio/snippets/${editor.id}`, { invalidateAll: true });
		} finally {
			pendingReview = false;
		}
	}

	async function handlePublish() {
		pendingPublish = true;
		try {
			await publishSnippetVersion(fetch, editor.id, editor.version);
			await goto(`/studio/snippets/${editor.id}`, { invalidateAll: true });
		} finally {
			pendingPublish = false;
		}
	}

	async function handleAssetUpload(kind: 'cover' | 'demo', event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		await uploadAdminAsset(fetch, editor.id, kind, file);
		await goto(`/studio/snippets/${editor.id}`, { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{editor.title} | Studio</title>
</svelte:head>

<main class="grid gap-5">
	<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
		<Card.Header class="gap-5 p-6 md:flex-row md:items-start md:justify-between">
			<div class="space-y-3">
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant="outline" class={`rounded-full px-2.5 py-1 ${statusClass}`}>
						{statusLabel}
					</Badge>
					<Badge variant="outline" class="rounded-full border-slate-200 bg-white px-2.5 py-1 text-slate-600">
						{editor.id}
					</Badge>
				</div>
				<div>
					<h2
						class="text-[2.25rem] tracking-[-0.05em] text-slate-950"
						style="font-family: var(--font-display)"
					>
						{editor.title}
					</h2>
					<Card.Description class="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
						{editor.summary || '这条内容还没有摘要，建议先补一句面向用户的说明。'}
					</Card.Description>
				</div>
			</div>

			<div class="flex flex-col items-stretch gap-3 md:min-w-[320px]">
				<div class="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						class="rounded-2xl border-slate-200 bg-white/80 shadow-none"
						onclick={handleValidate}
						disabled={pendingValidate}
					>
						{pendingValidate ? '校验中...' : '运行校验'}
					</Button>
					<Button type="button" class="rounded-2xl shadow-none" onclick={handleSave} disabled={pendingSave}>
						{pendingSave ? '保存中...' : '保存草稿'}
					</Button>
				</div>
				<p class="text-sm leading-6 text-slate-500">
					当前版本 {editor.version} · {dirty ? '你有未保存修改' : '当前内容已同步到工作区文件'}
				</p>
			</div>
		</Card.Header>
	</Card.Root>

	<div class="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.82fr)]">
		<div class="grid gap-5">
			<Tabs.Root bind:value={activeTab} class="gap-4">
				<Tabs.List
					variant="line"
					class="liquid-glass rounded-[24px] px-2 py-2 text-slate-600"
				>
					<Tabs.Trigger value="meta" class="rounded-2xl px-4">基本信息</Tabs.Trigger>
					<Tabs.Trigger value="code" class="rounded-2xl px-4">源码</Tabs.Trigger>
					<Tabs.Trigger value="prompt" class="rounded-2xl px-4">Prompt / 许可</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="meta">
					<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
						<Card.Header class="gap-3 p-6">
							<Badge variant="outline" class="w-fit rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
								Metadata
							</Badge>
							<Card.Title
								class="text-[1.85rem] tracking-[-0.05em] text-slate-950"
								style="font-family: var(--font-display)"
							>
								基本信息
							</Card.Title>
						</Card.Header>
						<Card.Content class="grid gap-5 px-6 pb-6">
							<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
								<label class="grid gap-2 md:col-span-2 xl:col-span-1">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">标题</span>
									<Input bind:value={editor.title} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={touch} />
								</label>
								<label class="grid gap-2">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">Slug</span>
									<Input bind:value={editor.id} disabled class="h-11 rounded-2xl border-slate-200 bg-slate-50 text-slate-500 shadow-none" />
								</label>
								<label class="grid gap-2">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">分类</span>
									<Input bind:value={editor.categoryPrimary} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={touch} />
								</label>
								<label class="grid gap-2">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">难度</span>
									<Input bind:value={editor.difficulty} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={touch} />
								</label>
								<label class="grid gap-2">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">版本</span>
									<Input bind:value={editor.version} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={touch} />
								</label>
								<label class="grid gap-2">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">Source revision</span>
									<Input bind:value={editor.sourceRevision} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={touch} />
								</label>
							</div>

							<label class="grid gap-2">
								<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">摘要</span>
								<Textarea bind:value={editor.summary} rows={4} class="min-h-28 rounded-[24px] border-slate-200 bg-white shadow-none" oninput={touch} />
							</label>

							<label class="grid gap-2">
								<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">
									标签（逗号分隔）
								</span>
								<Input bind:value={tagsText} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={syncTags} />
							</label>

							<div class="rounded-[26px] border border-slate-200/80 bg-white/88 p-4">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p class="text-sm font-semibold text-slate-900">Platforms</p>
										<p class="mt-1 text-sm leading-6 text-slate-500">
											只保留真实需要的运行边界，减少表单噪音。
										</p>
									</div>
									<Button
										type="button"
										variant="outline"
										class="rounded-2xl border-slate-200 bg-white shadow-none"
										onclick={addPlatform}
									>
										新增平台
									</Button>
								</div>

								<div class="mt-4 grid gap-4">
									{#if editor.platforms.length === 0}
										<div class="rounded-[20px] border border-dashed border-slate-300 bg-slate-50/70 px-4 py-4 text-sm text-slate-500">
											当前还没有平台边界，建议至少补一条系统和最低版本。
										</div>
									{:else}
										{#each editor.platforms as platform, index (`${index}-${platform.os}`)}
											<div class="grid gap-4 md:grid-cols-2">
												<label class="grid gap-2">
													<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">OS</span>
													<Input
														value={platform.os}
														class="h-11 rounded-2xl border-slate-200 bg-white shadow-none"
														oninput={(event) =>
															updatePlatform(index, 'os', (event.currentTarget as HTMLInputElement).value)}
													/>
												</label>
												<label class="grid gap-2">
													<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">最低版本</span>
													<Input
														value={platform.minVersion}
														class="h-11 rounded-2xl border-slate-200 bg-white shadow-none"
														oninput={(event) =>
															updatePlatform(index, 'minVersion', (event.currentTarget as HTMLInputElement).value)}
													/>
												</label>
											</div>
										{/each}
									{/if}
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>

				<Tabs.Content value="code">
					<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
						<Card.Header class="gap-3 p-6">
							<Badge variant="outline" class="w-fit rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
								Code
							</Badge>
							<Card.Title
								class="text-[1.85rem] tracking-[-0.05em] text-slate-950"
								style="font-family: var(--font-display)"
							>
								源码
							</Card.Title>
						</Card.Header>
						<Card.Content class="grid gap-4 px-6 pb-6">
							{#each editor.codeFiles as file, index (file.path)}
								<div class="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-xs">
									<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
										<FileCode2Icon class="size-4 text-slate-500" />
										<span>{file.path}</span>
									</div>
									<Textarea
										rows={14}
										value={file.content}
										class="min-h-72 rounded-[24px] border-slate-200 bg-slate-950 px-4 py-3 font-mono text-[13px] leading-6 text-slate-100 shadow-none"
										oninput={(event) =>
											updateFile('codeFiles', index, (event.currentTarget as HTMLTextAreaElement).value)}
									/>
								</div>
							{/each}
						</Card.Content>
					</Card.Root>
				</Tabs.Content>

				<Tabs.Content value="prompt">
					<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
						<Card.Header class="gap-3 p-6">
							<Badge variant="outline" class="w-fit rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
								Prompt & License
							</Badge>
							<Card.Title
								class="text-[1.85rem] tracking-[-0.05em] text-slate-950"
								style="font-family: var(--font-display)"
							>
								Prompt 与说明
							</Card.Title>
						</Card.Header>
						<Card.Content class="grid gap-5 px-6 pb-6">
							<div class="grid gap-4">
								{#each editor.promptFiles as file, index (file.path)}
									<div class="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-xs">
										<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
											<SparklesIcon class="size-4 text-slate-500" />
											<span>{file.path}</span>
										</div>
										<Textarea
											rows={10}
											value={file.content}
											class="min-h-56 rounded-[24px] border-slate-200 bg-white shadow-none"
											oninput={(event) =>
												updateFile('promptFiles', index, (event.currentTarget as HTMLTextAreaElement).value)}
										/>
									</div>
								{/each}
							</div>

							<Separator class="bg-slate-200/80" />

							<div class="grid gap-4 md:grid-cols-3">
								<label class="grid gap-2">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">代码许可</span>
									<Input bind:value={editor.license.code} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={touch} />
								</label>
								<label class="grid gap-2">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">媒体许可</span>
									<Input bind:value={editor.license.media} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={touch} />
								</label>
								<label class="grid gap-2">
									<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">第三方声明路径</span>
									<Input bind:value={editor.license.thirdPartyNotice} class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" oninput={touch} />
								</label>
							</div>

							<label class="grid gap-2">
								<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">第三方声明内容</span>
								<Textarea bind:value={editor.license.thirdPartyText} rows={7} class="min-h-40 rounded-[24px] border-slate-200 bg-white shadow-none" oninput={touch} />
							</label>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>

		<aside class="grid gap-5 xl:sticky xl:top-28 xl:self-start">
			<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
				<Card.Header class="gap-3 p-6">
					<Badge variant="outline" class="w-fit rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
						Media
					</Badge>
					<Card.Title
						class="text-[1.85rem] tracking-[-0.05em] text-slate-950"
						style="font-family: var(--font-display)"
					>
						封面与 Demo
					</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 px-6 pb-6">
					<div class="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-xs">
						<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
							<ImageIcon class="size-4 text-slate-500" />
							<span>Cover</span>
						</div>
						<div class="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
							{#if editor.assets.coverPreviewUrl}
								<img class="block aspect-[16/10] w-full object-cover" src={editor.assets.coverPreviewUrl} alt="当前 cover" />
							{:else}
								<div class="flex aspect-[16/10] items-center justify-center px-4 text-sm text-slate-500">
									暂无封面
								</div>
							{/if}
						</div>
						<label class="mt-4 grid gap-2">
							<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">上传 Cover</span>
							<Input type="file" accept="image/*" class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" onchange={(event) => handleAssetUpload('cover', event)} />
						</label>
					</div>

					<div class="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-xs">
						<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
							<ImageIcon class="size-4 text-slate-500" />
							<span>Demo</span>
						</div>
						<div class="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
							{#if editor.assets.demoPreviewUrl}
								<video class="block aspect-[16/10] w-full object-cover" src={editor.assets.demoPreviewUrl} controls muted playsinline></video>
							{:else}
								<div class="flex aspect-[16/10] items-center justify-center px-4 text-sm text-slate-500">
									暂无 Demo
								</div>
							{/if}
						</div>
						<label class="mt-4 grid gap-2">
							<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">上传 Demo</span>
							<Input type="file" accept="video/*" class="h-11 rounded-2xl border-slate-200 bg-white shadow-none" onchange={(event) => handleAssetUpload('demo', event)} />
						</label>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="studio-surface rounded-[30px] border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
				<Card.Header class="gap-3 p-6">
					<Badge variant="outline" class="w-fit rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
						Publish
					</Badge>
					<Card.Title
						class="text-[1.85rem] tracking-[-0.05em] text-slate-950"
						style="font-family: var(--font-display)"
					>
						发布动作
					</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 px-6 pb-6">
					<div class="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-xs">
						<div class="flex items-center justify-between gap-3">
							<span class="text-sm text-slate-500">当前状态</span>
							<Badge variant="outline" class={`rounded-full px-2.5 py-1 ${statusClass}`}>
								{statusLabel}
							</Badge>
						</div>
						<div class="mt-3 flex items-center justify-between gap-3 text-sm">
							<span class="text-slate-500">当前版本</span>
							<strong class="text-slate-900">{editor.version}</strong>
						</div>
					</div>

					<div class="grid gap-2">
						<Button
							type="button"
							variant="outline"
							class="h-11 rounded-2xl border-slate-200 bg-white shadow-none"
							onclick={handleReview}
							disabled={pendingReview || editor.state !== 'draft'}
						>
							{pendingReview ? '提交中...' : '提交 Review'}
						</Button>
						<Button
							type="button"
							class="h-11 rounded-2xl shadow-none"
							onclick={handlePublish}
							disabled={pendingPublish || editor.state !== 'review'}
						>
							{pendingPublish ? '发布中...' : '发布到公开站'}
						</Button>
					</div>

					{#if saveMessage}
						<Alert
							variant={saveTone === 'success' ? 'default' : 'destructive'}
							class={`rounded-[24px] shadow-none ${
								saveTone === 'success'
									? 'border-emerald-200 bg-emerald-50 text-emerald-700'
									: 'border-rose-200 bg-rose-50 text-rose-700'
							}`}
						>
							<AlertTitle>{saveTone === 'success' ? '保存完成' : '保存失败'}</AlertTitle>
							<AlertDescription>{saveMessage}</AlertDescription>
						</Alert>
					{/if}

					{#if validation}
						<Alert
							variant={validation.ok ? 'default' : 'destructive'}
							class={`rounded-[24px] shadow-none ${
								validation.ok
									? 'border-emerald-200 bg-emerald-50 text-emerald-700'
									: 'border-amber-200 bg-amber-50 text-amber-800'
							}`}
						>
							<AlertTitle class="flex items-center gap-2">
								<CheckCircle2Icon class="size-4" />
								{validation.ok ? '校验通过' : '校验未通过'}
							</AlertTitle>
							<AlertDescription class="mt-2">
								{#if validation.issues.length > 0}
									<ul class="space-y-1">
										{#each validation.issues as issue (`${issue.code}-${issue.path ?? ''}`)}
											<li>{issue.path ? `${issue.path}: ` : ''}{issue.message}</li>
										{/each}
									</ul>
								{:else}
									<p>当前版本已经满足 publish-ready 要求。</p>
								{/if}
							</AlertDescription>
						</Alert>
					{/if}
				</Card.Content>
			</Card.Root>
		</aside>
	</div>
</main>
