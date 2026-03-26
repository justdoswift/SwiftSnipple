<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	type Props = {
		label: string;
		copiedLabel?: string;
		icon: 'code' | 'prompt';
		copied?: boolean;
		compact?: boolean;
		onclick?: () => void;
	};

	let {
		label,
		copiedLabel = '已复制',
		icon,
		copied = false,
		compact = false,
		onclick
	}: Props = $props();

	const visibleLabel = $derived(copied ? copiedLabel : label);
</script>

<Button
	type="button"
	variant={copied ? 'default' : 'outline'}
	size={compact ? 'sm' : 'default'}
	class={`copy-action rounded-full ${compact ? 'px-1.5' : 'px-2'} hover:-translate-y-px`}
	aria-label={visibleLabel}
	title={visibleLabel}
	onclick={() => onclick?.()}
>
	<span class="inline-grid size-5 place-items-center shrink-0" aria-hidden="true">
		{#if icon === 'code'}
			<svg viewBox="0 0 20 20">
				<path
					d="m7.5 5-4 5 4 5m5-10 4 5-4 5"
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
				/>
			</svg>
		{:else}
			<svg viewBox="0 0 20 20">
				<path
					d="m10 2.5 1.56 3.44L15 7.5l-3.44 1.56L10 12.5 8.44 9.06 5 7.5l3.44-1.56zM4 13l.9 1.98L6.88 16l-1.98.9L4 18.88l-.9-1.98L1.12 16l1.98-.9zm12 0 .9 1.98 1.98 1.02-1.98.9-.9 1.98-.9-1.98-1.98-.9 1.98-1.02z"
					fill="currentColor"
				/>
			</svg>
		{/if}
	</span>
	<span
		class={`overflow-hidden whitespace-nowrap text-xs font-medium transition-all duration-200 ${
			copied
				? 'max-w-20 opacity-100'
				: 'max-w-0 opacity-0 group-hover/button:max-w-20 group-hover/button:opacity-100 group-focus-visible/button:max-w-20 group-focus-visible/button:opacity-100'
		}`}
	>
		{visibleLabel}
	</span>
</Button>
