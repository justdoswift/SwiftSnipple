<script lang="ts">
	let { data } = $props();

	const draftCount = $derived(data.items.filter((item) => item.state === 'draft').length);
	const reviewCount = $derived(data.items.filter((item) => item.state === 'review').length);
	const publishedCount = $derived(data.items.filter((item) => item.state === 'published').length);
</script>

<svelte:head>
	<title>Studio | SwiftSnippet</title>
</svelte:head>

<main class="dashboard">
	<section class="hero">
		<div>
			<p class="eyebrow">后台总览</p>
			<h2>从录入到发布，现在都在一个地方。</h2>
			<p>内容源仍然是 `content/snippets`，这里只是把录入、校验和发布工作流包成了内部运营台。</p>
		</div>
		<a class="primary-link" href="/studio/snippets/new">新建内容</a>
	</section>

	<section class="stats">
		<article><span>草稿</span><strong>{draftCount}</strong></article>
		<article><span>待评审</span><strong>{reviewCount}</strong></article>
		<article><span>已发布</span><strong>{publishedCount}</strong></article>
	</section>

	<section class="recent">
		<div class="section-head">
			<div>
				<p class="eyebrow">最近内容</p>
				<h3>继续编辑或发布</h3>
			</div>
			<a href="/studio/snippets">查看全部</a>
		</div>

		<div class="list">
			{#each data.items.slice(0, 6) as item (item.id)}
				<a class="row" href={`/studio/snippets/${item.id}`}>
					<div>
						<strong>{item.title}</strong>
						<span>{item.id}</span>
					</div>
					<div class="row-meta">
						<span>{item.state}</span>
						<span>{item.version}</span>
					</div>
				</a>
			{/each}
		</div>
	</section>
</main>

<style>
	.dashboard {
		display: grid;
		gap: 1rem;
	}

	.hero,
	.stats article,
	.recent {
		border-radius: 24px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(17, 17, 17, 0.06);
		box-shadow: 0 16px 32px rgba(17, 17, 17, 0.045);
	}

	.hero,
	.recent {
		padding: 1.1rem;
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: center;
	}

	.eyebrow,
	h2,
	h3,
	p {
		margin: 0;
	}

	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(17, 17, 17, 0.48);
	}

	h2,
	h3 {
		font-family: var(--font-display);
	}

	h2 {
		font-size: 1.8rem;
		max-width: 12ch;
	}

	p {
		margin-top: 0.4rem;
		max-width: 36rem;
		color: rgba(17, 17, 17, 0.62);
	}

	.primary-link,
	.section-head a {
		text-decoration: none;
		padding: 0.74rem 0.96rem;
		border-radius: 999px;
		background: rgba(0, 132, 255, 0.9);
		color: white;
		font-weight: 600;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.stats article {
		padding: 1rem;
		display: grid;
		gap: 0.32rem;
	}

	.stats span,
	.row span {
		color: rgba(17, 17, 17, 0.56);
	}

	.stats strong {
		font-size: 2rem;
		font-family: var(--font-display);
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.8rem;
	}

	.list {
		display: grid;
		gap: 0.6rem;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 1rem;
		border-radius: 18px;
		background: rgba(248, 250, 255, 0.95);
		text-decoration: none;
		border: 1px solid rgba(17, 17, 17, 0.06);
	}

	.row strong,
	.row span {
		display: block;
	}

	.row-meta {
		text-align: right;
	}

	@media (max-width: 900px) {
		.hero,
		.stats {
			grid-template-columns: 1fr;
		}
	}
</style>
