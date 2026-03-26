import { Button, Card, Spinner } from '@heroui/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SectionHeader } from '../components/layout';
import { SnippetCard } from '../components/snippet-card';
import { enrichCardsWithQuickCopy, loadSearch } from '../lib/api/discovery';
import type { PublishedSnippetCard, SearchResponse } from '../lib/types/discovery';

type FilterState = {
	q: string;
	category: string;
	difficulty: string;
	platform: string;
	hasDemo: string;
	hasPrompt: string;
};

function filtersFromParams(params: URLSearchParams): FilterState {
	return {
		q: params.get('q') ?? '',
		category: params.get('category') ?? '',
		difficulty: params.get('difficulty') ?? '',
		platform: params.get('platform') ?? '',
		hasDemo: params.get('hasDemo') ?? '',
		hasPrompt: params.get('hasPrompt') ?? ''
	};
}

function toParams(filters: FilterState) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) {
		if (value) {
			params.set(key, value);
		}
	}
	return params;
}

export function ExplorePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [filters, setFilters] = useState<FilterState>(() => filtersFromParams(searchParams));
	const [results, setResults] = useState<SearchResponse | null>(null);
	const [items, setItems] = useState<PublishedSnippetCard[]>([]);
	const [fallback, setFallback] = useState<PublishedSnippetCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setFilters(filtersFromParams(searchParams));
	}, [searchParams]);

	useEffect(() => {
		let active = true;

		void (async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await loadSearch(searchParams);
				const [enrichedItems, enrichedFallback] = await Promise.all([
					enrichCardsWithQuickCopy(response.items),
					enrichCardsWithQuickCopy(response.fallback ?? [])
				]);
				if (active) {
					setResults(response);
					setItems(enrichedItems);
					setFallback(enrichedFallback);
				}
			} catch (fetchError) {
				if (active) {
					setError(fetchError instanceof Error ? fetchError.message : '搜索失败');
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
	}, [searchParams]);

	const categories = useMemo(
		() => Object.keys(results?.facets.category ?? {}).filter(Boolean),
		[results]
	);
	const platforms = useMemo(
		() => Object.keys(results?.facets.platform ?? {}).filter(Boolean),
		[results]
	);

	const submitFilters = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSearchParams(toParams(filters));
	};

	return (
		<main className="page-shell page-grid pb-10">
			<SectionHeader
				description="把浏览和筛选拆开：先用关键词找到大方向，再用分类、难度和平台把范围压到可判断的尺寸。"
				eyebrow="Explore"
				title="挑一条，直接开做。"
			/>

			<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
				<Card className="surface-panel rounded-[var(--app-radius-xl)]">
					<Card.Content className="grid gap-4 p-5">
						<form className="grid gap-4" onSubmit={submitFilters}>
							<div>
								<label className="mb-2 block text-sm font-medium">关键词</label>
								<input
									className="native-field"
									placeholder="例如：hero、card、timeline"
									value={filters.q}
									onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
								/>
							</div>

							<div>
								<label className="mb-2 block text-sm font-medium">分类</label>
								<select
									className="native-select"
									value={filters.category}
									onChange={(event) =>
										setFilters((current) => ({ ...current, category: event.target.value }))
									}
								>
									<option value="">全部分类</option>
									{categories.map((item) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="mb-2 block text-sm font-medium">难度</label>
								<select
									className="native-select"
									value={filters.difficulty}
									onChange={(event) =>
										setFilters((current) => ({ ...current, difficulty: event.target.value }))
									}
								>
									<option value="">全部难度</option>
									<option value="easy">轻量可复用</option>
									<option value="medium">中等复杂度</option>
									<option value="hard">工程级片段</option>
								</select>
							</div>

							<div>
								<label className="mb-2 block text-sm font-medium">平台</label>
								<select
									className="native-select"
									value={filters.platform}
									onChange={(event) =>
										setFilters((current) => ({ ...current, platform: event.target.value }))
									}
								>
									<option value="">全部平台</option>
									{platforms.map((item) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="flex items-center gap-2 rounded-[16px] bg-white/70 px-4 py-3 text-sm">
									<input
										checked={filters.hasDemo === 'true'}
										type="checkbox"
										onChange={(event) =>
											setFilters((current) => ({
												...current,
												hasDemo: event.target.checked ? 'true' : ''
											}))
										}
									/>
									只看含 Demo
								</label>
								<label className="flex items-center gap-2 rounded-[16px] bg-white/70 px-4 py-3 text-sm">
									<input
										checked={filters.hasPrompt === 'true'}
										type="checkbox"
										onChange={(event) =>
											setFilters((current) => ({
												...current,
												hasPrompt: event.target.checked ? 'true' : ''
											}))
										}
									/>
									只看含 Prompt
								</label>
							</div>

							<div className="flex gap-3">
								<Button className="bg-[var(--app-accent)] text-white" type="submit">
									立即筛选
								</Button>
								<Button
									className="bg-white/70"
									type="button"
									onPress={() => {
										const next = {
											q: '',
											category: '',
											difficulty: '',
											platform: '',
											hasDemo: '',
											hasPrompt: ''
										};
										setFilters(next);
										setSearchParams(new URLSearchParams());
									}}
								>
									清空
								</Button>
							</div>
						</form>
					</Card.Content>
				</Card>

				<div className="page-grid">
					<Card className="surface-panel rounded-[var(--app-radius-xl)]">
						<Card.Content className="flex flex-wrap items-center justify-between gap-4 p-5">
							<div>
								<p className="eyebrow">Result set</p>
								<h2 className="display-title mt-3 text-3xl">
									{results?.total ?? 0} 条结果，保持可扫可选。
								</h2>
							</div>
							<p className="subtle-text max-w-xl">
								这里不再试图把所有信息一次堆满。你应该能先靠标题、封面和标签做第一轮筛选，再进入详情判断要不要带走。
							</p>
						</Card.Content>
					</Card>

					{loading ? (
						<div className="surface-panel flex items-center gap-3 rounded-full px-5 py-3">
							<Spinner size="sm" />
							<span className="text-sm text-[var(--app-muted)]">正在刷新 Explore 结果…</span>
						</div>
					) : null}

					{error ? (
						<Card className="surface-panel rounded-[var(--app-radius-xl)]">
							<Card.Content className="p-6 text-[var(--app-danger)]">{error}</Card.Content>
						</Card>
					) : null}

					{items.length > 0 ? (
						<div className="grid gap-5 lg:grid-cols-2">
							{items.map((item) => (
								<SnippetCard key={item.id} snippet={item} to={`/snippets/${item.id}`} />
							))}
						</div>
					) : null}

					{!loading && items.length === 0 && fallback.length > 0 ? (
						<section className="page-grid">
							<SectionHeader
								description="没有精确命中时，退回一组仍值得看的内容，而不是让页面直接变空。"
								eyebrow="Fallback"
								title="先从这些相近片段继续看"
							/>
							<div className="grid gap-5 lg:grid-cols-2">
								{fallback.map((item) => (
									<SnippetCard key={item.id} snippet={item} to={`/snippets/${item.id}`} />
								))}
							</div>
						</section>
					) : null}
				</div>
			</div>
		</main>
	);
}
