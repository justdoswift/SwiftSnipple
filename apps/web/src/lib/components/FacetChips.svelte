<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { FacetOption } from '$lib/discovery/types';

	type Props = {
		label: string;
		options: FacetOption[];
		activeValue?: string;
		tone?: 'primary' | 'secondary';
		onselect?: (value: string) => void;
	};

	let { label, options, activeValue = '', tone = 'primary', onselect }: Props = $props();
</script>

<section
	class={`grid ${tone === 'secondary' ? 'gap-2' : 'gap-2.5'}`}
	aria-label={label}
>
	<p class={`ui-label ${tone === 'secondary' ? 'opacity-80' : ''}`}>
		{label}
	</p>
	<div class="flex flex-wrap gap-2">
		<Button
			type="button"
			variant={activeValue === '' ? 'secondary' : 'outline'}
			size={tone === 'secondary' ? 'xs' : 'sm'}
			class="rounded-full px-3"
			onclick={() => onselect?.('')}
		>
			全部
		</Button>

		{#each options as option (option.value)}
			<Button
				type="button"
				variant={activeValue === option.value ? 'secondary' : 'outline'}
				size={tone === 'secondary' ? 'xs' : 'sm'}
				class="rounded-full px-3"
				onclick={() => onselect?.(option.value)}
			>
				<span>{option.label}</span>
				{#if option.count !== undefined}
					<Badge variant="secondary" class="h-5 px-1.5 text-[0.68rem]">{option.count}</Badge>
				{/if}
			</Button>
		{/each}
	</div>
</section>
