<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { logoutAdmin } from '$lib/studio/api';

	let { children, data } = $props();

	async function handleLogout() {
		await logoutAdmin(fetch);
		await goto('/studio/login');
	}
</script>

{#if page.url.pathname === '/studio/login'}
	<div class="studio-login-shell">
		{#if data.sessionError}
			<div class="studio-alert" role="status">
				<strong>后台服务暂时不可用。</strong>
				<span>{data.sessionError}</span>
			</div>
		{/if}
		{@render children()}
	</div>
{:else}
	<div class="studio-shell">
		<header class="studio-header">
			<div>
				<p class="eyebrow">SwiftSnippet Studio</p>
				<h1>内部运营台</h1>
			</div>
			<nav class="studio-nav" aria-label="后台导航">
				<a class:active={page.url.pathname === '/studio'} href="/studio">总览</a>
				<a class:active={page.url.pathname.startsWith('/studio/snippets')} href="/studio/snippets">
					内容管理
				</a>
			</nav>
			<div class="studio-session">
				<span>{data.session.username}</span>
				<button type="button" onclick={handleLogout}>退出登录</button>
			</div>
		</header>

		<div class="studio-content">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.studio-login-shell {
		min-height: 100vh;
		display: grid;
		align-content: center;
		gap: 1rem;
		padding: 1.25rem;
	}

	.studio-alert {
		width: min(30rem, 100%);
		margin: 0 auto;
		display: grid;
		gap: 0.24rem;
		padding: 0.9rem 1rem;
		border-radius: 20px;
		border: 1px solid rgba(191, 31, 70, 0.12);
		background: rgba(191, 31, 70, 0.05);
		color: rgba(120, 18, 44, 0.94);
		box-shadow: 0 10px 22px rgba(191, 31, 70, 0.06);
	}

	.studio-alert strong,
	.studio-alert span {
		margin: 0;
	}

	.studio-shell {
		width: min(1560px, calc(100vw - 2rem));
		margin: 0 auto;
		padding: 6.4rem 0 3rem;
		display: grid;
		gap: 1rem;
	}

	.studio-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 1rem;
		align-items: center;
		padding: 1rem 1.1rem;
		border-radius: 24px;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(17, 17, 17, 0.06);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.95),
			0 16px 32px rgba(17, 17, 17, 0.05);
	}

	.eyebrow,
	h1 {
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
		font-size: 1.36rem;
	}

	.studio-nav,
	.studio-session {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.studio-nav a,
	.studio-session button {
		padding: 0.64rem 0.82rem;
		border-radius: 999px;
		border: 1px solid rgba(17, 17, 17, 0.08);
		background: white;
		text-decoration: none;
		color: rgba(17, 17, 17, 0.72);
		font-weight: 600;
		cursor: pointer;
	}

	.studio-nav a.active {
		background: rgba(0, 132, 255, 0.08);
		color: rgba(0, 132, 255, 0.9);
		border-color: rgba(0, 132, 255, 0.16);
	}

	.studio-session span {
		font-size: 0.84rem;
		color: rgba(17, 17, 17, 0.54);
	}

	@media (max-width: 900px) {
		.studio-shell {
			width: calc(100vw - 1rem);
			padding-top: 5.8rem;
		}

		.studio-header {
			grid-template-columns: 1fr;
		}
	}
</style>
