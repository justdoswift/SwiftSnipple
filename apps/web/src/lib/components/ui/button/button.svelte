<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[calc(var(--radius)-1px)] border border-transparent text-sm font-medium outline-none select-none transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 active:translate-y-[1px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground [box-shadow:var(--shadow-sm)] hover:bg-primary/96 hover:[box-shadow:var(--shadow-md)]",
				outline:
					"border-input bg-background/92 text-foreground/86 [box-shadow:var(--shadow-sm)] hover:border-border hover:bg-muted/72 hover:text-foreground aria-expanded:border-border aria-expanded:bg-muted/72 aria-expanded:text-foreground",
				secondary:
					"border border-border/70 bg-secondary text-secondary-foreground hover:bg-secondary/84 hover:text-foreground aria-expanded:bg-secondary aria-expanded:text-foreground",
				ghost:
					"text-muted-foreground hover:bg-muted/72 hover:text-foreground aria-expanded:bg-muted/72 aria-expanded:text-foreground",
				destructive:
					"bg-destructive text-white [box-shadow:var(--shadow-sm)] hover:brightness-[0.98] focus-visible:border-destructive focus-visible:ring-destructive/20",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default:
					"h-10 gap-2 px-4 in-data-[slot=button-group]:rounded-[calc(var(--radius)-1px)] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				xs: "h-7 gap-1.5 px-2.5 text-[0.78rem] in-data-[slot=button-group]:rounded-[calc(var(--radius)-1px)] [&_svg:not([class*='size-'])]:size-3.5",
				sm: "h-9 gap-1.5 px-3.5 in-data-[slot=button-group]:rounded-[calc(var(--radius)-1px)]",
				lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
				icon: "size-10",
				"icon-xs": "size-7 in-data-[slot=button-group]:rounded-[calc(var(--radius)-1px)] [&_svg:not([class*='size-'])]:size-3.5",
				"icon-sm": "size-9 in-data-[slot=button-group]:rounded-[calc(var(--radius)-1px)]",
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
