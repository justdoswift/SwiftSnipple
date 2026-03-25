import type {
	FeedResponse,
	PublishedSnippetCard,
	PublishedSnippetRecord,
	SearchResponse
} from '$lib/discovery/types';

type DiscoveryFetch = typeof fetch;

type ErrorBody = {
	code?: string;
	message?: string;
};

export class DiscoveryApiError extends Error {
	status: number;
	code: string | undefined;

	constructor(status: number, body: ErrorBody) {
		super(body.message ?? `Discovery API request failed with status ${status}`);
		this.name = 'DiscoveryApiError';
		this.status = status;
		this.code = body.code;
	}
}

async function parseJSON<T>(response: Response): Promise<T> {
	return (await response.json()) as T;
}

async function requestJSON<T>(fetcher: DiscoveryFetch, input: string): Promise<T> {
	const response = await fetcher(input);

	if (!response.ok) {
		let body: ErrorBody = {};
		try {
			body = await response.json();
		} catch {
			body = {};
		}

		throw new DiscoveryApiError(response.status, body);
	}

	return parseJSON<T>(response);
}

export function loadFeed(fetcher: DiscoveryFetch) {
	return requestJSON<FeedResponse>(fetcher, '/api/v1/discovery/feed');
}

export function loadSearch(fetcher: DiscoveryFetch, params: URLSearchParams) {
	const query = params.toString();
	const path = query ? `/api/v1/discovery/search?${query}` : '/api/v1/discovery/search';

	return requestJSON<SearchResponse>(fetcher, path);
}

export function loadSnippetDetail(fetcher: DiscoveryFetch, id: string) {
	return requestJSON<PublishedSnippetRecord>(
		fetcher,
		`/api/v1/discovery/snippets/${encodeURIComponent(id)}`
	);
}

export async function enrichCardsWithQuickCopy<T extends PublishedSnippetCard>(
	fetcher: DiscoveryFetch,
	cards: T[] | undefined
) {
	const safeCards = cards ?? [];
	const uniqueIds = [...new Set(safeCards.map((card) => card.id))];
	const detailEntries = await Promise.all(
		uniqueIds.map(async (id) => {
			try {
				const detail = await loadSnippetDetail(fetcher, id);
				const firstPrompt = detail.promptBlocks.find((block) => block.kind === 'prompt');

				return [
					id,
					{
						code: detail.codeBlocks[0]?.content,
						prompt: firstPrompt?.content
					}
				] as const;
			} catch {
				return [id, {}] as const;
			}
		})
	);

	const quickCopyById = new Map(detailEntries);

	return safeCards.map((card) => ({
		...card,
		quickCopy: quickCopyById.get(card.id)
	}));
}
