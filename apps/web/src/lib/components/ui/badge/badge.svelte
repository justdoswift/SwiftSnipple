<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-[0.72rem] font-medium tracking-[0.01em] transition-[background-color,border-color,color,box-shadow] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&>svg]:size-3! focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none",
		variants: {
			variant: {
				default: "bg-primary/10 text-primary ring-1 ring-primary/10",
				secondary: "bg-secondary text-secondary-foreground ring-1 ring-border/55",
				destructive: "bg-destructive/10 text-destructive ring-1 ring-destructive/10",
				outline: "border-border/70 bg-background/75 text-muted-foreground [a]:hover:bg-muted/70 [a]:hover:text-foreground",
				ghost: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
