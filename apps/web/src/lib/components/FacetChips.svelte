<script lang="ts">
	import type { FacetOption } from '$lib/discovery/types';

	type Props = {
		label: string;
		options: FacetOption[];
		activeValue?: string;
		tone?: 'primary' | 'secondary';
		onselect?: (value: string) => void;
	};

	let { label, options, activeValue = '', tone = 'primary', onselect }: Props = $props();
</script>

<section class={`group ${tone}`} aria-label={label}>
	<p>{label}</p>
	<div class="chips">
		<button
			type="button"
			class:active={activeValue === ''}
			onclick={() => onselect?.('')}
		>
			全部
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
		gap: 0.55rem;
	}

	.group.secondary {
		gap: 0.42rem;
	}

	p {
		margin: 0;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(17, 17, 17, 0.46);
	}

	.group.secondary p {
		font-size: 0.66rem;
		color: rgba(17, 17, 17, 0.34);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	button {
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: rgba(255, 255, 255, 0.84);
		color: var(--site-text);
		border-radius: 999px;
		padding: 0.46rem 0.7rem;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		transition:
			background 180ms ease,
			border-color 180ms ease,
			color 180ms ease;
	}

	.group.secondary button {
		padding: 0.4rem 0.6rem;
		font-size: 0.76rem;
		background: rgba(255, 255, 255, 0.74);
		color: rgba(17, 17, 17, 0.62);
	}

	button:hover,
	button:focus-visible {
		border-color: rgba(0, 132, 255, 0.2);
		background: rgba(0, 132, 255, 0.08);
	}

	button.active {
		background: rgba(0, 132, 255, 0.1);
		border-color: rgba(0, 132, 255, 0.18);
		color: rgba(0, 132, 255, 0.9);
	}

	strong {
		font-size: 0.72rem;
		opacity: 0.72;
	}
</style>
