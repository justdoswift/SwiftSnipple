import { Button, Card, Chip, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DiscoveryApiError, loadSnippetDetail } from '../lib/api/discovery';
import type { PublishedSnippetRecord } from '../lib/types/discovery';
import { categoryLabel, difficultyLabel, formatDate } from '../lib/utils/format';

type DetailTab = 'code' | 'prompt' | 'license';

async function copyText(value: string) {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value);
			return true;
		} catch {
			// Fall through to the legacy copy path below.
		}
	}

	const textarea = document.createElement('textarea');
	textarea.value = value;
	textarea.setAttribute('readonly', 'true');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	textarea.style.pointerEvents = 'none';
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();
	textarea.setSelectionRange(0, value.length);

	try {
		return document.execCommand('copy');
	} finally {
		document.body.removeChild(textarea);
	}
}

export function SnippetDetailPage() {
	const navigate = useNavigate();
	const { id = '' } = useParams();
	const [tab, setTab] = useState<DetailTab>('code');
	const [record, setRecord] = useState<PublishedSnippetRecord | null>(null);
	const [copyStatus, setCopyStatus] = useState<string | null>(null);
	const [notPublic, setNotPublic] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleCopy = async (value: string | undefined, successText: string) => {
		if (!value) {
			setCopyStatus('当前没有可复制的内容');
			return;
		}

		try {
			const copied = await copyText(value);
			setCopyStatus(copied ? successText : '复制失败，请手动选择内容后再试');
		} catch {
			setCopyStatus('复制失败，请手动选择内容后再试');
		}
	};

	useEffect(() => {
		let active = true;

		void (async () => {
			try {
				setLoading(true);
				setError(null);
				setNotPublic(false);
				const detail = await loadSnippetDetail(id);
				if (active) {
					setRecord(detail);
				}
			} catch (fetchError) {
				if (active) {
					if (
						fetchError instanceof DiscoveryApiError &&
						(fetchError.status === 404 ||
							(fetchError.status === 403 && fetchError.code === 'not_public'))
					) {
						setNotPublic(true);
					} else {
						setError(fetchError instanceof Error ? fetchError.message : '详情页加载失败');
					}
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		})();

		return () => {
			active = false;
		};
	}, [id]);

	const activePrompt = useMemo(
		() => record?.promptBlocks.find((item) => item.kind === 'prompt') ?? record?.promptBlocks[0],
		[record]
	);

	if (loading) {
		return (
			<main className="page-shell">
				<div className="surface-panel flex items-center gap-3 rounded-full px-5 py-3">
					<Spinner size="sm" />
					<span className="text-sm text-[var(--app-muted)]">正在打开片段详情…</span>
				</div>
			</main>
		);
	}

	if (notPublic) {
		return (
			<main className="page-shell">
				<Card className="surface-panel rounded-[36px]">
					<Card.Content className="grid gap-5 p-8 lg:grid-cols-[1fr_auto] lg:items-end">
						<div>
							<p className="eyebrow">Not public</p>
							<h1 className="display-title mt-3 text-5xl">内容未公开</h1>
							<p className="subtle-text mt-4 max-w-2xl">
								这个 snippet 还没进入公开索引，或者已经从发现流里撤下。你可以先回到首页继续看当前可用内容。
							</p>
						</div>
						<Button className="bg-[var(--app-accent)] text-white" onPress={() => navigate('/')}>
							回首页
						</Button>
					</Card.Content>
				</Card>
			</main>
		);
	}

	if (!record || error) {
		return (
			<main className="page-shell">
				<Card className="surface-panel rounded-[var(--app-radius-xl)]">
					<Card.Content className="p-6 text-[var(--app-danger)]">{error ?? '未找到内容'}</Card.Content>
				</Card>
			</main>
		);
	}

	return (
		<main className="page-shell page-grid pb-10" id="main-content">
			<Card className="surface-panel surface-panel-strong overflow-hidden rounded-[36px] p-2">
				<Card.Content className="grid gap-6 p-4 lg:grid-cols-[1.1fr_0.9fr]">
					<div
						className="card-media min-h-[420px]"
						style={{
							backgroundImage: `linear-gradient(180deg, rgba(27,23,19,0.06), rgba(27,23,19,0.42)), url(${record.media.coverUrl})`
						}}
					/>
					<div className="grid gap-5">
						<div className="flex flex-wrap gap-2">
							<Chip className="bg-[var(--app-accent-soft)] text-[var(--app-accent-deep)]">
								{categoryLabel(record.categoryPrimary)}
							</Chip>
							<Chip className="bg-white/80 text-[var(--app-muted)]">
								{difficultyLabel(record.difficulty)}
							</Chip>
							<Chip className="bg-white/80 text-[var(--app-muted)]">
								{formatDate(record.publishedAt)}
							</Chip>
						</div>
						<div>
							<p className="eyebrow">片段详情</p>
							<h1 className="display-title mt-3 text-5xl text-balance">{record.title}</h1>
							<p className="subtle-text mt-4 text-lg">{record.summary}</p>
						</div>
						<div className="flex flex-wrap gap-2">
							{record.tags.map((tag) => (
								<Chip key={tag} className="border border-black/8 bg-transparent text-[var(--app-muted)]">
									#{tag}
								</Chip>
							))}
						</div>
						<div className="grid gap-3 rounded-[24px] bg-white/68 p-4">
							<div className="flex justify-between gap-3 text-sm text-[var(--app-muted)]">
								<span>代码块</span>
								<span>{record.codeBlocks.length}</span>
							</div>
							<div className="flex justify-between gap-3 text-sm text-[var(--app-muted)]">
								<span>Prompt / 验收</span>
								<span>{record.promptBlocks.length}</span>
							</div>
							<div className="flex justify-between gap-3 text-sm text-[var(--app-muted)]">
								<span>依赖</span>
								<span>{record.dependencies.length || '无额外依赖'}</span>
							</div>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button className="bg-[var(--app-accent)] text-white" onPress={() => navigate('/explore')}>
								全部片段
							</Button>
							<Button
								className="bg-white/75"
								onPress={() => void handleCopy(record.codeBlocks[0]?.content, '已复制主代码块')}
							>
								复制主代码块
							</Button>
						</div>
					</div>
				</Card.Content>
			</Card>

			{copyStatus ? (
				<div
					aria-live="polite"
					className="rounded-[18px] bg-white/72 px-5 py-4 text-sm text-[var(--app-muted)]"
					role="status"
				>
					{copyStatus}
				</div>
			) : null}

			<div className="flex flex-wrap gap-3" role="tablist" aria-label="片段详情标签页">
				{[
					['code', '源码'],
					['prompt', 'Prompt'],
					['license', '许可']
				].map(([value, label]) => (
					<button
						aria-controls={`detail-panel-${value}`}
						aria-selected={tab === value}
						key={value}
						className={
							tab === value
								? 'rounded-full bg-[var(--app-accent)] px-4 py-2 text-sm text-white'
								: 'rounded-full bg-white/72 px-4 py-2 text-sm text-[var(--app-ink)]'
						}
						id={`detail-tab-${value}`}
						onClick={() => setTab(value as DetailTab)}
						role="tab"
						type="button"
					>
						{label}
					</button>
				))}
			</div>

			{tab === 'code' ? (
				<div className="grid gap-5" id="detail-panel-code" role="tabpanel" aria-labelledby="detail-tab-code">
					{record.codeBlocks.map((block) => (
						<Card key={block.id} className="surface-panel rounded-[var(--app-radius-xl)]">
							<Card.Header className="flex flex-wrap items-center justify-between gap-3 p-5 pb-0">
								<div>
									<p className="m-0 text-sm font-semibold">{block.filename}</p>
									<p className="m-0 text-sm text-[var(--app-muted)]">{block.language}</p>
								</div>
								<Button
									className="bg-white/72"
									onPress={() => void handleCopy(block.content, `已复制 ${block.filename}`)}
								>
									复制
								</Button>
							</Card.Header>
							<Card.Content className="p-5">
								<pre className="mono-block">{block.content}</pre>
							</Card.Content>
						</Card>
					))}
				</div>
			) : null}

			{tab === 'prompt' ? (
				<div className="grid gap-5" id="detail-panel-prompt" role="tabpanel" aria-labelledby="detail-tab-prompt">
					{record.promptBlocks.map((block) => (
						<Card key={block.id} className="surface-panel rounded-[var(--app-radius-xl)]">
							<Card.Content className="grid gap-4 p-5">
								<div className="flex items-center justify-between gap-3">
									<p className="m-0 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--app-accent)]">
										{block.kind}
									</p>
									<Button
										className="bg-white/72"
										onPress={() => void handleCopy(block.content, `已复制 ${block.kind}`)}
									>
										复制
									</Button>
								</div>
								<div className="rounded-[18px] bg-white/76 p-5 text-[15px] leading-8">
									{block.content}
								</div>
							</Card.Content>
						</Card>
					))}
					{!activePrompt ? (
						<Card className="surface-panel rounded-[var(--app-radius-xl)]">
							<Card.Content className="p-5 text-[var(--app-muted)]">
								这一条当前没有公开 Prompt。
							</Card.Content>
						</Card>
					) : null}
				</div>
			) : null}

			{tab === 'license' ? (
				<Card
					aria-labelledby="detail-tab-license"
					className="surface-panel rounded-[var(--app-radius-xl)]"
					id="detail-panel-license"
					role="tabpanel"
				>
					<Card.Content className="grid gap-4 p-6">
						<div className="flex flex-wrap justify-between gap-3">
							<span className="text-sm text-[var(--app-muted)]">代码许可</span>
							<strong>{record.license.code}</strong>
						</div>
						<div className="flex flex-wrap justify-between gap-3">
							<span className="text-sm text-[var(--app-muted)]">媒体许可</span>
							<strong>{record.license.media}</strong>
						</div>
						<div className="flex flex-wrap justify-between gap-3">
							<span className="text-sm text-[var(--app-muted)]">第三方声明</span>
							<strong>{record.license.thirdPartyNotice}</strong>
						</div>
						{record.dependencies.length ? (
							<div className="rounded-[18px] bg-white/76 p-4 text-sm text-[var(--app-muted)]">
								依赖：{record.dependencies.join(' / ')}
							</div>
						) : null}
					</Card.Content>
				</Card>
			) : null}

			<div>
				<Link className="text-sm text-[var(--app-accent)]" to="/">
					返回首页
				</Link>
			</div>
		</main>
	);
}
