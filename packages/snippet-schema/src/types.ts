export const snippetStatuses = ['draft', 'review', 'published'] as const;
export const categoryPrimaryOptions = [
	'layout',
	'navigation',
	'animation',
	'input',
	'media',
	'state',
	'accessibility',
	'tooling'
] as const;
export const difficultyOptions = ['easy', 'medium', 'hard'] as const;

export type SnippetStatus = (typeof snippetStatuses)[number];
export type CategoryPrimary = (typeof categoryPrimaryOptions)[number];
export type Difficulty = (typeof difficultyOptions)[number];

export type SnippetManifest = {
	id: string;
	title: string;
	summary: string;
	version: string;
	status: SnippetStatus;
	category_primary: CategoryPrimary;
	tags: string[];
	facets: string[];
	difficulty: Difficulty;
	platforms: Array<{
		os: 'iOS' | 'macOS' | 'watchOS' | 'visionOS';
		min_version: string;
	}>;
	assets: {
		cover: string;
		demo?: string;
	};
	code: {
		swiftui_root: string;
		prompt_root: string;
		tests_root: string;
	};
	license: {
		code: string;
		media: string;
		third_party_notice: string;
	};
	source_revision: string;
};
