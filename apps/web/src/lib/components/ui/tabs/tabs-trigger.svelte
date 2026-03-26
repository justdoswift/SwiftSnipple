<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"relative inline-flex h-full flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius)-2px)] border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-[background-color,border-color,color,box-shadow] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		"group-data-[variant=default]/tabs-list:data-active:border-border/70 group-data-[variant=default]/tabs-list:data-active:bg-card group-data-[variant=default]/tabs-list:data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:[box-shadow:var(--shadow-sm)]",
		"group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-0 group-data-[variant=line]/tabs-list:text-muted-foreground group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:[box-shadow:none]",
		"after:absolute after:opacity-0 after:transition-opacity after:duration-[var(--motion-fast)] group-data-[orientation=horizontal]/tabs:after:inset-x-1 group-data-[orientation=horizontal]/tabs:after:bottom-[-1px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-1 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:after:bg-primary/55 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
		className
	)}
	{...restProps}
/>
