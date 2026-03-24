import { DiscoveryApiError, loadSnippetDetail } from '$lib/discovery/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	try {
		const snippet = await loadSnippetDetail(fetch, params.id);

		return {
			notPublic: false,
			snippet
		};
	} catch (err) {
		if (err instanceof DiscoveryApiError) {
			if (err.status === 403 && err.code === 'not_public') {
				return {
					notPublic: true,
					id: params.id
				};
			}

			if (err.status === 404) {
				error(404, 'Snippet not found');
			}

			error(err.status, err.message);
		}

		throw err;
	}
};
