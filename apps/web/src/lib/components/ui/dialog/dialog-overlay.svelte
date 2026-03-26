<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay
	bind:ref
	data-slot="dialog-overlay"
	class={cn(
		"fixed inset-0 isolate z-50 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),rgba(248,250,255,0.28)_38%,rgba(20,24,31,0.12)_100%)] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-[var(--motion-normal)] supports-backdrop-filter:backdrop-blur-md",
		className
	)}
	{...restProps}
/>
