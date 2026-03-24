import type { DiscoveryFilterKey, DiscoveryFilters } from '$lib/discovery/types';

const FILTER_KEYS = ['q', 'category', 'difficulty', 'platform', 'hasDemo', 'hasPrompt'] as const;

export const defaultDiscoveryFilters = (): DiscoveryFilters => ({
	q: '',
	category: '',
	difficulty: '',
	platform: '',
	hasDemo: '',
	hasPrompt: ''
});

export function filtersFromSearchParams(searchParams: URLSearchParams): DiscoveryFilters {
	const filters = defaultDiscoveryFilters();

	for (const key of FILTER_KEYS) {
		filters[key] = searchParams.get(key) ?? '';
	}

	return filters;
}

export function filtersToSearchParams(filters: DiscoveryFilters): URLSearchParams {
	const params = new URLSearchParams();

	for (const key of FILTER_KEYS) {
		const value = filters[key].trim();
		if (value) {
			params.set(key, value);
		}
	}

	return params;
}

export function withUpdatedFilter(
	filters: DiscoveryFilters,
	key: DiscoveryFilterKey,
	value: string
): DiscoveryFilters {
	return {
		...filters,
		[key]: value
	};
}

export function toggleFilterValue(
	filters: DiscoveryFilters,
	key: DiscoveryFilterKey,
	value: string
): DiscoveryFilters {
	const nextValue = filters[key] === value ? '' : value;

	return withUpdatedFilter(filters, key, nextValue);
}
