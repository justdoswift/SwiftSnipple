<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium tracking-[0.01em] transition-[background-color,border-color,color,box-shadow] duration-[var(--motion-fast)] ease-[cubic-bezier(0.22,1,0.36,1)] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&>svg]:size-3! focus-visible:border-white/56 focus-visible:ring-[4px] focus-visible:ring-ring/26 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none",
		variants: {
			variant: {
				default:
					"border-white/18 bg-primary/12 text-primary/92 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.24)]",
				secondary:
					"border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.5)_100%)] text-secondary-foreground [box-shadow:inset_0_1px_0_rgba(255,255,255,0.38)]",
				destructive:
					"border-white/18 bg-destructive/10 text-destructive [box-shadow:inset_0_1px_0_rgba(255,255,255,0.2)]",
				outline:
					"border-white/32 bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.46)_100%)] text-muted-foreground [box-shadow:inset_0_1px_0_rgba(255,255,255,0.34)] [a]:hover:bg-white/60 [a]:hover:text-foreground",
				ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-white/48 hover:text-foreground",
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
