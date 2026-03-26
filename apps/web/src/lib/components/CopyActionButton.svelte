<script lang="ts">
	type Props = {
		label: string;
		copiedLabel?: string;
		icon: 'code' | 'prompt';
		copied?: boolean;
		compact?: boolean;
		onclick?: () => void;
	};

	let {
		label,
		copiedLabel = '已复制',
		icon,
		copied = false,
		compact = false,
		onclick
	}: Props = $props();

	const visibleLabel = $derived(copied ? copiedLabel : label);
</script>

<button
	type="button"
	class:compact
	class="copy-action liquid-glass"
	aria-label={visibleLabel}
	title={visibleLabel}
	onclick={() => onclick?.()}
>
	<span class="icon" aria-hidden="true">
		{#if icon === 'code'}
			<svg viewBox="0 0 20 20">
				<path
					d="m7.5 5-4 5 4 5m5-10 4 5-4 5"
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
				/>
			</svg>
		{:else}
			<svg viewBox="0 0 20 20">
				<path
					d="m10 2.5 1.56 3.44L15 7.5l-3.44 1.56L10 12.5 8.44 9.06 5 7.5l3.44-1.56zM4 13l.9 1.98L6.88 16l-1.98.9L4 18.88l-.9-1.98L1.12 16l1.98-.9zm12 0 .9 1.98 1.98 1.02-1.98.9-.9 1.98-.9-1.98-1.98-.9 1.98-1.02z"
					fill="currentColor"
				/>
			</svg>
		{/if}
	</span>
	<span class="copy-label">{visibleLabel}</span>
</button>

<style>
	.copy-action {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 2.05rem;
		padding: 0.34rem 0.58rem;
		border-radius: 999px;
		border: 1px solid rgba(17, 17, 17, 0.08);
		background: rgba(255, 255, 255, 0.84);
		color: rgba(17, 17, 17, 0.78);
		cursor: pointer;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			background-color 180ms ease;
	}

	.copy-action:hover,
	.copy-action:focus-visible {
		transform: translateY(-1px) scale(1.01);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.92),
			0 10px 18px rgba(17, 17, 17, 0.08);
	}

	.copy-action.compact {
		padding-inline: 0.48rem;
	}

	.icon {
		display: inline-grid;
		place-items: center;
		width: 1.28rem;
		height: 1.28rem;
		flex: 0 0 auto;
	}

	.icon svg {
		width: 0.92rem;
		height: 0.92rem;
	}

	.copy-label {
		max-width: 0;
		overflow: hidden;
		white-space: nowrap;
		opacity: 0;
		font-size: 0.73rem;
		font-weight: 600;
		transition:
			max-width 180ms ease,
			opacity 180ms ease;
	}

	.copy-action:hover .copy-label,
	.copy-action:focus-visible .copy-label,
	.copy-action[aria-label='已复制'] .copy-label {
		max-width: 5rem;
		opacity: 1;
	}
</style>
