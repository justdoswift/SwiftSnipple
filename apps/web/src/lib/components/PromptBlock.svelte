<script lang="ts">
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

<section class="block">
	<header>
		<div>
			<h3>{title}</h3>
			<p>{kind}</p>
		</div>
		<button type="button" onclick={copyPrompt}>{copied ? 'Copied' : 'Copy prompt'}</button>
	</header>

	<article>{content}</article>
</section>

<style>
	.block {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-radius: 22px;
		border: 1px solid rgba(56, 94, 90, 0.14);
		background: rgba(241, 248, 247, 0.94);
		color: #17312f;
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
		color: #51716d;
	}

	button {
		border: 0;
		border-radius: 999px;
		background: #1f5a56;
		color: #f4f8f6;
		padding: 0.65rem 0.95rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	article {
		white-space: pre-wrap;
		line-height: 1.7;
	}
</style>
