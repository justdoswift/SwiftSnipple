export type PlatformInfo = {
	os: string;
	minVersion: string;
};

export type MediaInfo = {
	coverUrl: string;
	demoUrl?: string;
};

export type SnippetQuickCopy = {
	code?: string;
	prompt?: string;
};

export type PublishedSnippetCard = {
	id: string;
	title: string;
	summary: string;
	categoryPrimary: string;
	difficulty: 'easy' | 'medium' | 'hard';
	platforms: PlatformInfo[];
	tags: string[];
	media: MediaInfo;
	hasDemo: boolean;
	hasPrompt: boolean;
	featuredRank: number;
	publishedAt: string;
	quickCopy?: SnippetQuickCopy;
};

export type SearchSnippetCard = PublishedSnippetCard & {
	score: number;
};

export type CodeBlock = {
	id: string;
	filename: string;
	language: 'swift' | string;
	content: string;
};

export type PromptBlock = {
	id: string;
	kind: 'prompt' | 'acceptance' | string;
	content: string;
};

export type SnippetLicense = {
	code: string;
	media: string;
	thirdPartyNotice: string;
};

export type PublishedSnippetRecord = PublishedSnippetCard & {
	codeBlocks: CodeBlock[];
	promptBlocks: PromptBlock[];
	license: SnippetLicense;
	dependencies: string[];
};

export type FeedResponse = {
	items: PublishedSnippetCard[];
};

export type FacetCounts = {
	category: Record<string, number>;
	difficulty: Record<string, number>;
	platform: Record<string, number>;
	hasDemo: Record<string, number>;
	hasPrompt: Record<string, number>;
};

export type SearchResponse = {
	query: {
		q: string;
		category: string;
		difficulty: string;
		platform: string;
		hasDemo?: boolean;
		hasPrompt?: boolean;
	};
	total: number;
	items: SearchSnippetCard[];
	fallback?: PublishedSnippetCard[];
	facets: FacetCounts;
};

export type NotPublicSnippetState = {
	notPublic: true;
	id: string;
};

export type DiscoveryFilters = {
	q: string;
	category: string;
	difficulty: string;
	platform: string;
	hasDemo: string;
	hasPrompt: string;
};

export type DiscoveryFilterKey = keyof DiscoveryFilters;

export type FacetOption = {
	label: string;
	value: string;
	count?: number;
};
