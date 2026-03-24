<script lang="ts">
	type Props = {
		title: string;
		language?: string;
		content: string;
	};

	let { title, language = 'swift', content }: Props = $props();
	let copied = $state(false);

	async function copyCode() {
		if (!navigator?.clipboard) {
			return;
		}

		await navigator.clipboard.writeText(content);
		copied = true;

		setTimeout(() => {
			copied = false;
		}, 1500);
	}
</script>

<section class="block">
	<header>
		<div>
			<h3>{title}</h3>
			<p>{language}</p>
		</div>
		<button type="button" onclick={copyCode}>{copied ? 'Copied' : 'Copy code'}</button>
	</header>

	<pre><code>{content}</code></pre>
</section>

<style>
	.block {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-radius: 22px;
		border: 1px solid rgba(67, 53, 41, 0.1);
		background: #201b19;
		color: #f7efe4;
	}

	header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: center;
	}

	h3,
	p {
		margin: 0;
	}

	p {
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.72rem;
		color: rgba(247, 239, 228, 0.72);
	}

	button {
		border: 0;
		border-radius: 999px;
		background: #f3b87b;
		color: #231a16;
		padding: 0.65rem 0.95rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	pre {
		margin: 0;
		overflow-x: auto;
		font-size: 0.92rem;
		line-height: 1.6;
	}
</style>
