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

	const baseInputClasses =
		"surface-interactive h-10 w-full min-w-0 rounded-[var(--radius-control)] border px-3.5 py-2 text-sm text-foreground transition-[border-color,box-shadow,background-color,color] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground/88 hover:border-border focus-visible:border-primary/22 focus-visible:bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(252,253,255,0.98)_100%)] focus-visible:ring-[4px] focus-visible:ring-ring/40 aria-invalid:border-destructive/35 aria-invalid:ring-[4px] aria-invalid:ring-destructive/18 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted/72 disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100";
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(baseInputClasses, className)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(baseInputClasses, className)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
