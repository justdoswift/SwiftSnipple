import { loadFeed } from '$lib/discovery/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const feed = await loadFeed(fetch);

	return {
		feed: feed.items
	};
};
