<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		moveSnippetToReview,
		publishSnippetVersion,
		saveAdminSnippet,
		uploadAdminAsset,
		validateAdminSnippet
	} from '$lib/studio/api';
	import type { AdminSnippetEditorPayload, AdminValidationResponse } from '$lib/studio/types';

	let { data } = $props();
	const cloneEditor = () => structuredClone(data.editor) as AdminSnippetEditorPayload;
	let editor = $state<AdminSnippetEditorPayload>(cloneEditor());
	let tagsText = $state(cloneEditor().tags.join(', '));
	let validation = $state<AdminValidationResponse | null>(null);
	let saveMessage = $state('');
	let pendingSave = $state(false);
	let pendingValidate = $state(false);
	let pendingReview = $state(false);
	let pendingPublish = $state(false);
	let dirty = $state(false);

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
			saveMessage = '已保存草稿';
			dirty = false;
		} catch (error) {
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

<main class="editor-page">
	<section class="topbar">
		<div>
			<p class="eyebrow">编辑内容</p>
			<h2>{editor.title}</h2>
			<p class="slug">{editor.id}</p>
		</div>
		<div class="actions">
			<button type="button" class="light" onclick={handleValidate} disabled={pendingValidate}>
				{pendingValidate ? '校验中...' : '运行校验'}
			</button>
			<button type="button" class="light" onclick={handleSave} disabled={pendingSave}>
				{pendingSave ? '保存中...' : '保存草稿'}
			</button>
		</div>
	</section>

	<div class="editor-grid">
		<section class="panel">
			<h3>基本信息</h3>
			<div class="field-grid">
				<label><span>标题</span><input bind:value={editor.title} oninput={touch} /></label>
				<label><span>Slug</span><input bind:value={editor.id} disabled /></label>
				<label><span>分类</span><input bind:value={editor.categoryPrimary} oninput={touch} /></label>
				<label><span>难度</span><input bind:value={editor.difficulty} oninput={touch} /></label>
				<label><span>版本</span><input bind:value={editor.version} oninput={touch} /></label>
				<label><span>Source revision</span><input bind:value={editor.sourceRevision} oninput={touch} /></label>
			</div>
			<label><span>摘要</span><textarea bind:value={editor.summary} rows="4" oninput={touch}></textarea></label>
			<label><span>标签（逗号分隔）</span><input bind:value={tagsText} oninput={syncTags} /></label>

			<div class="subsection">
				<div class="subsection-head">
					<h4>平台</h4>
					<button type="button" class="ghost" onclick={addPlatform}>新增平台</button>
				</div>
				{#each editor.platforms as platform, index (`${index}-${platform.os}`)}
					<div class="field-grid compact">
						<label><span>OS</span><input value={platform.os} oninput={(event) => updatePlatform(index, 'os', (event.currentTarget as HTMLInputElement).value)} /></label>
						<label><span>最低版本</span><input value={platform.minVersion} oninput={(event) => updatePlatform(index, 'minVersion', (event.currentTarget as HTMLInputElement).value)} /></label>
					</div>
				{/each}
			</div>
		</section>

		<section class="panel">
			<h3>媒体</h3>
			<div class="media-grid">
				<div class="media-card">
					<strong>Cover</strong>
					{#if editor.assets.coverPreviewUrl}
						<img src={editor.assets.coverPreviewUrl} alt="当前 cover" />
					{:else}
						<div class="media-placeholder">暂无 cover</div>
					{/if}
					<input type="file" accept="image/*" onchange={(event) => handleAssetUpload('cover', event)} />
				</div>

				<div class="media-card">
					<strong>Demo</strong>
					{#if editor.assets.demoPreviewUrl}
						<video src={editor.assets.demoPreviewUrl} controls muted playsinline></video>
					{:else}
						<div class="media-placeholder">暂无 demo</div>
					{/if}
					<input type="file" accept="video/*" onchange={(event) => handleAssetUpload('demo', event)} />
				</div>
			</div>
		</section>

		<section class="panel">
			<h3>源码</h3>
			{#each editor.codeFiles as file, index (file.path)}
				<label class="file-block">
					<span>{file.path}</span>
					<textarea rows="10" value={file.content} oninput={(event) => updateFile('codeFiles', index, (event.currentTarget as HTMLTextAreaElement).value)}></textarea>
				</label>
			{/each}
		</section>

		<section class="panel">
			<h3>Prompt 与说明</h3>
			{#each editor.promptFiles as file, index (file.path)}
				<label class="file-block">
					<span>{file.path}</span>
					<textarea rows="8" value={file.content} oninput={(event) => updateFile('promptFiles', index, (event.currentTarget as HTMLTextAreaElement).value)}></textarea>
				</label>
			{/each}

			<div class="field-grid">
				<label><span>代码许可</span><input bind:value={editor.license.code} oninput={touch} /></label>
				<label><span>媒体许可</span><input bind:value={editor.license.media} oninput={touch} /></label>
				<label><span>第三方声明路径</span><input bind:value={editor.license.thirdPartyNotice} oninput={touch} /></label>
			</div>
			<label><span>第三方声明内容</span><textarea bind:value={editor.license.thirdPartyText} rows="6" oninput={touch}></textarea></label>
		</section>

		<section class="panel publish-panel">
			<h3>发布</h3>
			<div class="publish-state">
				<strong>当前状态：{editor.state}</strong>
				<span>版本：{editor.version}</span>
			</div>
			<div class="actions">
				<button type="button" class="light" onclick={handleReview} disabled={pendingReview || editor.state !== 'draft'}>
					{pendingReview ? '提交中...' : '提交 Review'}
				</button>
				<button type="button" onclick={handlePublish} disabled={pendingPublish || editor.state !== 'review'}>
					{pendingPublish ? '发布中...' : '发布'}
				</button>
			</div>
			{#if saveMessage}
				<p class="notice">{saveMessage}</p>
			{/if}
			{#if validation}
				<div class="validation">
					<strong>{validation.ok ? '校验通过' : '校验未通过'}</strong>
					{#if validation.issues.length > 0}
						<ul>
							{#each validation.issues as issue (`${issue.code}-${issue.path ?? ''}`)}
								<li>{issue.path ? `${issue.path}: ` : ''}{issue.message}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</section>
	</div>
</main>

<style>
	.editor-page,
	.editor-grid {
		display: grid;
		gap: 1rem;
	}

	.topbar,
	.panel {
		padding: 1rem;
		border-radius: 24px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(17, 17, 17, 0.06);
		box-shadow: 0 16px 32px rgba(17, 17, 17, 0.045);
	}

	.topbar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: center;
	}

	.eyebrow,
	h2,
	h3,
	h4,
	.slug,
	.notice {
		margin: 0;
	}

	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(17, 17, 17, 0.48);
	}

	h2,
	h3,
	h4 {
		font-family: var(--font-display);
	}

	.slug {
		color: rgba(17, 17, 17, 0.54);
	}

	.editor-grid {
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
		align-items: start;
	}

	.panel {
		display: grid;
		gap: 0.8rem;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}

	.field-grid.compact {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	label {
		display: grid;
		gap: 0.38rem;
	}

	label span,
	.file-block span {
		font-size: 0.78rem;
		font-weight: 600;
		color: rgba(17, 17, 17, 0.58);
	}

	input,
	textarea,
	button {
		font: inherit;
	}

	input,
	textarea {
		padding: 0.84rem 0.92rem;
		border-radius: 16px;
		border: 1px solid rgba(17, 17, 17, 0.08);
		background: white;
	}

	textarea {
		resize: vertical;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}

	button {
		padding: 0.82rem 1rem;
		border: 0;
		border-radius: 16px;
		background: rgba(0, 132, 255, 0.9);
		color: white;
		font-weight: 700;
		cursor: pointer;
	}

	button.light,
	button.ghost {
		background: white;
		color: rgba(17, 17, 17, 0.76);
		border: 1px solid rgba(17, 17, 17, 0.08);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.subsection {
		display: grid;
		gap: 0.6rem;
	}

	.subsection-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.media-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}

	.media-card {
		display: grid;
		gap: 0.6rem;
	}

	.media-card img,
	.media-card video,
	.media-placeholder {
		width: 100%;
		border-radius: 18px;
		border: 1px solid rgba(17, 17, 17, 0.08);
		background: rgba(248, 250, 255, 0.94);
		min-height: 14rem;
		object-fit: cover;
	}

	.media-placeholder {
		display: grid;
		place-items: center;
		color: rgba(17, 17, 17, 0.44);
	}

	.file-block {
		display: grid;
		gap: 0.4rem;
	}

	.publish-state {
		display: grid;
		gap: 0.2rem;
	}

	.validation {
		padding: 0.9rem 1rem;
		border-radius: 18px;
		background: rgba(248, 250, 255, 0.94);
		border: 1px solid rgba(17, 17, 17, 0.06);
	}

	.validation ul {
		margin: 0.5rem 0 0;
		padding-left: 1.2rem;
	}

	@media (max-width: 1100px) {
		.editor-grid,
		.field-grid,
		.media-grid,
		.topbar {
			grid-template-columns: 1fr;
		}
	}
</style>
