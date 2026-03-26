import { Card, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/layout';
import { loadAdminSnippets } from '../lib/api/studio';
import type { AdminSnippetListItem } from '../lib/types/studio';
import { stateLabel } from '../lib/utils/format';

export function StudioDashboardPage() {
	const [items, setItems] = useState<AdminSnippetListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		void (async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await loadAdminSnippets();
				if (active) {
					setItems(response.items);
				}
			} catch (fetchError) {
				if (active) {
					setError(fetchError instanceof Error ? fetchError.message : '加载后台概览失败');
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
	}, []);

	const stats = useMemo(
		() => ({
			total: items.length,
			review: items.filter((item) => item.state === 'review').length,
			published: items.filter((item) => item.state === 'published').length
		}),
		[items]
	);

	return (
		<>
			<SectionHeader
				description="新后台先服务运营节奏：今天哪些要补、哪些可发、哪些还卡在草稿，一眼就能判断。"
				eyebrow="Studio"
				title="内容运营台"
			/>

			<div className="grid gap-4 sm:grid-cols-3">
				{[
					['总内容数', stats.total],
					['待处理', stats.review],
					['已发布', stats.published]
				].map(([label, value]) => (
					<Card key={label} className="surface-panel rounded-[24px]">
						<Card.Content className="grid gap-2 p-5">
							<p className="m-0 text-sm text-[var(--app-muted)]">{label}</p>
							<p className="display-title m-0 text-4xl">{value}</p>
						</Card.Content>
					</Card>
				))}
			</div>

			{loading ? (
				<div className="surface-panel flex items-center gap-3 rounded-full px-5 py-3">
					<Spinner size="sm" />
					<span className="text-sm text-[var(--app-muted)]">正在整理运营数据…</span>
				</div>
			) : null}

			{error ? (
				<Card className="surface-panel rounded-[var(--app-radius-xl)]">
					<Card.Content className="p-6 text-[var(--app-danger)]">{error}</Card.Content>
				</Card>
			) : null}

			<Card className="surface-panel rounded-[var(--app-radius-xl)]">
				<Card.Content className="grid gap-4 p-5">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="eyebrow">Recent snippets</p>
							<h2 className="display-title mt-3 text-3xl">最近更新的内容</h2>
						</div>
						<Link className="text-sm text-[var(--app-accent)]" to="/studio/snippets">
							进入内容管理
						</Link>
					</div>
					<div className="grid gap-3">
						{items.slice(0, 6).map((item) => (
							<Link
								key={item.id}
								className="rounded-[20px] bg-white/68 p-4 transition hover:bg-white"
								to={`/studio/snippets/${item.id}`}
							>
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div>
										<p className="m-0 font-semibold">{item.title}</p>
										<p className="m-0 mt-1 text-sm text-[var(--app-muted)]">{item.summary}</p>
									</div>
									<div className="text-right text-sm text-[var(--app-muted)]">
										<p className="m-0">{stateLabel(item.state)}</p>
										<p className="m-0 mt-1">{item.version}</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				</Card.Content>
			</Card>
		</>
	);
}
