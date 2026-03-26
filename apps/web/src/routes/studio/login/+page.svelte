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

<main class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
	<Card.Root class="studio-surface rounded-[32px] border-white/70 shadow-[0_20px_48px_rgba(15,23,42,0.06)]">
		<Card.Header class="gap-4 p-7 md:p-8">
			<Badge variant="outline" class="w-fit rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
				SwiftSnippet / Studio
			</Badge>
			<div class="space-y-3">
				<Card.Title
					class="text-4xl tracking-[-0.06em] text-slate-950 md:text-[3.35rem]"
					style="font-family: var(--font-display)"
				>
					内部运营台
				</Card.Title>
				<Card.Description class="max-w-2xl text-[15px] leading-7 text-slate-600">
					登录后进入内容录入、补媒体、运行校验和发布链路。这里是内部工作区，不承载公开站的品牌噪音。
				</Card.Description>
			</div>
		</Card.Header>

		<Card.Content class="grid gap-4 px-7 pb-7 md:grid-cols-2 md:px-8">
			<div class="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-xs">
				<p class="text-sm font-semibold tracking-[-0.02em] text-slate-900">文件协议优先</p>
				<p class="mt-2 text-sm leading-6 text-slate-500">
					保存动作直接写回 `content/snippets`，不再维护一套独立 CMS 真相。
				</p>
			</div>
			<div class="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-xs">
				<p class="text-sm font-semibold tracking-[-0.02em] text-slate-900">发布动作集中</p>
				<p class="mt-2 text-sm leading-6 text-slate-500">
					Review 与 Publish 都在同一工作台里完成，减少上下文切换。
				</p>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="studio-surface rounded-[32px] border-white/70 shadow-[0_20px_48px_rgba(15,23,42,0.05)]">
		<Card.Header class="gap-4 p-7">
			<div class="flex items-start justify-between gap-3">
				<div>
					<Badge variant="outline" class="rounded-full border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-500">
						Studio Access
					</Badge>
					<Card.Title
						class="mt-4 text-[2rem] tracking-[-0.05em] text-slate-950"
						style="font-family: var(--font-display)"
					>
						登录
					</Card.Title>
					<Card.Description class="mt-2 text-sm leading-6 text-slate-600">
						输入管理员密码后进入后台。
					</Card.Description>
				</div>
				<div class="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
					<ShieldCheckIcon class="size-5" />
				</div>
			</div>
		</Card.Header>

		<Card.Content class="px-7 pb-7">
			<form class="grid gap-5" method="POST">
				<label class="grid gap-2">
					<span class="text-[0.76rem] font-semibold tracking-[0.06em] text-slate-500 uppercase">
						管理员密码
					</span>
					<Input
						name="password"
						type="password"
						autocomplete="current-password"
						required
						class="h-12 rounded-2xl border-slate-200 bg-white text-base shadow-none"
					/>
				</label>

				{#if form?.errorMessage}
					<Alert variant="destructive" class="rounded-[24px] border-rose-200 bg-rose-50/90 text-rose-700 shadow-none">
						<AlertTitle>登录失败</AlertTitle>
						<AlertDescription>{form.errorMessage}</AlertDescription>
					</Alert>
				{/if}

				<Button type="submit" class="h-12 rounded-2xl text-sm font-semibold shadow-none">
					进入 Studio
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</main>
