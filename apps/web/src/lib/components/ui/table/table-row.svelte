<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		"border-b border-border/64 transition-[background-color,border-color,box-shadow] duration-[var(--motion-fast)] hover:border-border/90 hover:bg-[color-mix(in_oklab,var(--background)_82%,white_18%)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)] data-[state=selected]:border-primary/18 data-[state=selected]:bg-[color-mix(in_oklab,var(--primary)_8%,white_92%)]",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
