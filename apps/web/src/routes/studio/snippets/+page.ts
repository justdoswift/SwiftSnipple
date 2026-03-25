import { loadAdminSnippets } from '$lib/studio/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const collection = await loadAdminSnippets(fetch);
	return {
		items: collection.items
	};
};
