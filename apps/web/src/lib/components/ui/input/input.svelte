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
		"border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.6)_100%)] focus-visible:border-white/56 hover:border-white/48 aria-invalid:ring-destructive/20 aria-invalid:border-destructive h-10 w-full min-w-0 rounded-[calc(var(--radius)+0.45rem)] border px-3.5 py-2 text-sm text-foreground [box-shadow:0_10px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[24px] transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] file:h-7 file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/78 focus-visible:bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.68)_100%)] focus-visible:ring-[4px] focus-visible:ring-ring/28 aria-invalid:ring-[4px] outline-none file:inline-flex file:border-0 file:bg-transparent disabled:cursor-not-allowed disabled:bg-white/38 disabled:text-muted-foreground disabled:opacity-100";
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
