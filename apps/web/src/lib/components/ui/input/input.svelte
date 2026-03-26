<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		"data-slot": dataSlot = "input",
		...restProps
	}: Props = $props();
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"border-input bg-background/92 focus-visible:border-ring hover:border-border aria-invalid:ring-destructive/20 aria-invalid:border-destructive h-10 w-full min-w-0 rounded-[calc(var(--radius)-1px)] border px-3.5 py-2 text-sm text-foreground [box-shadow:var(--shadow-sm)] transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] file:h-7 file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/90 focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-invalid:ring-[3px] outline-none file:inline-flex file:border-0 file:bg-transparent disabled:cursor-not-allowed disabled:bg-muted/55 disabled:text-muted-foreground disabled:opacity-100",
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"border-input bg-background/92 focus-visible:border-ring hover:border-border aria-invalid:ring-destructive/20 aria-invalid:border-destructive h-10 w-full min-w-0 rounded-[calc(var(--radius)-1px)] border px-3.5 py-2 text-sm text-foreground [box-shadow:var(--shadow-sm)] transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] file:h-7 file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/90 focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-invalid:ring-[3px] outline-none file:inline-flex file:border-0 file:bg-transparent disabled:cursor-not-allowed disabled:bg-muted/55 disabled:text-muted-foreground disabled:opacity-100",
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
