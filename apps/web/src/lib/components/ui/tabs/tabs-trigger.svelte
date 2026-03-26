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
		"relative inline-flex h-full flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] border border-transparent px-3.5 py-2 text-sm font-medium text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:text-foreground group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:border-primary/20 focus-visible:ring-[4px] focus-visible:ring-ring/32 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		"group-data-[variant=default]/tabs-list:data-active:border-primary/12 group-data-[variant=default]/tabs-list:data-active:bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(250,251,254,0.98)_100%)] group-data-[variant=default]/tabs-list:data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:[box-shadow:0_1px_0_rgba(255,255,255,0.76),0_10px_22px_rgba(15,23,42,0.06)]",
		"group-data-[variant=line]/tabs-list:px-0 group-data-[variant=line]/tabs-list:text-muted-foreground group-data-[variant=line]/tabs-list:data-active:border-border/78 group-data-[variant=line]/tabs-list:data-active:bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(250,251,253,0.98)_100%)] group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:[box-shadow:0_1px_0_rgba(255,255,255,0.74),0_8px_18px_rgba(15,23,42,0.05)]",
		className
	)}
	{...restProps}
/>
