import { enrichCardsWithQuickCopy, loadSearch } from '$lib/discovery/api';
import { filtersFromSearchParams } from '$lib/discovery/query';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const results = await loadSearch(fetch, url.searchParams);
	const [items, fallback] = await Promise.all([
		enrichCardsWithQuickCopy(fetch, results.items),
		enrichCardsWithQuickCopy(fetch, results.fallback ?? [])
	]);

	return {
		results: {
			...results,
			items,
			fallback
		},
		filters: filtersFromSearchParams(url.searchParams)
	};
};
