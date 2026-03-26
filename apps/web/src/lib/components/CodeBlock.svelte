<script lang="ts">
	import CopyActionButton from '$lib/components/CopyActionButton.svelte';

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

<section class="block content-surface">
	<header>
		<div>
			<h3>{title}</h3>
			<p>{language}</p>
		</div>
		<CopyActionButton icon="code" label="复制代码" {copied} onclick={copyCode} />
	</header>

	<pre><code>{content}</code></pre>
</section>

<style>
	.block {
		display: grid;
		gap: 0.88rem;
		padding: 0.92rem;
		border-radius: 24px;
		color: var(--site-text);
		content-visibility: auto;
		contain-intrinsic-size: 280px 220px;
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

	h3 {
		font-family: var(--font-display);
		font-size: 0.9rem;
		line-height: 1.15;
	}

	p {
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.72rem;
		color: rgba(17, 17, 17, 0.46);
	}

	pre {
		margin: 0;
		overflow-x: auto;
		padding-top: 0.2rem;
		font-size: 0.84rem;
		line-height: 1.6;
		color: rgba(17, 17, 17, 0.86);
	}

	pre code {
		font-family:
			"SF Mono", "SFMono-Regular", "JetBrains Mono", "IBM Plex Mono", "Menlo", monospace;
	}
</style>
