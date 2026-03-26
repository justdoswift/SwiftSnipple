<script lang="ts">
	import CopyActionButton from '$lib/components/CopyActionButton.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

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

<Card.Root class="content-visibility-auto [contain-intrinsic-size:280px_220px]">
	<Card.Content class="space-y-4">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h3 class="m-0 font-(family-name:--font-display) text-sm leading-tight">{title}</h3>
			<p class="m-0 text-xs uppercase tracking-wide text-muted-foreground">{language}</p>
		</div>
		<CopyActionButton icon="code" label="复制代码" {copied} onclick={copyCode} />
	</header>

	<pre class="m-0 overflow-x-auto pt-0.5 text-sm leading-6 text-foreground"><code class="font-mono">{content}</code></pre>
	</Card.Content>
</Card.Root>
