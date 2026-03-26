<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const alertVariants = tv({
		base: "group/alert surface-panel relative grid w-full gap-0.5 rounded-[var(--radius-card)] px-4 py-3.5 text-left text-sm transition-[border-color,background-color,box-shadow] duration-[var(--motion-fast)] has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default:
					"text-foreground *:data-[slot=alert-title]:text-foreground *:data-[slot=alert-description]:text-foreground/72",
				destructive:
					"border-destructive/18 bg-[linear-gradient(180deg,rgba(255,246,246,0.98)_0%,rgba(255,241,241,0.96)_100%)] text-destructive shadow-none *:data-[slot=alert-title]:text-destructive *:data-[slot=alert-description]:text-destructive/82",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert"
	role="alert"
	class={cn(alertVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
