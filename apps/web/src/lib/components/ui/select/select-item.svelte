<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: WithoutChild<SelectPrimitive.ItemProps> = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	{value}
	data-slot="select-item"
	class={cn(
		"relative flex w-full cursor-default items-center gap-2 rounded-[calc(var(--radius)-4px)] py-2 pr-8 pl-2.5 text-sm text-foreground/88 outline-hidden select-none transition-[background-color,color] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{#snippet children({ selected, highlighted })}
		<span class="absolute end-2 flex size-3.5 items-center justify-center">
			{#if selected}
				<CheckIcon class="cn-select-item-indicator-icon" />
			{/if}
		</span>
		{#if childrenProp}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>
