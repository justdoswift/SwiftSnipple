<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "group/button surface-interactive relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] border text-sm font-medium text-foreground outline-none select-none transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border/70 disabled:bg-muted/72 disabled:text-muted-foreground disabled:shadow-none focus-visible:border-primary/26 focus-visible:ring-[4px] focus-visible:ring-ring/40 aria-invalid:border-destructive/35 aria-invalid:ring-[4px] aria-invalid:ring-destructive/18 aria-busy:pointer-events-none aria-busy:cursor-progress active:translate-y-[1px] active:scale-[0.985] [&>*]:relative [&>*]:z-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default:
					"border-primary/14 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_82%,white_18%)_0%,color-mix(in_oklab,var(--primary)_94%,black_6%)_100%)] text-primary-foreground [box-shadow:0_1px_0_rgba(255,255,255,0.28),0_10px_24px_rgba(89,124,191,0.18)] hover:-translate-y-px hover:border-primary/18 hover:brightness-[1.02] hover:[box-shadow:0_1px_0_rgba(255,255,255,0.3),0_14px_28px_rgba(89,124,191,0.2)] active:[box-shadow:0_1px_0_rgba(255,255,255,0.18),0_4px_10px_rgba(89,124,191,0.14)]",
				outline:
					"border-border/86 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(250,251,253,0.98)_100%)] text-foreground/86 [box-shadow:var(--shadow-interactive)] hover:-translate-y-px hover:border-border hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(252,253,255,0.98)_100%)] hover:text-foreground hover:[box-shadow:0_1px_0_rgba(255,255,255,0.82),0_12px_24px_rgba(15,23,42,0.06)] aria-expanded:border-primary/18 aria-expanded:bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(250,252,255,0.98)_100%)] aria-expanded:text-foreground",
				secondary:
					"border-border/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(248,250,252,0.98)_100%)] text-foreground/78 [box-shadow:0_1px_0_rgba(255,255,255,0.76),0_6px_16px_rgba(15,23,42,0.05)] hover:-translate-y-px hover:border-border/90 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(249,251,253,0.98)_100%)] hover:text-foreground aria-expanded:border-primary/16 aria-expanded:bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(249,251,255,0.98)_100%)] aria-expanded:text-foreground",
				ghost:
					"border-transparent bg-transparent text-muted-foreground shadow-none before:hidden hover:-translate-y-px hover:border-border/75 hover:bg-white/72 hover:text-foreground aria-expanded:border-primary/14 aria-expanded:bg-white/76 aria-expanded:text-foreground active:bg-white/82",
				destructive:
					"border-destructive/16 bg-[linear-gradient(180deg,rgba(216,101,101,0.9)_0%,rgba(201,79,79,0.92)_100%)] text-white [box-shadow:0_1px_0_rgba(255,255,255,0.18),0_10px_22px_rgba(156,54,54,0.16)] hover:-translate-y-px hover:brightness-[1.01] focus-visible:border-destructive/30 focus-visible:ring-destructive/18",
				link: "border-transparent bg-transparent px-0 text-primary shadow-none before:hidden hover:underline",
			},
			size: {
				default:
					"h-10 gap-2 px-4 in-data-[slot=button-group]:rounded-[var(--radius-control)] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				xs: "h-8 gap-1.5 px-[0.6875rem] text-[0.78rem] in-data-[slot=button-group]:rounded-[var(--radius-control)] [&_svg:not([class*='size-'])]:size-3.5",
				sm: "h-9 gap-1.5 px-3.5 in-data-[slot=button-group]:rounded-[var(--radius-control)]",
				lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
				icon: "size-10",
				"icon-xs": "size-8 in-data-[slot=button-group]:rounded-[var(--radius-control)] [&_svg:not([class*='size-'])]:size-3.5",
				"icon-sm": "size-9 in-data-[slot=button-group]:rounded-[var(--radius-control)]",
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
