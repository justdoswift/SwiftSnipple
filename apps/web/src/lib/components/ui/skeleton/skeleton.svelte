<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="skeleton"
	class={cn(
		"animate-pulse rounded-[var(--radius-control)] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(244,247,251,0.94)_100%)]",
		className
	)}
	{...restProps}
></div>
