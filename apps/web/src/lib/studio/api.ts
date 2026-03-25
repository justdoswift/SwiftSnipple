import type {
	AdminCreateSnippetRequest,
	AdminSessionResponse,
	AdminSnippetCollection,
	AdminSnippetEditorPayload,
	AdminValidationResponse
} from '$lib/studio/types';

async function requestJSON<T>(fetcher: typeof fetch, input: string, init?: RequestInit): Promise<T> {
	const response = await fetcher(input, init);

	if (!response.ok) {
		let message = `Request failed with status ${response.status}`;
		try {
			const payload = (await response.json()) as { message?: string };
			if (payload.message) {
				message = payload.message;
			}
		} catch {
			// Ignore JSON parsing failures and fall back to the generic message.
		}
		throw new Error(message);
	}

	return (await response.json()) as T;
}

export async function loadAdminSession(fetcher: typeof fetch): Promise<AdminSessionResponse> {
	const response = await fetcher('/api/v1/admin/session');
	if (response.status === 401) {
		return {
			authenticated: false,
			username: ''
		};
	}
	if (!response.ok) {
		throw new Error(`Session request failed with status ${response.status}`);
	}
	return (await response.json()) as AdminSessionResponse;
}

export function loginAdmin(fetcher: typeof fetch, password: string) {
	return requestJSON<AdminSessionResponse>(fetcher, '/api/v1/admin/session', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({ password })
	});
}

export async function logoutAdmin(fetcher: typeof fetch) {
	const response = await fetcher('/api/v1/admin/session', {
		method: 'DELETE'
	});
	if (!response.ok) {
		throw new Error(`Logout failed with status ${response.status}`);
	}
}

export function loadAdminSnippets(fetcher: typeof fetch) {
	return requestJSON<AdminSnippetCollection>(fetcher, '/api/v1/admin/snippets');
}

export function loadAdminSnippet(fetcher: typeof fetch, id: string) {
	return requestJSON<AdminSnippetEditorPayload>(
		fetcher,
		`/api/v1/admin/snippets/${encodeURIComponent(id)}`
	);
}

export function createAdminSnippet(fetcher: typeof fetch, payload: AdminCreateSnippetRequest) {
	return requestJSON<AdminSnippetEditorPayload>(fetcher, '/api/v1/admin/snippets', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
}

export function saveAdminSnippet(fetcher: typeof fetch, id: string, payload: AdminSnippetEditorPayload) {
	return requestJSON<AdminSnippetEditorPayload>(
		fetcher,
		`/api/v1/admin/snippets/${encodeURIComponent(id)}`,
		{
			method: 'PUT',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(payload)
		}
	);
}

export function validateAdminSnippet(fetcher: typeof fetch, id: string) {
	return requestJSON<AdminValidationResponse>(
		fetcher,
		`/api/v1/admin/snippets/${encodeURIComponent(id)}/validate`,
		{
			method: 'POST'
		}
	);
}

export async function uploadAdminAsset(
	fetcher: typeof fetch,
	id: string,
	kind: 'cover' | 'demo',
	file: File
) {
	const form = new FormData();
	form.set('file', file);

	return requestJSON<{ ok: boolean; previewUrl: string }>(
		fetcher,
		`/api/v1/admin/snippets/${encodeURIComponent(id)}/assets/${kind}`,
		{
			method: 'POST',
			body: form
		}
	);
}

export async function moveSnippetToReview(fetcher: typeof fetch, id: string) {
	return requestJSON<{ state: string }>(
		fetcher,
		`/api/v1/publish/snippets/${encodeURIComponent(id)}/review`,
		{
			method: 'POST'
		}
	);
}

export async function publishSnippetVersion(fetcher: typeof fetch, id: string, version: string) {
	return requestJSON<{ state: string; publishedVersion: string }>(
		fetcher,
		`/api/v1/publish/snippets/${encodeURIComponent(id)}/publish`,
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({ version })
		}
	);
}
