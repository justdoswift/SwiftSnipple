<script lang="ts">
	import CopyActionButton from '$lib/components/CopyActionButton.svelte';

	type Props = {
		title: string;
		kind: string;
		content: string;
	};

	let { title, kind, content }: Props = $props();
	let copied = $state(false);

	async function copyPrompt() {
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
			<p>{kind === 'prompt' ? '提示词' : kind === 'acceptance' ? '验收' : kind}</p>
		</div>
		<CopyActionButton icon="prompt" label="复制提示词" {copied} onclick={copyPrompt} />
	</header>

	<article>{content}</article>
</section>

<style>
	.block {
		display: grid;
		gap: 0.88rem;
		padding: 0.96rem;
		border-radius: 24px;
		color: var(--site-text);
		content-visibility: auto;
		contain-intrinsic-size: 260px 220px;
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
		font-size: 0.92rem;
		line-height: 1.15;
	}

	p {
		letter-spacing: 0.12em;
		font-size: 0.72rem;
		color: rgba(17, 17, 17, 0.46);
	}

	article {
		white-space: pre-wrap;
		font-size: 0.9rem;
		line-height: 1.68;
		color: rgba(17, 17, 17, 0.68);
	}
</style>
