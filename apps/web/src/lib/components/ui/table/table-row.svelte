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
		"border-b border-white/16 transition-[background-color,border-color] hover:border-white/24 hover:bg-white/42 data-[state=selected]:border-white/28 data-[state=selected]:bg-white/54",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
