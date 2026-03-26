import type {
	AdminCreateSnippetRequest,
	AdminEditableFile,
	AdminSessionResponse,
	AdminSnippetCollection,
	AdminSnippetEditorPayload,
	AdminPlatform,
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

function normalizeEditableFiles(value: unknown): AdminEditableFile[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.map((file) => {
		const record = (file ?? {}) as Partial<AdminEditableFile>;
		return {
			path: typeof record.path === 'string' ? record.path : '',
			label: typeof record.label === 'string' ? record.label : '',
			kind: typeof record.kind === 'string' ? record.kind : undefined,
			content: typeof record.content === 'string' ? record.content : ''
		};
	});
}

function normalizePlatforms(value: unknown): AdminPlatform[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.map((platform) => {
		const record = (platform ?? {}) as Partial<AdminPlatform>;
		return {
			os: typeof record.os === 'string' ? record.os : '',
			minVersion: typeof record.minVersion === 'string' ? record.minVersion : ''
		};
	});
}

function fallbackString(value: unknown, fallback: string): string {
	return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

export function normalizeAdminSnippetEditorPayload(
	payload: AdminSnippetEditorPayload
): AdminSnippetEditorPayload {
	const record = (payload ?? {}) as Partial<AdminSnippetEditorPayload>;
	const assets = (record.assets ?? {}) as Partial<AdminSnippetEditorPayload['assets']>;
	const license = (record.license ?? {}) as Partial<AdminSnippetEditorPayload['license']>;

	return {
		id: typeof record.id === 'string' ? record.id : '',
		title: typeof record.title === 'string' ? record.title : '',
		summary: typeof record.summary === 'string' ? record.summary : '',
		categoryPrimary:
			typeof record.categoryPrimary === 'string' ? record.categoryPrimary : 'layout',
		difficulty: typeof record.difficulty === 'string' ? record.difficulty : 'easy',
		version: typeof record.version === 'string' ? record.version : '1.0.0',
		state: typeof record.state === 'string' ? record.state : 'draft',
		sourceRevision: typeof record.sourceRevision === 'string' ? record.sourceRevision : '',
		tags: Array.isArray(record.tags)
			? record.tags.filter((value): value is string => typeof value === 'string')
			: [],
		platforms: normalizePlatforms(record.platforms),
		assets: {
			cover: fallbackString(assets.cover, 'Media/cover.png'),
			demo: typeof assets.demo === 'string' && assets.demo.trim() !== '' ? assets.demo : undefined,
			coverPreviewUrl:
				typeof assets.coverPreviewUrl === 'string' ? assets.coverPreviewUrl : undefined,
			demoPreviewUrl:
				typeof assets.demoPreviewUrl === 'string' ? assets.demoPreviewUrl : undefined
		},
		license: {
			code: fallbackString(license.code, 'MIT'),
			media: fallbackString(license.media, 'CC-BY-4.0'),
			thirdPartyNotice: fallbackString(license.thirdPartyNotice, 'LICENSES/THIRD_PARTY.md'),
			thirdPartyText:
				typeof license.thirdPartyText === 'string' ? license.thirdPartyText : ''
		},
		codeFiles: normalizeEditableFiles(record.codeFiles),
		promptFiles: normalizeEditableFiles(record.promptFiles)
	};
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
	).then(normalizeAdminSnippetEditorPayload);
}

export function createAdminSnippet(fetcher: typeof fetch, payload: AdminCreateSnippetRequest) {
	return requestJSON<AdminSnippetEditorPayload>(fetcher, '/api/v1/admin/snippets', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(payload)
	}).then(normalizeAdminSnippetEditorPayload);
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
	).then(normalizeAdminSnippetEditorPayload);
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
