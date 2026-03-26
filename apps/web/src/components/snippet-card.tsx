import { Card, Chip } from '@heroui/react';
import { Link } from 'react-router-dom';
import type { PublishedSnippetCard } from '../lib/types/discovery';
import { categoryLabel, difficultyLabel, formatDate } from '../lib/utils/format';

export function SnippetCard(props: {
	snippet: PublishedSnippetCard;
	to: string;
	featured?: boolean;
}) {
	const { snippet, to, featured = false } = props;

	return (
		<Link data-testid={`snippet-card-${snippet.id}`} to={to}>
			<Card className="surface-panel rounded-[var(--app-radius-xl)] p-2 transition hover:-translate-y-0.5">
				<Card.Content className={featured ? 'grid gap-5 p-4 lg:grid-cols-[1.4fr_1fr]' : 'grid gap-4 p-4'}>
					<div
						className="card-media"
						style={{
							backgroundImage: `linear-gradient(180deg, rgba(27,23,19,0.08), rgba(27,23,19,0.35)), url(${snippet.media.coverUrl})`
						}}
					/>

					<div className="grid gap-4">
						<div className="flex flex-wrap items-center gap-2">
							<Chip className="bg-[var(--app-accent-soft)] text-[var(--app-accent-deep)]">
								{categoryLabel(snippet.categoryPrimary)}
							</Chip>
							<Chip className="bg-white/80 text-[var(--app-muted)]">
								{difficultyLabel(snippet.difficulty)}
							</Chip>
							{snippet.hasDemo ? (
								<Chip className="bg-[#eef7ef] text-[var(--app-success)]">含 Demo</Chip>
							) : null}
							{snippet.hasPrompt ? (
								<Chip className="bg-[#fdf5e8] text-[var(--app-warning)]">含 Prompt</Chip>
							) : null}
						</div>

						<div>
							<h2 className="display-title m-0 text-3xl leading-tight">{snippet.title}</h2>
							<p className="subtle-text mt-3 text-base">{snippet.summary}</p>
						</div>

						<div className="flex flex-wrap gap-2">
							{snippet.platforms.map((platform) => (
								<Chip
									key={`${platform.os}-${platform.minVersion}`}
									className="border border-black/8 bg-transparent text-[var(--app-muted)]"
								>
									{platform.os} {platform.minVersion}
								</Chip>
							))}
						</div>

						<div className="grid gap-2 text-sm text-[var(--app-muted)]">
							<div className="flex flex-wrap justify-between gap-2">
								<span>发布时间</span>
								<span>{formatDate(snippet.publishedAt)}</span>
							</div>
							<div className="flex flex-wrap justify-between gap-2">
								<span>可带走内容</span>
								<span>{snippet.hasPrompt ? '代码 + Prompt' : '代码主导'}</span>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card>
		</Link>
	);
}
