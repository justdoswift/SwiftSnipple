import { describe, expect, it } from 'vitest';
import { normalizeAdminSnippetEditorPayload } from '$lib/studio/api';

describe('normalizeAdminSnippetEditorPayload', () => {
	it('fills nullable collections and nested fields with safe defaults', () => {
		const payload = normalizeAdminSnippetEditorPayload({
			id: 'demo-snippet',
			title: 'Demo',
			summary: 'summary',
			categoryPrimary: 'layout',
			difficulty: 'easy',
			version: '1.0.0',
			state: 'draft',
			sourceRevision: 'demo-rev-001',
			tags: null as unknown as string[],
			platforms: null as unknown as [],
			assets: {
				cover: '',
				demo: undefined
			},
			license: {
				code: '',
				media: '',
				thirdPartyNotice: '',
				thirdPartyText: undefined
			},
			codeFiles: null as unknown as [],
			promptFiles: null as unknown as []
		});

		expect(payload.tags).toEqual([]);
		expect(payload.platforms).toEqual([]);
		expect(payload.codeFiles).toEqual([]);
		expect(payload.promptFiles).toEqual([]);
		expect(payload.assets.cover).toBe('Media/cover.png');
		expect(payload.license.code).toBe('MIT');
		expect(payload.license.media).toBe('CC-BY-4.0');
		expect(payload.license.thirdPartyNotice).toBe('LICENSES/THIRD_PARTY.md');
		expect(payload.license.thirdPartyText).toBe('');
	});
});
