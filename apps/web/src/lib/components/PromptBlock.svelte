<script lang="ts">
	import CopyActionButton from '$lib/components/CopyActionButton.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

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

<Card.Root class="content-visibility-auto [contain-intrinsic-size:260px_220px]">
	<Card.Content class="space-y-4">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h3 class="m-0 font-(family-name:--font-display) text-sm leading-tight">{title}</h3>
			<p class="m-0 text-xs uppercase tracking-wide text-muted-foreground">
				{kind === 'prompt' ? '提示词' : kind === 'acceptance' ? '验收' : kind}
			</p>
		</div>
		<CopyActionButton icon="prompt" label="复制提示词" {copied} onclick={copyPrompt} />
	</header>

	<article class="whitespace-pre-wrap text-sm leading-7 text-foreground">{content}</article>
	</Card.Content>
</Card.Root>
