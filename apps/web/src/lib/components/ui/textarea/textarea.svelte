<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		"data-slot": dataSlot = "textarea",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"border-input bg-background/92 focus-visible:border-ring hover:border-border aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex min-h-24 w-full field-sizing-content rounded-[calc(var(--radius)-1px)] border px-3.5 py-3 text-sm text-foreground [box-shadow:var(--shadow-sm)] transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground/90 focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-invalid:ring-[3px] outline-none disabled:cursor-not-allowed disabled:bg-muted/55 disabled:text-muted-foreground disabled:opacity-100",
		className
	)}
	bind:value
	{...restProps}
></textarea>
