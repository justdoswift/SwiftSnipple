<script lang="ts">
	let { data } = $props();

	let query = $state('');
	let stateFilter = $state('');
	const filteredItems = $derived(
		data.items.filter((item) => {
			const matchesQuery =
				query.trim() === '' ||
				item.title.toLowerCase().includes(query.toLowerCase()) ||
				item.id.toLowerCase().includes(query.toLowerCase());
			const matchesState = stateFilter === '' || item.state === stateFilter;
			return matchesQuery && matchesState;
		})
	);
</script>

<svelte:head>
	<title>Studio Snippets | SwiftSnippet</title>
</svelte:head>

<main class="list-page">
	<section class="toolbar">
		<div>
			<p class="eyebrow">内容管理</p>
			<h2>录入、筛查、发布全部 snippet。</h2>
		</div>
		<div class="toolbar-actions">
			<input bind:value={query} type="search" placeholder="搜索标题或 slug" />
			<select bind:value={stateFilter}>
				<option value="">全部状态</option>
				<option value="draft">draft</option>
				<option value="review">review</option>
				<option value="published">published</option>
			</select>
			<a href="/studio/snippets/new">新建内容</a>
		</div>
	</section>

	<section class="table-shell">
		<div class="table-head">
			<span>标题</span>
			<span>状态</span>
			<span>媒体</span>
			<span>版本</span>
			<span>更新时间</span>
		</div>
		{#each filteredItems as item (item.id)}
			<a class="table-row" href={`/studio/snippets/${item.id}`}>
				<div>
					<strong>{item.title}</strong>
					<span>{item.id}</span>
				</div>
				<span>{item.state}</span>
				<span>{item.hasCover ? 'cover' : '-'} / {item.hasDemo ? 'demo' : '-'}</span>
				<span>{item.version}</span>
				<span>{new Date(item.updatedAt).toLocaleString('zh-CN')}</span>
			</a>
		{/each}
	</section>
</main>

<style>
	.list-page {
		display: grid;
		gap: 1rem;
	}

	.toolbar,
	.table-shell {
		padding: 1rem;
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
		font-size: 1.6rem;
	}

	.toolbar {
		display: grid;
		gap: 0.9rem;
	}

	.toolbar-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}

	input,
	select,
	a {
		font: inherit;
	}

	input,
	select {
		padding: 0.84rem 0.92rem;
		border-radius: 16px;
		border: 1px solid rgba(17, 17, 17, 0.08);
		background: white;
	}

	.toolbar-actions a {
		text-decoration: none;
		padding: 0.84rem 1rem;
		border-radius: 16px;
		background: rgba(0, 132, 255, 0.9);
		color: white;
		font-weight: 600;
	}

	.table-head,
	.table-row {
		display: grid;
		grid-template-columns: minmax(0, 2fr) 0.8fr 1fr 0.8fr 1.1fr;
		gap: 1rem;
		align-items: center;
	}

	.table-head {
		padding: 0 0.24rem 0.6rem;
		font-size: 0.74rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(17, 17, 17, 0.44);
	}

	.table-row {
		padding: 0.92rem 0.24rem;
		text-decoration: none;
		border-top: 1px solid rgba(17, 17, 17, 0.06);
	}

	.table-row strong,
	.table-row span {
		display: block;
	}

	.table-row div span {
		color: rgba(17, 17, 17, 0.54);
	}

	@media (max-width: 960px) {
		.table-head {
			display: none;
		}

		.table-row {
			grid-template-columns: 1fr;
			border-radius: 18px;
			background: rgba(248, 250, 255, 0.94);
			padding: 1rem;
			margin-top: 0.7rem;
			border-top: 0;
		}
	}
</style>
