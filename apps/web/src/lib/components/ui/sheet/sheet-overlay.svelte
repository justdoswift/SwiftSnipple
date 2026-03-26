<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SheetPrimitive.OverlayProps = $props();
</script>

<SheetPrimitive.Overlay
	bind:ref
	data-slot="sheet-overlay"
	class={cn(
		"fixed inset-0 isolate z-50 bg-[linear-gradient(180deg,rgba(251,250,247,0.42)_0%,rgba(244,247,252,0.58)_100%)] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-[var(--motion-normal)] supports-backdrop-filter:backdrop-blur-sm",
		className
	)}
	{...restProps}
/>
