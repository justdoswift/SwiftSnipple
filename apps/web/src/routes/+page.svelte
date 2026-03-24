<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>SwiftSnippet Foundation</title>
	<meta
		name="description"
		content="SwiftSnippet Phase 1 stub for protocol, data contract, and CI foundations."
	/>
</svelte:head>

<main class="shell">
	<section class="hero">
		<p class="eyebrow">Phase 1</p>
		<h1>{data.appMeta.name}</h1>
		<p class="lede">
			Runnable SvelteKit stub ready for later discovery work. This phase locks the content
			protocol, local infrastructure, and CI foundations.
		</p>
	</section>

	<section class="grid">
		<article>
			<h2>Locked for this phase</h2>
			<ul>
				<li>Single-repo modular structure</li>
				<li>TypeScript + JSON Schema as protocol source of truth</li>
				<li>PostgreSQL local baseline</li>
				<li>Core CI gates only</li>
			</ul>
		</article>

		<article>
			<h2>Health endpoints</h2>
			<ul>
				<li>Web health page at <code>/health</code></li>
				<li>API health endpoint at <code>/health</code></li>
				<li>API metadata endpoint at <code>/meta</code></li>
			</ul>
		</article>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: "Iowan Old Style", "Palatino Linotype", serif;
		background:
			radial-gradient(circle at top left, rgba(255, 196, 140, 0.45), transparent 30%),
			linear-gradient(180deg, #f7f2ea 0%, #efe4d3 100%);
		color: #1d1a17;
	}

	.shell {
		min-height: 100vh;
		padding: 4rem 1.5rem;
	}

	.hero,
	.grid {
		max-width: 960px;
		margin: 0 auto;
	}

	.hero {
		margin-bottom: 2rem;
	}

	.eyebrow {
		margin: 0 0 0.5rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 0.8rem;
		color: #8b5e34;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.6rem, 7vw, 5rem);
		line-height: 0.95;
	}

	.lede {
		max-width: 48rem;
		font-size: 1.1rem;
		line-height: 1.7;
		color: #443a32;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
	}

	article {
		padding: 1.25rem;
		border: 1px solid rgba(92, 62, 34, 0.14);
		border-radius: 20px;
		background: rgba(255, 252, 247, 0.76);
		backdrop-filter: blur(8px);
		box-shadow: 0 18px 40px rgba(90, 65, 38, 0.08);
	}

	h2 {
		margin-top: 0;
		font-size: 1.05rem;
	}

	ul {
		margin: 0;
		padding-left: 1.2rem;
		line-height: 1.6;
	}
</style>
