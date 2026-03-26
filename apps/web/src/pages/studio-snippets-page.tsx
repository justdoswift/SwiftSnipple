import { Button, Card, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/layout';
import { loadAdminSnippets } from '../lib/api/studio';
import type { AdminSnippetListItem } from '../lib/types/studio';
import { stateLabel } from '../lib/utils/format';

export function StudioSnippetsPage() {
	const [items, setItems] = useState<AdminSnippetListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState('');

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
					setError(fetchError instanceof Error ? fetchError.message : '加载内容列表失败');
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

	const filtered = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) {
			return items;
		}
		return items.filter(
			(item) =>
				item.title.toLowerCase().includes(normalized) ||
				item.id.toLowerCase().includes(normalized) ||
				item.summary.toLowerCase().includes(normalized)
		);
	}, [items, query]);

	return (
		<>
			<SectionHeader
				description="列表页只做筛选和进入编辑，不把所有动作塞在一层里。找到内容，然后进去改。"
				eyebrow="Studio / library"
				title="内容管理"
				aside={
					<Link to="/studio/snippets/new">
						<Button className="bg-[var(--app-accent)] text-white">新建内容</Button>
					</Link>
				}
			/>

			<Card className="surface-panel rounded-[var(--app-radius-xl)]">
				<Card.Content className="grid gap-4 p-5">
					<input
						className="native-field"
						placeholder="按标题、ID 或摘要搜索"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>

					{loading ? (
						<div className="flex items-center gap-3 rounded-full bg-white/65 px-5 py-3">
							<Spinner size="sm" />
							<span className="text-sm text-[var(--app-muted)]">正在拉取内容列表…</span>
						</div>
					) : null}

					{error ? <p className="m-0 text-sm text-[var(--app-danger)]">{error}</p> : null}

					<div className="grid gap-3">
						{filtered.map((item) => (
							<Link
								key={item.id}
								className="rounded-[22px] bg-white/72 p-4 transition hover:bg-white"
								to={`/studio/snippets/${item.id}`}
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="m-0 text-lg font-semibold">{item.title}</p>
										<p className="m-0 mt-2 text-sm text-[var(--app-muted)]">{item.summary}</p>
										<p className="m-0 mt-3 text-xs uppercase tracking-[0.16em] text-[var(--app-accent)]">
											{item.id}
										</p>
									</div>
									<div className="grid gap-1 text-right text-sm text-[var(--app-muted)]">
										<span>{stateLabel(item.state)}</span>
										<span>{item.version}</span>
										<span>{item.hasDemo ? '含 Demo' : '无 Demo'}</span>
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
