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
		"surface-interactive flex min-h-28 w-full field-sizing-content rounded-[var(--radius-control)] border px-3.5 py-3 text-sm leading-6 text-foreground transition-[border-color,box-shadow,background-color,color] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground/84 hover:border-border focus-visible:border-primary/22 focus-visible:bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(252,253,255,0.98)_100%)] focus-visible:ring-[4px] focus-visible:ring-ring/40 aria-invalid:border-destructive/35 aria-invalid:ring-[4px] aria-invalid:ring-destructive/18 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted/72 disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100",
		className
	)}
	bind:value
	{...restProps}
></textarea>
