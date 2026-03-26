<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "group/badge inline-flex h-7 w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border px-[0.6875rem] py-0.5 text-[0.72rem] font-semibold tracking-[0.02em] transition-[background-color,border-color,color,box-shadow] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&>svg]:size-3! focus-visible:border-primary/24 focus-visible:ring-[4px] focus-visible:ring-ring/32 aria-invalid:border-destructive/30 aria-invalid:ring-destructive/18 [&>svg]:pointer-events-none",
		variants: {
			variant: {
				default:
					"border-primary/12 bg-primary/[0.085] text-primary [box-shadow:inset_0_1px_0_rgba(255,255,255,0.46)]",
				secondary:
					"border-border/78 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(248,250,252,0.98)_100%)] text-secondary-foreground [box-shadow:0_1px_0_rgba(255,255,255,0.72)]",
				destructive:
					"border-destructive/16 bg-destructive/[0.08] text-destructive [box-shadow:inset_0_1px_0_rgba(255,255,255,0.3)]",
				outline:
					"border-border/76 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(249,250,252,0.98)_100%)] text-muted-foreground [box-shadow:0_1px_0_rgba(255,255,255,0.68)] [a]:hover:bg-white/70 [a]:hover:text-foreground",
				ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-white/56 hover:text-foreground",
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
