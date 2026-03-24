<script lang="ts">
	import type { FacetOption } from '$lib/discovery/types';

	type Props = {
		label: string;
		options: FacetOption[];
		activeValue?: string;
		onselect?: (value: string) => void;
	};

	let { label, options, activeValue = '', onselect }: Props = $props();
</script>

<section class="group" aria-label={label}>
	<p>{label}</p>
	<div class="chips">
		<button
			type="button"
			class:active={activeValue === ''}
			onclick={() => onselect?.('')}
		>
			All
		</button>

		{#each options as option (option.value)}
			<button
				type="button"
				class:active={activeValue === option.value}
				onclick={() => onselect?.(option.value)}
			>
				<span>{option.label}</span>
				{#if option.count !== undefined}
					<strong>{option.count}</strong>
				{/if}
			</button>
		{/each}
	</div>
</section>

<style>
	.group {
		display: grid;
		gap: 0.65rem;
	}

	p {
		margin: 0;
		font-size: 0.76rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: #6d5b4e;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	button {
		border: 1px solid rgba(86, 57, 40, 0.12);
		background: rgba(255, 251, 244, 0.78);
		color: #2d2621;
		border-radius: 999px;
		padding: 0.55rem 0.85rem;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font: inherit;
		cursor: pointer;
	}

	button.active {
		background: #1e4f4b;
		border-color: #1e4f4b;
		color: #f8f2e9;
	}

	strong {
		font-size: 0.78rem;
		opacity: 0.8;
	}
</style>
