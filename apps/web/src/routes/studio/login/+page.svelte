<script lang="ts">
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

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

<main class="mx-auto grid w-full max-w-[480px]">
	<Card.Root class="surface-card">
		<Card.Header class="gap-4">
			<div class="flex items-start justify-between gap-3">
				<div>
					<Card.Title class="text-2xl font-semibold tracking-tight">登录</Card.Title>
				</div>
				<div class="surface-muted text-muted-foreground flex size-10 items-center justify-center rounded-[calc(var(--radius)-1px)]">
					<ShieldCheckIcon class="size-5" />
				</div>
			</div>
		</Card.Header>

		<Card.Content>
			<form class="grid gap-5" method="POST">
				<label class="grid gap-2">
					<span class="ui-label">管理员密码</span>
					<Input
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/>
				</label>

				{#if form?.errorMessage}
					<Alert variant="destructive">
						<AlertTitle>登录失败</AlertTitle>
						<AlertDescription>{form.errorMessage}</AlertDescription>
					</Alert>
				{/if}

				<Button type="submit" size="lg" class="w-full">
					进入 Studio
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</main>
