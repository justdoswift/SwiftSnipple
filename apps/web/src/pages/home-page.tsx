import { Button, Card, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../components/layout';
import { SnippetCard } from '../components/snippet-card';
import { loadFeed } from '../lib/api/discovery';
import type { PublishedSnippetCard } from '../lib/types/discovery';

export function HomePage() {
	const navigate = useNavigate();
	const [items, setItems] = useState<PublishedSnippetCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		void (async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await loadFeed();
				if (active) {
					setItems(response.items);
				}
			} catch (fetchError) {
				if (active) {
					setError(fetchError instanceof Error ? fetchError.message : '加载首页失败');
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

	const ordered = useMemo(
		() =>
			[...items].sort((left, right) => {
				if (left.featuredRank !== right.featuredRank) {
					return left.featuredRank - right.featuredRank;
				}

				return right.publishedAt.localeCompare(left.publishedAt);
			}),
		[items]
	);
	const featured = ordered.find((item) => item.hasDemo && item.media.demoUrl) ?? ordered[0];
	const gallery = featured ? ordered.filter((item) => item.id !== featured.id) : ordered;
	const stats = {
		total: ordered.length,
		demo: ordered.filter((item) => item.hasDemo).length,
		prompt: ordered.filter((item) => item.hasPrompt).length
	};

	return (
		<main className="page-shell page-grid pb-10" id="main-content">
			<section className="surface-panel surface-panel-strong overflow-hidden rounded-[36px] px-6 py-8 lg:px-8 lg:py-10">
				<div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
					<div className="grid gap-6">
						<p className="eyebrow">公开发现</p>
						<h1 className="display-title max-w-[9ch] text-5xl leading-none text-balance lg:text-7xl">
							把 SwiftUI 片段像作品一样浏览。
						</h1>
						<p className="max-w-2xl text-lg leading-8 text-[var(--app-muted)]">
							这次不再沿用旧站的零散视觉和旧框架。首页只负责两件事：让你迅速判断值不值得点开，以及立刻找到下一条更像你的片段。
						</p>
						<div className="flex flex-wrap gap-3">
							<Button className="bg-[var(--app-accent)] text-white" onPress={() => navigate('/explore')}>
								查看全部片段
							</Button>
							<Button className="bg-white/75" onPress={() => featured && navigate(`/snippets/${featured.id}`)}>
								先看本周推荐
							</Button>
						</div>
					</div>

					<div className="grid gap-4">
						<Card className="surface-panel rounded-[28px]">
							<Card.Content className="grid gap-4 p-5">
								<div>
									<p className="eyebrow">内容节奏</p>
									<h2 className="display-title mt-3 text-3xl">先看精选，再深挖筛选。</h2>
								</div>
								<p className="subtle-text">
									首页先给一个强入口，Explore 再负责分类、难度、平台和 Demo / Prompt 过滤。
								</p>
							</Card.Content>
						</Card>

						<div className="grid gap-4 sm:grid-cols-3">
							{[
								['已发布', stats.total],
								['可看演示', stats.demo],
								['可带 Prompt', stats.prompt]
							].map(([label, value]) => (
								<Card key={label} className="surface-panel rounded-[24px]">
									<Card.Content className="grid gap-1 p-5">
										<p className="text-sm text-[var(--app-muted)]">{label}</p>
										<p className="display-title m-0 text-4xl">{value}</p>
									</Card.Content>
								</Card>
							))}
						</div>
					</div>
				</div>
			</section>

			{loading ? (
				<div className="surface-panel flex items-center gap-3 rounded-full px-5 py-3">
					<Spinner size="sm" />
					<span className="text-sm text-[var(--app-muted)]">正在整理首页内容…</span>
				</div>
			) : null}

			{error ? (
				<Card className="surface-panel rounded-[var(--app-radius-xl)]">
					<Card.Content className="p-6">
						<p className="eyebrow">加载失败</p>
						<p className="mb-0 mt-3 text-base text-[var(--app-danger)]">{error}</p>
					</Card.Content>
				</Card>
			) : null}

			{!loading && !error && ordered.length === 0 ? (
				<Card className="surface-panel rounded-[var(--app-radius-xl)]">
					<Card.Content className="grid gap-3 p-6">
						<p className="eyebrow">当前片段库</p>
						<h2 className="display-title m-0 text-3xl">还没有可公开浏览的内容</h2>
						<p className="subtle-text m-0">
							稍后再回来看看，或者直接进入 Explore 等下一批片段上架。
						</p>
					</Card.Content>
				</Card>
			) : null}

			{featured ? (
				<section className="page-grid">
					<SectionHeader
						description="给首页留一条真正值得点开的门面内容，而不是把所有卡片平均摊平。"
						eyebrow="本周推荐"
						title="先从这一条开始"
					/>
					<SnippetCard featured snippet={featured} to={`/snippets/${featured.id}`} />
				</section>
			) : null}

			{gallery.length > 0 ? (
				<section className="page-grid">
					<SectionHeader
						description="继续扫更多风格和难度，挑到合适的那条再点进详情。"
						eyebrow="继续浏览"
						title="更多可直接复用的片段"
					/>
					<div className="grid gap-5 lg:grid-cols-2">
						{gallery.map((snippet) => (
							<SnippetCard key={snippet.id} snippet={snippet} to={`/snippets/${snippet.id}`} />
						))}
					</div>
				</section>
			) : null}
		</main>
	);
}
