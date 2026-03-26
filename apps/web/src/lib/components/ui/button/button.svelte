<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "group/button relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[calc(var(--radius)+0.55rem)] border text-sm font-medium outline-none select-none transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 focus-visible:border-white/60 focus-visible:ring-[4px] focus-visible:ring-ring/32 aria-invalid:border-destructive aria-invalid:ring-[4px] aria-invalid:ring-destructive/20 active:translate-y-[1px] active:scale-[0.985] backdrop-blur-[20px] [&>*]:relative [&>*]:z-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 after:pointer-events-none after:absolute after:inset-px after:rounded-[calc(var(--radius)+0.48rem)] after:bg-[linear-gradient(180deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.08)_42%,rgba(255,255,255,0)_100%)] after:content-['']",
		variants: {
			variant: {
				default:
					"border-white/22 bg-[linear-gradient(180deg,rgba(88,143,219,0.96)_0%,rgba(72,128,207,0.86)_100%)] text-primary-foreground [box-shadow:0_10px_26px_rgba(69,105,174,0.18),inset_0_1px_0_rgba(255,255,255,0.34)] hover:brightness-[1.03] hover:[box-shadow:0_16px_34px_rgba(69,105,174,0.22),inset_0_1px_0_rgba(255,255,255,0.42)]",
				outline:
					"border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.62)_100%)] text-foreground/86 [box-shadow:0_8px_20px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.44)] hover:border-white/54 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.7)_100%)] hover:text-foreground hover:[box-shadow:0_12px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] aria-expanded:border-white/52 aria-expanded:bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.7)_100%)] aria-expanded:text-foreground",
				secondary:
					"border-white/32 bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.5)_100%)] text-foreground/78 [box-shadow:0_8px_18px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.36)] hover:border-white/42 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(255,255,255,0.56)_100%)] hover:text-foreground aria-expanded:bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(255,255,255,0.56)_100%)] aria-expanded:text-foreground",
				ghost:
					"border-transparent bg-transparent text-muted-foreground [box-shadow:none] hover:border-white/28 hover:bg-white/50 hover:text-foreground aria-expanded:border-white/28 aria-expanded:bg-white/50 aria-expanded:text-foreground",
				destructive:
					"border-white/20 bg-[linear-gradient(180deg,rgba(219,94,94,0.94)_0%,rgba(198,73,73,0.86)_100%)] text-white [box-shadow:0_10px_26px_rgba(153,37,37,0.16),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-[1.02] focus-visible:border-destructive focus-visible:ring-destructive/20",
				link: "border-transparent bg-transparent px-0 text-primary [box-shadow:none] backdrop-blur-0 after:hidden hover:underline",
			},
			size: {
				default:
					"h-10 gap-2 px-4 in-data-[slot=button-group]:rounded-[calc(var(--radius)+0.3rem)] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				xs: "h-7 gap-1.5 px-2.5 text-[0.78rem] in-data-[slot=button-group]:rounded-[calc(var(--radius)+0.3rem)] [&_svg:not([class*='size-'])]:size-3.5",
				sm: "h-9 gap-1.5 px-3.5 in-data-[slot=button-group]:rounded-[calc(var(--radius)+0.3rem)]",
				lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
				icon: "size-10",
				"icon-xs": "size-7 in-data-[slot=button-group]:rounded-[calc(var(--radius)+0.3rem)] [&_svg:not([class*='size-'])]:size-3.5",
				"icon-sm": "size-9 in-data-[slot=button-group]:rounded-[calc(var(--radius)+0.3rem)]",
				"icon-lg": "size-11",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
