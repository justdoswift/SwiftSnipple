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
		loadAdminSnippet,
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
	const snapshotEditor = (value: AdminSnippetEditorPayload) => JSON.stringify(value);
	const initialEditor = cloneEditor();

	let editor = $state<AdminSnippetEditorPayload>(initialEditor);
	let tagsText = $state(initialEditor.tags.join(', '));
	let savedSnapshot = $state(snapshotEditor(initialEditor));
	let validation = $state<AdminValidationResponse | null>(null);
	let saveMessage = $state('');
	let saveTone = $state<'success' | 'error'>('success');
	let pendingSave = $state(false);
	let pendingValidate = $state(false);
	let pendingReview = $state(false);
	let pendingPublish = $state(false);
	let dirty = $state(false);
	let activeTab = $state('meta');
	let actionBanner = $state<{
		tone: 'neutral' | 'success' | 'error' | 'warning';
		title: string;
		description: string;
	} | null>(null);
	let assetFeedback = $state<
		Record<
			'cover' | 'demo',
			{ status: 'idle' | 'uploading' | 'success' | 'error'; fileName: string; message: string }
		>
	>({
		cover: { status: 'idle', fileName: '', message: '推荐上传横向封面。' },
		demo: { status: 'idle', fileName: '', message: '可稍后补充演示。' }
	});

	const statusLabel = $derived(
		editor.state === 'published' ? '已发布' : editor.state === 'review' ? '待评审' : '草稿'
	);

	const statusClass = $derived(
		editor.state === 'published'
			? 'default'
			: editor.state === 'review'
				? 'secondary'
				: 'outline'
	);

	const actionBannerVariant = $derived(actionBanner?.tone === 'error' ? 'destructive' : 'default');

	function assetBadgeVariant(status: 'idle' | 'uploading' | 'success' | 'error') {
		if (status === 'success') return 'default';
		if (status === 'uploading') return 'secondary';
		if (status === 'error') return 'destructive';
		return 'outline';
	}

	function readinessVariant(ready: boolean) {
		return ready ? 'default' : 'outline';
	}

	const nextStep = $derived.by(() => {
		if (dirty) {
			return '先保存当前修改。';
		}
		if (!validation) {
			return '先运行校验。';
		}
		if (!validation.ok) {
			return '先处理校验项。';
		}
		if (editor.state === 'draft') {
			return '可以送审。';
		}
		if (editor.state === 'review') {
			return '可以发布。';
		}
		return '可以继续更新。';
	});

	const readinessItems = $derived.by(() => [
		{
			label: '标题与摘要',
			ready: editor.title.trim().length > 0 && editor.summary.trim().length > 0,
			detail: ''
		},
		{
			label: '代码内容',
			ready: editor.codeFiles.some((file) => file.content.trim().length > 0),
			detail: ''
		},
		{
			label: '提示词',
			ready: editor.promptFiles.some((file) => file.content.trim().length > 0),
			detail: ''
		},
		{
			label: '平台边界',
			ready: editor.platforms.some(
				(platform) => platform.os.trim().length > 0 && platform.minVersion.trim().length > 0
			),
			detail: ''
		},
		{
			label: '封面媒体',
			ready: Boolean(editor.assets.coverPreviewUrl),
			detail: ''
		}
	]);

	const readyCount = $derived(readinessItems.filter((item) => item.ready).length);
	const totalAssetCount = $derived(
		[editor.assets.coverPreviewUrl, editor.assets.demoPreviewUrl].filter(Boolean).length
	);
	const workflowCards = $derived.by(() => [
		{
			label: '当前阶段',
			value: statusLabel,
			detail:
				editor.state === 'published'
					? '已经对外可见'
					: editor.state === 'review'
						? '等待发布'
						: '继续完善内容'
		},
		{
			label: '就绪项',
			value: `${readyCount}/${readinessItems.length}`,
			detail: readyCount === readinessItems.length ? '可以继续推进' : '还有内容待补充'
		},
		{
			label: '媒体状态',
			value: `${totalAssetCount}/2`,
			detail: editor.assets.demoPreviewUrl ? '封面和演示都已准备好' : '可以继续补素材'
		}
	]);

	$effect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			if (!dirty) return;
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	$effect(() => {
		const nextDirty = snapshotEditor(editor) !== savedSnapshot;
		if (nextDirty === dirty) return;
		dirty = nextDirty;
		if (dirty) {
			saveMessage = '';
			actionBanner = {
				tone: 'warning',
				title: '你有未保存修改',
				description: '离开前记得先保存。'
			};
		}
	});

	function touch() {
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
			savedSnapshot = snapshotEditor(editor);
			saveTone = 'success';
			saveMessage = '已保存草稿';
			dirty = false;
			actionBanner = {
				tone: 'success',
				title: '草稿已保存',
				description: '刚才的修改已经保存，可以继续下一步。'
			};
		} catch (error) {
			saveTone = 'error';
			saveMessage = error instanceof Error ? error.message : '保存失败';
			actionBanner = {
				tone: 'error',
				title: '保存失败',
				description: error instanceof Error ? error.message : '保存失败，请稍后重试。'
			};
		} finally {
			pendingSave = false;
		}
	}

	async function handleValidate() {
		pendingValidate = true;
		try {
			validation = await validateAdminSnippet(fetch, editor.id);
			actionBanner = validation.ok
				? {
						tone: 'success',
						title: '校验通过',
						description: '这条内容已经可以继续发布。'
					}
				: {
						tone: 'warning',
						title: '校验未通过',
						description: `还有 ${validation.issues.length} 项需要处理。`
					};
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
		assetFeedback[kind] = {
			status: 'uploading',
			fileName: file.name,
			message: '上传中，完成后会自动刷新当前预览。'
		};
		actionBanner = {
			tone: 'neutral',
			title: `正在上传${kind === 'cover' ? '封面' : '演示'}`,
			description: `${file.name} 上传中，稍后会更新预览。`
		};
		try {
			await uploadAdminAsset(fetch, editor.id, kind, file);
			editor = await loadAdminSnippet(fetch, editor.id);
			tagsText = editor.tags.join(', ');
			savedSnapshot = snapshotEditor(editor);
			dirty = false;
			assetFeedback[kind] = {
				status: 'success',
				fileName: file.name,
				message: '上传成功，预览已经更新。'
			};
			actionBanner = {
				tone: 'success',
				title: `${kind === 'cover' ? '封面' : '演示'}已更新`,
				description: `${file.name} 已更新。`
			};
		} catch (error) {
			assetFeedback[kind] = {
				status: 'error',
				fileName: file.name,
				message: error instanceof Error ? error.message : '上传失败'
			};
			actionBanner = {
				tone: 'error',
				title: `${kind === 'cover' ? '封面' : '演示'}上传失败`,
				description: error instanceof Error ? error.message : '上传失败，请稍后重试。'
			};
		} finally {
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>{editor.title} | Studio</title>
</svelte:head>

<main class="grid gap-5">
	<Card.Root>
		<Card.Header class="gap-5 md:flex-row md:items-start md:justify-between">
			<div class="space-y-3">
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant={statusClass}>
						{statusLabel}
					</Badge>
					<Badge variant="outline">
						内容 ID · {editor.id}
					</Badge>
				</div>
				<div>
					<h2 class="text-2xl font-semibold tracking-tight text-foreground">{editor.title}</h2>
					{#if editor.summary}
						<Card.Description class="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
							{editor.summary}
						</Card.Description>
					{/if}
				</div>
			</div>

			<div class="flex flex-col items-stretch gap-3 md:min-w-[320px]">
				<div class="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={handleValidate}
						disabled={pendingValidate}
					>
						{pendingValidate ? '校验中...' : '运行校验'}
					</Button>
					<Button
						type="button"
						size="sm"
						onclick={handleSave}
						disabled={pendingSave}
					>
						{pendingSave ? '保存中...' : dirty ? '保存修改' : '保存草稿'}
					</Button>
				</div>
				<p class="text-sm leading-6 text-muted-foreground">
					当前版本 {editor.version} · {dirty ? '尚未保存' : '已保存'}
				</p>
			</div>
		</Card.Header>
	</Card.Root>

	{#if actionBanner}
		<Alert variant={actionBannerVariant}>
			<AlertTitle>{actionBanner.title}</AlertTitle>
			<AlertDescription>{actionBanner.description}</AlertDescription>
		</Alert>
	{/if}

	<div class="grid gap-3 md:grid-cols-3">
		{#each workflowCards as card (card.label)}
			<Card.Root size="sm">
				<Card.Content class="pt-0">
					<p class="text-xs font-medium text-muted-foreground">{card.label}</p>
					<p class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<div class="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_320px]">
		<div class="grid gap-5">
			<Tabs.Root bind:value={activeTab} class="gap-4">
					<Tabs.List variant="line">
						<Tabs.Trigger value="meta">基本信息</Tabs.Trigger>
						<Tabs.Trigger value="code">源码</Tabs.Trigger>
						<Tabs.Trigger value="prompt">提示词与许可</Tabs.Trigger>
					</Tabs.List>

				<Tabs.Content value="meta">
					<Card.Root>
						<Card.Header>
							<Card.Title class="text-lg font-semibold tracking-tight">基本信息</Card.Title>
						</Card.Header>
						<Card.Content class="grid gap-5">
							<div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
								<Card.Root size="sm">
									<Card.Header>
										<Card.Title>识别信息</Card.Title>
									</Card.Header>
									<Card.Content class="grid gap-4">
									<div class="grid gap-4">
										<label class="grid gap-2">
											<span class="text-sm font-medium text-muted-foreground">标题</span>
											<Input bind:value={editor.title} oninput={touch} />
										</label>
										<label class="grid gap-2">
											<span class="text-sm font-medium text-muted-foreground">内容 ID</span>
											<Input bind:value={editor.id} disabled />
										</label>
										<label class="grid gap-2">
											<span class="text-sm font-medium text-muted-foreground">摘要</span>
											<Textarea bind:value={editor.summary} rows={5} class="min-h-32" oninput={touch} />
										</label>
									</div>
									</Card.Content>
								</Card.Root>

								<Card.Root size="sm">
									<Card.Header>
										<Card.Title>发现与版本</Card.Title>
									</Card.Header>
									<Card.Content class="grid gap-4">
									<div class="grid gap-4">
										<div class="grid gap-4 md:grid-cols-2">
											<label class="grid gap-2">
												<span class="text-sm font-medium text-muted-foreground">分类</span>
												<Input bind:value={editor.categoryPrimary} oninput={touch} />
											</label>
											<label class="grid gap-2">
												<span class="text-sm font-medium text-muted-foreground">难度</span>
												<Input bind:value={editor.difficulty} oninput={touch} />
											</label>
											<label class="grid gap-2">
												<span class="text-sm font-medium text-muted-foreground">版本</span>
												<Input bind:value={editor.version} oninput={touch} />
											</label>
											<label class="grid gap-2">
												<span class="text-sm font-medium text-muted-foreground">来源版本</span>
												<Input bind:value={editor.sourceRevision} oninput={touch} />
											</label>
										</div>
										<label class="grid gap-2">
											<span class="text-sm font-medium text-muted-foreground">
												标签（逗号分隔）
											</span>
											<Input bind:value={tagsText} oninput={syncTags} />
										</label>
									</div>
									</Card.Content>
								</Card.Root>
							</div>

							<Card.Root size="sm">
								<Card.Header class="flex-row items-center justify-between">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div>
										<Card.Title>平台</Card.Title>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onclick={addPlatform}
									>
										新增平台
									</Button>
								</div>
								</Card.Header>
								<Card.Content class="grid gap-4">
									{#if editor.platforms.length === 0}
										<div class="text-muted-foreground rounded-lg border border-dashed px-4 py-4 text-sm">暂无平台信息</div>
									{:else}
										{#each editor.platforms as platform, index (`${index}-${platform.os}`)}
											<div class="grid gap-4 md:grid-cols-2">
												<label class="grid gap-2">
													<span class="text-sm font-medium text-muted-foreground">系统</span>
													<Input
														value={platform.os}
														oninput={(event) =>
															updatePlatform(index, 'os', (event.currentTarget as HTMLInputElement).value)}
													/>
												</label>
												<label class="grid gap-2">
													<span class="text-sm font-medium text-muted-foreground">最低版本</span>
													<Input
														value={platform.minVersion}
														oninput={(event) =>
															updatePlatform(index, 'minVersion', (event.currentTarget as HTMLInputElement).value)}
													/>
												</label>
											</div>
										{/each}
									{/if}
								</Card.Content>
							</Card.Root>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>

				<Tabs.Content value="code">
					<Card.Root>
						<Card.Header>
							<Card.Title class="text-lg font-semibold tracking-tight">源码</Card.Title>
						</Card.Header>
						<Card.Content class="grid gap-4">
							{#each editor.codeFiles as file, index (file.path)}
								<Card.Root size="sm">
									<Card.Content>
									<div class="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
										<FileCode2Icon class="text-muted-foreground size-4" />
										<span>{file.path}</span>
									</div>
									<Textarea
										rows={14}
										value={file.content}
										class="min-h-72 font-mono text-sm leading-6"
										oninput={(event) =>
											updateFile('codeFiles', index, (event.currentTarget as HTMLTextAreaElement).value)}
									/>
									</Card.Content>
								</Card.Root>
							{/each}
						</Card.Content>
					</Card.Root>
				</Tabs.Content>

				<Tabs.Content value="prompt">
					<Card.Root>
						<Card.Header>
							<Card.Title class="text-lg font-semibold tracking-tight">提示词与许可</Card.Title>
						</Card.Header>
						<Card.Content class="grid gap-5">
							<div class="grid gap-4">
								{#each editor.promptFiles as file, index (file.path)}
									<Card.Root size="sm">
										<Card.Content>
										<div class="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
											<SparklesIcon class="text-muted-foreground size-4" />
											<span>{file.path}</span>
										</div>
										<Textarea
											rows={10}
											value={file.content}
											class="min-h-56"
											oninput={(event) =>
												updateFile('promptFiles', index, (event.currentTarget as HTMLTextAreaElement).value)}
										/>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>

							<Separator />

							<div class="grid gap-4 md:grid-cols-3">
								<label class="grid gap-2">
									<span class="text-sm font-medium text-muted-foreground">代码许可</span>
									<Input bind:value={editor.license.code} oninput={touch} />
								</label>
								<label class="grid gap-2">
									<span class="text-sm font-medium text-muted-foreground">媒体许可</span>
									<Input bind:value={editor.license.media} oninput={touch} />
								</label>
								<label class="grid gap-2">
									<span class="text-sm font-medium text-muted-foreground">第三方声明文件</span>
									<Input bind:value={editor.license.thirdPartyNotice} oninput={touch} />
								</label>
							</div>

							<label class="grid gap-2">
								<span class="text-sm font-medium text-muted-foreground">第三方说明</span>
								<Textarea bind:value={editor.license.thirdPartyText} rows={7} class="min-h-40" oninput={touch} />
							</label>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>

		<aside class="grid gap-5 xl:sticky xl:top-24 xl:self-start">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg font-semibold tracking-tight">封面与演示</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4">
					<Card.Root size="sm">
						<Card.Content>
						<div class="mb-3 flex items-center justify-between gap-3">
							<div class="flex items-center gap-2 text-sm font-medium text-foreground">
								<ImageIcon class="text-muted-foreground size-4" />
								<span>封面</span>
							</div>
							<Badge variant={assetBadgeVariant(assetFeedback.cover.status)}>
								{assetFeedback.cover.status === 'success'
									? '已更新'
									: assetFeedback.cover.status === 'uploading'
										? '上传中'
										: assetFeedback.cover.status === 'error'
											? '失败'
											: editor.assets.coverPreviewUrl
												? '已有封面'
												: '待补充'}
							</Badge>
						</div>
						<div class="overflow-hidden rounded-lg border bg-muted/50">
							{#if editor.assets.coverPreviewUrl}
								<img class="block aspect-[16/10] w-full object-cover" src={editor.assets.coverPreviewUrl} alt="当前 cover" />
							{:else}
								<div class="text-muted-foreground flex aspect-[16/10] items-center justify-center px-4 text-sm">
									暂无封面
								</div>
							{/if}
						</div>
						<label class="mt-4 grid gap-2">
							<span class="text-sm font-medium text-muted-foreground">上传封面</span>
							<Input type="file" accept="image/*" onchange={(event) => handleAssetUpload('cover', event)} />
						</label>
						<div class="text-muted-foreground mt-3 text-sm leading-6">
							<p>{assetFeedback.cover.fileName ? `${assetFeedback.cover.fileName} · ` : ''}{assetFeedback.cover.message}</p>
						</div>
						</Card.Content>
					</Card.Root>

					<Card.Root size="sm">
						<Card.Content>
						<div class="mb-3 flex items-center justify-between gap-3">
							<div class="flex items-center gap-2 text-sm font-medium text-foreground">
								<ImageIcon class="text-muted-foreground size-4" />
								<span>演示</span>
							</div>
							<Badge variant={assetBadgeVariant(assetFeedback.demo.status)}>
								{assetFeedback.demo.status === 'success'
									? '已更新'
									: assetFeedback.demo.status === 'uploading'
										? '上传中'
										: assetFeedback.demo.status === 'error'
											? '失败'
											: editor.assets.demoPreviewUrl
												? '已有演示'
												: '可补充'}
							</Badge>
						</div>
						<div class="overflow-hidden rounded-lg border bg-muted/50">
							{#if editor.assets.demoPreviewUrl}
								<video class="block aspect-[16/10] w-full object-cover" src={editor.assets.demoPreviewUrl} controls muted playsinline></video>
							{:else}
								<div class="text-muted-foreground flex aspect-[16/10] items-center justify-center px-4 text-sm">暂无演示</div>
							{/if}
						</div>
						<label class="mt-4 grid gap-2">
							<span class="text-sm font-medium text-muted-foreground">上传演示</span>
							<Input type="file" accept="video/*" onchange={(event) => handleAssetUpload('demo', event)} />
						</label>
						<div class="text-muted-foreground mt-3 text-sm leading-6">
							<p>{assetFeedback.demo.fileName ? `${assetFeedback.demo.fileName} · ` : ''}{assetFeedback.demo.message}</p>
						</div>
						</Card.Content>
					</Card.Root>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg font-semibold tracking-tight">发布</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4">
					<Card.Root size="sm">
						<Card.Content>
						<div class="flex items-center justify-between gap-3">
							<span class="text-sm text-muted-foreground">当前状态</span>
							<Badge variant={statusClass}>
								{statusLabel}
							</Badge>
						</div>
						<div class="mt-3 flex items-center justify-between gap-3 text-sm">
							<span class="text-muted-foreground">当前版本</span>
							<strong class="text-foreground">{editor.version}</strong>
						</div>
						<p class="text-muted-foreground mt-3 text-sm leading-6">{nextStep}</p>
						</Card.Content>
					</Card.Root>

					<Card.Root size="sm">
						<Card.Content>
						<p class="text-sm font-medium text-foreground">检查项</p>
						<div class="mt-3 grid gap-2">
							{#each readinessItems as item (item.label)}
								<div class="bg-muted/40 flex items-start justify-between gap-3 rounded-md border px-3 py-3">
								<div class="min-w-0">
									<p class="text-sm font-medium text-foreground">{item.label}</p>
								</div>
									<Badge variant={readinessVariant(item.ready)} class="mt-0.5 shrink-0">
										{item.ready ? '已就绪' : '待补充'}
									</Badge>
								</div>
							{/each}
						</div>
						</Card.Content>
					</Card.Root>

					<div class="grid gap-2">
						<Button
							type="button"
							variant="outline"
							size="lg"
							onclick={handleReview}
							disabled={pendingReview || editor.state !== 'draft'}
						>
							{pendingReview ? '提交中...' : '送审'}
						</Button>
						<Button
							type="button"
							size="lg"
							onclick={handlePublish}
							disabled={pendingPublish || editor.state !== 'review'}
						>
							{pendingPublish ? '发布中...' : '发布到公开站'}
						</Button>
					</div>

					{#if saveMessage}
						<Alert variant={saveTone === 'success' ? 'default' : 'destructive'}>
							<AlertTitle>{saveTone === 'success' ? '保存完成' : '保存失败'}</AlertTitle>
							<AlertDescription>{saveMessage}</AlertDescription>
						</Alert>
					{/if}

					{#if validation}
						<Alert variant={validation.ok ? 'default' : 'destructive'}>
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
									<p>当前版本可以发布。</p>
								{/if}
							</AlertDescription>
						</Alert>
					{/if}
				</Card.Content>
			</Card.Root>
		</aside>
	</div>
</main>
