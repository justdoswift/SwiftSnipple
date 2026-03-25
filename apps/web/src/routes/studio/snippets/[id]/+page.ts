import { loadAdminSnippet } from '$lib/studio/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	const editor = await loadAdminSnippet(fetch, params.id);
	return {
		editor
	};
};
