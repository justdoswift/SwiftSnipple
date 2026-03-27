import type {
	FeedResponse,
	PublishedSnippetRecord,
	SearchResponse
} from '../types/discovery';
import { buildApiURL } from './base';

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

async function requestJSON<T>(input: string): Promise<T> {
	const response = await fetch(buildApiURL(input));

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

export function loadFeed() {
	return requestJSON<FeedResponse>('/api/v1/discovery/feed');
}

export function loadSearch(params: URLSearchParams) {
	const query = params.toString();
	const path = query ? `/api/v1/discovery/search?${query}` : '/api/v1/discovery/search';

	return requestJSON<SearchResponse>(path);
}

export function loadSnippetDetail(id: string) {
	return requestJSON<PublishedSnippetRecord>(`/api/v1/discovery/snippets/${encodeURIComponent(id)}`);
}
