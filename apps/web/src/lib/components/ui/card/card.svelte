<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { size?: "default" | "sm" } = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	class={cn(
		"glass-card group/card flex flex-col gap-6 overflow-hidden rounded-[calc(var(--radius)+0.75rem)] py-6 text-sm text-card-foreground has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-[calc(var(--radius)+0.75rem)] *:[img:last-child]:rounded-b-[calc(var(--radius)+0.75rem)]",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
