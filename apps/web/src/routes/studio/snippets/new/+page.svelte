<script lang="ts">
	import { goto } from '$app/navigation';
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

<main class="new-page">
	<form class="new-card" onsubmit={handleSubmit}>
		<div>
			<p class="eyebrow">新建内容</p>
			<h2>先生成骨架，再进入完整编辑。</h2>
		</div>

		<label><span>Slug</span><input bind:value={payload.id} required placeholder="例如：floating-toolbar" /></label>
		<label><span>标题</span><input bind:value={payload.title} required placeholder="例如：浮动工具栏" /></label>
		<label><span>摘要</span><textarea bind:value={payload.summary} rows="4"></textarea></label>

		<div class="grid">
			<label><span>分类</span><input bind:value={payload.categoryPrimary} /></label>
			<label><span>难度</span><input bind:value={payload.difficulty} /></label>
			<label><span>版本</span><input bind:value={payload.version} /></label>
		</div>

		{#if errorMessage}
			<p class="error">{errorMessage}</p>
		{/if}

		<button type="submit" disabled={pending}>{pending ? '创建中...' : '创建并进入编辑页'}</button>
	</form>
</main>

<style>
	.new-page {
		display: grid;
	}

	.new-card {
		display: grid;
		gap: 0.9rem;
		padding: 1.1rem;
		border-radius: 24px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(17, 17, 17, 0.06);
		box-shadow: 0 16px 32px rgba(17, 17, 17, 0.045);
	}

	.eyebrow,
	h2 {
		margin: 0;
	}

	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(17, 17, 17, 0.48);
	}

	h2 {
		font-family: var(--font-display);
	}

	label {
		display: grid;
		gap: 0.4rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.8rem;
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

	button {
		padding: 0.92rem 1rem;
		border: 0;
		border-radius: 16px;
		background: rgba(0, 132, 255, 0.9);
		color: white;
		font-weight: 700;
		cursor: pointer;
	}

	.error {
		margin: 0;
		color: #bf1f46;
	}

	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
