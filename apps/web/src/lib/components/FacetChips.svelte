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
	class={`grid ${tone === 'secondary' ? 'gap-1.5' : 'gap-2'}`}
	aria-label={label}
>
	<p class={`m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground ${tone === 'secondary' ? 'opacity-80' : ''}`}>
		{label}
	</p>
	<div class="flex flex-wrap gap-2">
		<Button
			type="button"
			variant={activeValue === '' ? 'secondary' : 'outline'}
			size={tone === 'secondary' ? 'xs' : 'sm'}
			class="rounded-full"
			onclick={() => onselect?.('')}
		>
			全部
		</Button>

		{#each options as option (option.value)}
			<Button
				type="button"
				variant={activeValue === option.value ? 'secondary' : 'outline'}
				size={tone === 'secondary' ? 'xs' : 'sm'}
				class="rounded-full"
				onclick={() => onselect?.(option.value)}
			>
				<span>{option.label}</span>
				{#if option.count !== undefined}
					<Badge variant="outline" class="text-[0.7rem]">{option.count}</Badge>
				{/if}
			</Button>
		{/each}
	</div>
</section>
