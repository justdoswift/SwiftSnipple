<script lang="ts">
	type Props = {
		form?: {
			errorMessage?: string;
		};
	};

	let { form }: Props = $props();
</script>

<svelte:head>
	<title>Studio Login | SwiftSnippet</title>
</svelte:head>

<main class="login-page">
	<form class="login-card" method="POST">
		<p class="eyebrow">Studio Access</p>
		<h1>内部运营台登录</h1>
		<p>输入管理员密码后，进入内容录入、校验与发布后台。</p>

		<label>
			<span>管理员密码</span>
			<input name="password" type="password" autocomplete="current-password" required />
		</label>

		{#if form?.errorMessage}
			<p class="error">{form.errorMessage}</p>
		{/if}

		<button type="submit">登录</button>
	</form>
</main>

<style>
	.login-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 2rem;
	}

	.login-card {
		width: min(30rem, 100%);
		display: grid;
		gap: 0.9rem;
		padding: 1.4rem;
		border-radius: 28px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(17, 17, 17, 0.06);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.95),
			0 18px 36px rgba(17, 17, 17, 0.06);
	}

	.eyebrow,
	h1,
	p {
		margin: 0;
	}

	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(17, 17, 17, 0.48);
	}

	h1 {
		font-family: var(--font-display);
		font-size: 1.9rem;
	}

	p {
		color: rgba(17, 17, 17, 0.62);
	}

	label {
		display: grid;
		gap: 0.48rem;
	}

	label span {
		font-size: 0.84rem;
		font-weight: 600;
	}

	input,
	button {
		font: inherit;
	}

	input {
		padding: 0.9rem 1rem;
		border-radius: 16px;
		border: 1px solid rgba(17, 17, 17, 0.08);
		background: white;
	}

	button {
		padding: 0.92rem 1rem;
		border: 0;
		border-radius: 16px;
		background: rgba(0, 132, 255, 0.92);
		color: white;
		font-weight: 700;
		cursor: pointer;
	}

	.error {
		color: #bf1f46;
	}
</style>
