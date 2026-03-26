<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: "sm" | "default";
	} = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	class={cn(
		"flex w-fit items-center justify-between gap-1.5 whitespace-nowrap rounded-[calc(var(--radius)-1px)] border border-input bg-background/92 py-2 pr-3 pl-3.5 text-sm text-foreground [box-shadow:var(--shadow-sm)] transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] data-placeholder:text-muted-foreground/90 hover:border-border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-[size=default]:h-10 data-[size=sm]:h-9 outline-none disabled:cursor-not-allowed disabled:bg-muted/55 disabled:text-muted-foreground disabled:opacity-100 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="text-muted-foreground size-4 pointer-events-none" />
</SelectPrimitive.Trigger>
