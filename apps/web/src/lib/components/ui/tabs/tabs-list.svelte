<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const tabsListVariants = tv({
		base: "group/tabs-list surface-interactive inline-flex w-fit items-center justify-center rounded-[calc(var(--radius-control)+0.15rem)] border p-1 text-muted-foreground group-data-horizontal/tabs:min-h-11 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:gap-1.5 data-[variant=line]:border-transparent data-[variant=line]:bg-transparent data-[variant=line]:p-0 data-[variant=line]:shadow-none data-[variant=line]:before:hidden",
		variants: {
			variant: {
				default: "cn-tabs-list-variant-default",
				line: "cn-tabs-list-variant-line",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>["variant"];
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		variant = "default",
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={variant}
	class={cn(tabsListVariants({ variant }), className)}
	{...restProps}
/>
