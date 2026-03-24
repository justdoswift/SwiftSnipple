<script lang="ts">
	import type { PublishedSnippetCard } from '$lib/discovery/types';

	type Props = {
		snippet: PublishedSnippetCard;
		href?: string;
	};

	let { snippet, href = `/snippets/${snippet.id}` }: Props = $props();
</script>

<a class="card" href={href} aria-label={`Open ${snippet.title}`}>
	<div class="media-shell">
		<img class="cover" src={snippet.media.coverUrl} alt={snippet.title} loading="lazy" />
		<div class="media-meta">
			<span>{snippet.categoryPrimary}</span>
			<span>{snippet.hasDemo ? 'Demo ready' : 'Cover preview'}</span>
		</div>
	</div>

	<div class="content">
		<div class="header">
			<p class="difficulty difficulty-{snippet.difficulty}">{snippet.difficulty}</p>
			<div class="platforms" aria-label="Supported platforms">
				{#each snippet.platforms as platform (`${platform.os}-${platform.minVersion}`)}
					<span>{platform.os} {platform.minVersion}</span>
				{/each}
			</div>
		</div>

		<div class="body">
			<h2>{snippet.title}</h2>
			<p>{snippet.summary}</p>
		</div>

		<ul class="tags" aria-label="Snippet tags">
			{#each snippet.tags as tag (tag)}
				<li>{tag}</li>
			{/each}
		</ul>
	</div>
</a>

<style>
	.card {
		display: grid;
		gap: 1rem;
		text-decoration: none;
		color: inherit;
		background: rgba(255, 251, 244, 0.92);
		border: 1px solid rgba(82, 54, 35, 0.14);
		border-radius: 28px;
		overflow: clip;
		box-shadow: 0 24px 60px rgba(65, 41, 20, 0.12);
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			border-color 180ms ease;
	}

	.card:hover,
	.card:focus-visible {
		transform: translateY(-3px);
		box-shadow: 0 32px 72px rgba(65, 41, 20, 0.18);
		border-color: rgba(82, 54, 35, 0.22);
	}

	.media-shell {
		position: relative;
		aspect-ratio: 16 / 10;
		background:
			linear-gradient(135deg, rgba(235, 188, 139, 0.42), rgba(83, 132, 126, 0.18)),
			#f3e6d7;
	}

	.cover {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.media-meta {
		position: absolute;
		left: 1rem;
		right: 1rem;
		bottom: 1rem;
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #fff8f0;
	}

	.media-meta span {
		background: rgba(19, 24, 23, 0.58);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		padding: 0.45rem 0.7rem;
		backdrop-filter: blur(12px);
	}

	.content {
		display: grid;
		gap: 0.9rem;
		padding: 0 1.2rem 1.2rem;
	}

	.header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: center;
	}

	.difficulty {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.difficulty-easy {
		color: #1f6d53;
	}

	.difficulty-medium {
		color: #9a5b15;
	}

	.difficulty-hard {
		color: #8b2f2b;
	}

	.platforms {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.platforms span,
	.tags li {
		list-style: none;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		background: rgba(102, 130, 126, 0.12);
		color: #264743;
		font-size: 0.82rem;
	}

	.body h2 {
		margin: 0 0 0.5rem;
		font-size: clamp(1.45rem, 2vw, 1.85rem);
		line-height: 1.05;
	}

	.body p {
		margin: 0;
		line-height: 1.65;
		color: #4b4036;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		padding: 0;
		margin: 0;
	}
</style>
