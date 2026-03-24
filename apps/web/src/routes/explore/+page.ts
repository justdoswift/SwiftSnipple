import { loadSearch } from '$lib/discovery/api';
import { filtersFromSearchParams } from '$lib/discovery/query';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const results = await loadSearch(fetch, url.searchParams);

	return {
		results,
		filters: filtersFromSearchParams(url.searchParams)
	};
};
