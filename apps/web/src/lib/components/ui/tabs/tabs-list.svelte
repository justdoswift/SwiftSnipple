<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const tabsListVariants = tv({
		base: "group/tabs-list inline-flex w-fit items-center justify-center rounded-full border border-white/34 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.56)_100%)] p-1.5 text-muted-foreground [box-shadow:0_8px_18px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-[24px] group-data-horizontal/tabs:h-11 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:gap-1.5 data-[variant=line]:border-transparent data-[variant=line]:bg-transparent data-[variant=line]:p-0 data-[variant=line]:shadow-none data-[variant=line]:backdrop-blur-0",
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
