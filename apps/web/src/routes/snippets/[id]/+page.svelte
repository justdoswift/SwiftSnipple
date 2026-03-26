<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import {
		categoryLabel,
		demoAvailabilityLabel,
		difficultyLabel,
		platformLabel,
		promptAvailabilityLabel
	} from '$lib/discovery/presentation';
	import PromptBlock from '$lib/components/PromptBlock.svelte';
	import SnippetPreviewMedia from '$lib/components/SnippetPreviewMedia.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import type { PublishedSnippetRecord } from '$lib/discovery/types';

	type DetailData =
		| {
				notPublic: true;
				id: string;
		  }
		| {
				notPublic: false;
				snippet: PublishedSnippetRecord;
		  };

	type Props = {
		data: DetailData;
	};

	let { data }: Props = $props();
	let activeTab = $state<'demo' | 'code' | 'prompt' | 'license'>('demo');
</script>

<svelte:head>
	<title>
		{data.notPublic ? '内容未公开 - SwiftSnippet' : `${data.snippet.title} - SwiftSnippet`}
	</title>
</svelte:head>

{#if data.notPublic}
	<main class="mx-auto grid min-h-screen w-[min(var(--page-width),calc(100vw-3rem))] items-center px-[clamp(1rem,2.2vw,1.8rem)] py-16">
		<Card.Root class="blocked-card">
			<Card.Content class="space-y-4">
			<p class="section-kicker">公开可见性</p>
			<h1>内容未公开</h1>
			<p class="section-copy">
				这个 slug 当前不在公开列表中。可以回到首页或 Explore，继续浏览已发布片段。
			</p>
			<div class="actions">
				<Button href="/" variant="outline" size="sm">返回首页</Button>
				<Button href="/explore" variant="outline" size="sm">去发现页</Button>
			</div>
			</Card.Content>
		</Card.Root>
	</main>
{:else}
	{@const snippet = data.snippet}
	{@const promptBlocks = snippet.promptBlocks.filter((block) => block.kind === 'prompt')}
	{@const acceptanceBlocks = snippet.promptBlocks.filter((block) => block.kind !== 'prompt')}

	<main class="page">
		<div class="mb-4 flex flex-wrap gap-3">
			<Button href="/" variant="ghost" size="sm">返回首页</Button>
			<Button href="/explore" variant="ghost" size="sm">继续发现</Button>
		</div>

		<section class="grid items-start gap-4 min-[901px]:grid-cols-[minmax(280px,0.78fr)_minmax(560px,1.22fr)]">
			<div class="px-1 pt-1">
				<p class="section-kicker">{categoryLabel(snippet.categoryPrimary)}</p>
				<h1 class="section-title page-title">{snippet.title}</h1>
				<p class="summary section-copy">{snippet.summary}</p>

				<div class="m-0 flex flex-wrap gap-2">
					<Badge variant="outline">{difficultyLabel(snippet.difficulty)}</Badge>
					<Badge variant="outline">{demoAvailabilityLabel(snippet.hasDemo)}</Badge>
					<Badge variant="outline">{promptAvailabilityLabel(snippet.hasPrompt)}</Badge>
				</div>

				<div class="grid gap-2 border-t pt-3">
					<div class="m-0 flex flex-wrap gap-2">
						{#each snippet.platforms as platform (`${platform.os}-${platform.minVersion}`)}
							<Badge variant="outline">{platformLabel(platform)}</Badge>
						{/each}
					</div>

					<ul class="m-0 flex flex-wrap gap-2 p-0">
						{#each snippet.tags as tag (tag)}
							<li><Badge variant="outline">{tag}</Badge></li>
						{/each}
					</ul>
				</div>
			</div>

			<Card.Root class="media-panel">
				<Card.Content class="p-3">
				<SnippetPreviewMedia
					id={snippet.id}
					coverUrl={snippet.media.coverUrl}
					demoUrl={undefined}
					eyebrow={categoryLabel(snippet.categoryPrimary)}
					metaText={`${difficultyLabel(snippet.difficulty)} · ${promptAvailabilityLabel(snippet.hasPrompt)}`}
					className="block min-h-[25.5rem] w-full rounded-[20px] bg-card object-cover"
					alt={`${snippet.title} 预览图`}
					loading="eager"
				/>
				</Card.Content>
			</Card.Root>
		</section>

		<Card.Root class="mt-3">
			<Card.Content>
				<Tabs.Root bind:value={activeTab} class="grid gap-3">
					<Tabs.List variant="line" class="no-scrollbar flex flex-nowrap overflow-x-auto pb-1" aria-label="片段详情标签页">
						<Tabs.Trigger value="demo">演示</Tabs.Trigger>
						<Tabs.Trigger value="code">代码</Tabs.Trigger>
						{#if snippet.hasPrompt}
							<Tabs.Trigger value="prompt">提示词</Tabs.Trigger>
						{/if}
						<Tabs.Trigger value="license">许可</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="demo">
						<div class="grid items-end gap-4 min-[901px]:grid-cols-[minmax(0,1.24fr)_minmax(15rem,0.76fr)]">
							<SnippetPreviewMedia
								id={snippet.id}
								coverUrl={snippet.media.coverUrl}
								demoUrl={undefined}
								eyebrow={categoryLabel(snippet.categoryPrimary)}
								metaText={`${difficultyLabel(snippet.difficulty)} · ${demoAvailabilityLabel(snippet.hasDemo)}`}
								className="block min-h-[18rem] w-full rounded-[20px] bg-card object-cover"
								alt={`${snippet.title} 详情封面`}
								loading="eager"
							/>
							<Card.Root>
								<Card.Content>
							<p class="section-copy">
								这里集中放演示、源码、提示词和许可，方便你判断能不能直接拿去用。
							</p>
								</Card.Content>
							</Card.Root>
						</div>
					</Tabs.Content>
					<Tabs.Content value="code">
						<div class="grid gap-3">
							{#each snippet.codeBlocks as block (block.id)}
								<CodeBlock title={block.filename} language={block.language} content={block.content} />
							{/each}
						</div>
					</Tabs.Content>
					{#if snippet.hasPrompt}
						<Tabs.Content value="prompt">
						<div class="grid gap-3">
							{#each promptBlocks as block (block.id)}
								<PromptBlock title="提示词模板" kind={block.kind} content={block.content} />
							{/each}
							{#each acceptanceBlocks as block (block.id)}
								<PromptBlock title="验收清单" kind={block.kind} content={block.content} />
							{/each}
						</div>
						</Tabs.Content>
					{/if}
					<Tabs.Content value="license">
						<div class="grid gap-3 min-[901px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
							<Card.Root class="license-card">
								<Card.Content class="space-y-4">
								<p class="section-kicker">许可</p>
								<h2 class="section-title">复用边界</h2>
								<ul>
									<li>代码：{snippet.license.code}</li>
									<li>媒体：{snippet.license.media}</li>
									<li>第三方声明：{snippet.license.thirdPartyNotice}</li>
								</ul>
								</Card.Content>
							</Card.Root>

							<Card.Root class="license-card">
								<Card.Content class="space-y-4">
								<p class="section-kicker">依赖</p>
								<h2 class="section-title">运行环境</h2>
								{#if snippet.dependencies.length > 0}
									<ul>
										{#each snippet.dependencies as dependency (dependency)}
											<li>{dependency}</li>
										{/each}
									</ul>
								{:else}
									<p class="section-copy">没有额外披露的运行依赖。</p>
								{/if}
								</Card.Content>
							</Card.Root>
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</Card.Content>
		</Card.Root>
	</main>
{/if}
