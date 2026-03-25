import { enrichCardsWithQuickCopy, loadFeed } from '$lib/discovery/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const feed = await loadFeed(fetch);
	const enrichedFeed = await enrichCardsWithQuickCopy(fetch, feed.items);

	return {
		feed: enrichedFeed
	};
};
