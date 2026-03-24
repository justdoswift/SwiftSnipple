import assert from 'node:assert/strict';

import {
	categoryPrimaryOptions,
	difficultyOptions,
	snippetStatuses,
	type CategoryPrimary,
	type Difficulty,
	type SnippetStatus
} from './types.js';

const platformOptions = ['iOS', 'macOS', 'watchOS', 'visionOS'] as const;
const visibilityOptions = ['published', 'not_public'] as const;

type PublishedPlatform = {
	os: (typeof platformOptions)[number];
	minVersion: string;
};

type PublishedMedia = {
	coverUrl: string;
	demoUrl?: string;
};

type PublishedCodeBlock = {
	id: string;
	title: string;
	language: string;
	path: string;
	content: string;
};

type PublishedPromptBlock = {
	id: string;
	title: string;
	format: 'markdown' | 'yaml' | 'text';
	path: string;
	content: string;
};

type PublishedDependency = {
	name: string;
	kind: 'package' | 'framework' | 'service' | 'tool';
	url?: string;
	note?: string;
};

type PublishedLicense = {
	code: string;
	media: string;
	thirdPartyNoticePath: string;
	disclosures: string[];
};

export type PublishedSnippetCard = {
	id: string;
	title: string;
	summary: string;
	categoryPrimary: CategoryPrimary;
	difficulty: Difficulty;
	platforms: PublishedPlatform[];
	tags: string[];
	media: PublishedMedia;
	hasDemo: boolean;
	hasPrompt: boolean;
	featuredRank: number;
	publishedAt: string;
};

export type PublishedSnippetDetail = PublishedSnippetCard & {
	codeBlocks: PublishedCodeBlock[];
	promptBlocks: PublishedPromptBlock[];
	license: PublishedLicense;
	dependencies: PublishedDependency[];
};

export type PublishedSnippetSearchDocument = {
	id: string;
	title: string;
	summary: string;
	categoryPrimary: CategoryPrimary;
	difficulty: Difficulty;
	platforms: PublishedPlatform[];
	tags: string[];
	hasDemo: boolean;
	hasPrompt: boolean;
	featuredRank: number;
	publishedAt: string;
};

export type PublishedSnippetRecord = {
	visibility: 'published';
	card: PublishedSnippetCard;
	detail: PublishedSnippetDetail;
	search: PublishedSnippetSearchDocument;
};

export type PublishedIndexEnvelope = {
	generatedAt: string;
	items: PublishedSnippetRecord[];
};

export type SnippetVisibilityRecord = {
	id: string;
	visibility: (typeof visibilityOptions)[number];
	status?: SnippetStatus;
};

export type VisibilityIndexEnvelope = {
	generatedAt: string;
	items: SnippetVisibilityRecord[];
};

export function parsePublishedIndex(json: string): PublishedIndexEnvelope {
	const data = parseJson(json, 'published index') as unknown;
	assertObject(data, 'published index root');

	const generatedAt = readString(data, 'generatedAt', 'published index root');
	assertIsoDate(generatedAt, 'generatedAt');

	const items = readArray(data, 'items', 'published index root').map((item, index) =>
		parsePublishedSnippetRecord(item, index)
	);

	const seenIds = new Set<string>();

	for (const item of items) {
		const id = item.card.id;
		assert.ok(!seenIds.has(id), `duplicate published snippet id: ${id}`);
		seenIds.add(id);
		assert.equal(
			item.visibility,
			'published',
			`published record must have visibility "published" for ${id}`
		);
	}

	return {
		generatedAt,
		items
	};
}

export function parseVisibilityIndex(json: string): VisibilityIndexEnvelope {
	const data = parseJson(json, 'visibility index') as unknown;
	assertObject(data, 'visibility index root');

	const generatedAt = readString(data, 'generatedAt', 'visibility index root');
	assertIsoDate(generatedAt, 'generatedAt');

	const items = readArray(data, 'items', 'visibility index root').map((item, index) =>
		parseVisibilityRecord(item, index)
	);

	const seenIds = new Set<string>();

	for (const item of items) {
		assert.ok(!seenIds.has(item.id), `duplicate visibility id: ${item.id}`);
		seenIds.add(item.id);

		if (item.status !== undefined) {
			throw new Error(`visibility record must not include status for ${item.id}`);
		}
	}

	return {
		generatedAt,
		items
	};
}

export function assertPublishedIndexVisibility(
	publishedIndex: PublishedIndexEnvelope,
	visibilityIndex: VisibilityIndexEnvelope
): void {
	const visibilityById = new Map(visibilityIndex.items.map((item) => [item.id, item]));

	for (const item of publishedIndex.items) {
		const visibilityRecord = visibilityById.get(item.card.id);
		assert.ok(
			visibilityRecord,
			`published snippet ${item.card.id} is missing from visibility registry`
		);
		assert.equal(
			visibilityRecord.visibility,
			'published',
			`published snippet ${item.card.id} must have visibility "published"`
		);
	}
}

function parsePublishedSnippetRecord(value: unknown, index: number): PublishedSnippetRecord {
	const context = `published index items[${index}]`;
	assertObject(value, context);

	if ('status' in value) {
		throw new Error(`${context} must not include status`);
	}

	const visibility = readEnum(value, 'visibility', visibilityOptions, context);
	assert.equal(visibility, 'published', `${context} visibility must be "published"`);

	const card = parsePublishedSnippetCard(readObject(value, 'card', context), `${context}.card`);
	const detail = parsePublishedSnippetDetail(readObject(value, 'detail', context), `${context}.detail`);
	const search = parsePublishedSnippetSearchDocument(
		readObject(value, 'search', context),
		`${context}.search`
	);

	assert.equal(detail.id, card.id, `${context} detail.id must match card.id`);
	assert.equal(search.id, card.id, `${context} search.id must match card.id`);
	assert.equal(detail.title, card.title, `${context} detail.title must match card.title`);
	assert.equal(search.title, card.title, `${context} search.title must match card.title`);
	assert.equal(detail.summary, card.summary, `${context} detail.summary must match card.summary`);
	assert.equal(search.summary, card.summary, `${context} search.summary must match card.summary`);
	assert.equal(
		detail.featuredRank,
		card.featuredRank,
		`${context} detail.featuredRank must match card.featuredRank`
	);
	assert.equal(
		search.featuredRank,
		card.featuredRank,
		`${context} search.featuredRank must match card.featuredRank`
	);
	assert.equal(
		detail.publishedAt,
		card.publishedAt,
		`${context} detail.publishedAt must match card.publishedAt`
	);
	assert.equal(
		search.publishedAt,
		card.publishedAt,
		`${context} search.publishedAt must match card.publishedAt`
	);

	return { visibility, card, detail, search };
}

function parsePublishedSnippetCard(
	value: Record<string, unknown>,
	context: string
): PublishedSnippetCard {
	const card = {
		id: readSlug(value, 'id', context),
		title: readString(value, 'title', context),
		summary: readString(value, 'summary', context),
		categoryPrimary: readEnum(value, 'categoryPrimary', categoryPrimaryOptions, context),
		difficulty: readEnum(value, 'difficulty', difficultyOptions, context),
		platforms: parsePlatforms(readArray(value, 'platforms', context), `${context}.platforms`),
		tags: parseStringArray(readArray(value, 'tags', context), `${context}.tags`),
		media: parseMedia(readObject(value, 'media', context), `${context}.media`),
		hasDemo: readBoolean(value, 'hasDemo', context),
		hasPrompt: readBoolean(value, 'hasPrompt', context),
		featuredRank: readInteger(value, 'featuredRank', context),
		publishedAt: readIsoDate(value, 'publishedAt', context)
	} satisfies PublishedSnippetCard;

	assert.equal(
		card.hasDemo,
		card.media.demoUrl !== undefined,
		`${context}.hasDemo must match presence of media.demoUrl`
	);

	return card;
}

function parsePublishedSnippetDetail(
	value: Record<string, unknown>,
	context: string
): PublishedSnippetDetail {
	const card = parsePublishedSnippetCard(value, context);
	const codeBlocks = parseCodeBlocks(readArray(value, 'codeBlocks', context), `${context}.codeBlocks`);
	const promptBlocks = parsePromptBlocks(
		readArray(value, 'promptBlocks', context),
		`${context}.promptBlocks`
	);
	const license = parseLicense(readObject(value, 'license', context), `${context}.license`);
	const dependencies = parseDependencies(
		readArray(value, 'dependencies', context),
		`${context}.dependencies`
	);

	assert.equal(
		card.hasPrompt,
		promptBlocks.length > 0,
		`${context}.hasPrompt must match promptBlocks presence`
	);

	return {
		...card,
		codeBlocks,
		promptBlocks,
		license,
		dependencies
	};
}

function parsePublishedSnippetSearchDocument(
	value: Record<string, unknown>,
	context: string
): PublishedSnippetSearchDocument {
	return {
		id: readSlug(value, 'id', context),
		title: readString(value, 'title', context),
		summary: readString(value, 'summary', context),
		categoryPrimary: readEnum(value, 'categoryPrimary', categoryPrimaryOptions, context),
		difficulty: readEnum(value, 'difficulty', difficultyOptions, context),
		platforms: parsePlatforms(readArray(value, 'platforms', context), `${context}.platforms`),
		tags: parseStringArray(readArray(value, 'tags', context), `${context}.tags`),
		hasDemo: readBoolean(value, 'hasDemo', context),
		hasPrompt: readBoolean(value, 'hasPrompt', context),
		featuredRank: readInteger(value, 'featuredRank', context),
		publishedAt: readIsoDate(value, 'publishedAt', context)
	};
}

function parseVisibilityRecord(value: unknown, index: number): SnippetVisibilityRecord {
	const context = `visibility index items[${index}]`;
	assertObject(value, context);

	const status = value.status as unknown;
	if (status !== undefined && typeof status === 'string' && snippetStatuses.includes(status as SnippetStatus)) {
		throw new Error(`${context} must not include status`);
	}

	return {
		id: readSlug(value, 'id', context),
		visibility: readEnum(value, 'visibility', visibilityOptions, context)
	};
}

function parsePlatforms(value: unknown[], context: string): PublishedPlatform[] {
	assert.ok(value.length > 0, `${context} must contain at least one platform`);

	return value.map((item, index) => {
		const itemContext = `${context}[${index}]`;
		assertObject(item, itemContext);

		return {
			os: readEnum(item, 'os', platformOptions, itemContext),
			minVersion: readString(item, 'minVersion', itemContext)
		};
	});
}

function parseMedia(value: Record<string, unknown>, context: string): PublishedMedia {
	const coverUrl = readString(value, 'coverUrl', context);
	const demoUrl = readOptionalString(value, 'demoUrl', context);

	return demoUrl === undefined ? { coverUrl } : { coverUrl, demoUrl };
}

function parseCodeBlocks(value: unknown[], context: string): PublishedCodeBlock[] {
	assert.ok(value.length > 0, `${context} must contain at least one code block`);

	return value.map((item, index) => {
		const itemContext = `${context}[${index}]`;
		assertObject(item, itemContext);

		return {
			id: readSlug(item, 'id', itemContext),
			title: readString(item, 'title', itemContext),
			language: readString(item, 'language', itemContext),
			path: readString(item, 'path', itemContext),
			content: readString(item, 'content', itemContext)
		};
	});
}

function parsePromptBlocks(value: unknown[], context: string): PublishedPromptBlock[] {
	return value.map((item, index) => {
		const itemContext = `${context}[${index}]`;
		assertObject(item, itemContext);

		return {
			id: readSlug(item, 'id', itemContext),
			title: readString(item, 'title', itemContext),
			format: readEnum(item, 'format', ['markdown', 'yaml', 'text'] as const, itemContext),
			path: readString(item, 'path', itemContext),
			content: readString(item, 'content', itemContext)
		};
	});
}

function parseLicense(value: Record<string, unknown>, context: string): PublishedLicense {
	return {
		code: readString(value, 'code', context),
		media: readString(value, 'media', context),
		thirdPartyNoticePath: readString(value, 'thirdPartyNoticePath', context),
		disclosures: parseStringArray(readArray(value, 'disclosures', context), `${context}.disclosures`)
	};
}

function parseDependencies(value: unknown[], context: string): PublishedDependency[] {
	return value.map((item, index) => {
		const itemContext = `${context}[${index}]`;
		assertObject(item, itemContext);

		return {
			name: readString(item, 'name', itemContext),
			kind: readEnum(item, 'kind', ['package', 'framework', 'service', 'tool'] as const, itemContext),
			url: readOptionalString(item, 'url', itemContext),
			note: readOptionalString(item, 'note', itemContext)
		};
	});
}

function parseJson(json: string, label: string): unknown {
	try {
		return JSON.parse(json) as unknown;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'unknown parse failure';
		throw new Error(`invalid ${label} json: ${message}`);
	}
}

function assertObject(value: unknown, context: string): asserts value is Record<string, unknown> {
	assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), `${context} must be an object`);
}

function readObject(
	value: Record<string, unknown>,
	key: string,
	context: string
): Record<string, unknown> {
	assert.ok(key in value, `${context} is missing required key "${key}"`);
	const nested = value[key];
	assertObject(nested, `${context}.${key}`);
	return nested;
}

function readArray(value: Record<string, unknown>, key: string, context: string): unknown[] {
	assert.ok(key in value, `${context} is missing required key "${key}"`);
	const arrayValue = value[key];
	assert.ok(Array.isArray(arrayValue), `${context}.${key} must be an array`);
	return arrayValue;
}

function readString(value: Record<string, unknown>, key: string, context: string): string {
	assert.ok(key in value, `${context} is missing required key "${key}"`);
	const stringValue = value[key];
	assert.ok(typeof stringValue === 'string' && stringValue.trim().length > 0, `${context}.${key} must be a non-empty string`);
	return stringValue;
}

function readOptionalString(
	value: Record<string, unknown>,
	key: string,
	context: string
): string | undefined {
	if (!(key in value)) {
		return undefined;
	}

	const stringValue = value[key];
	assert.ok(typeof stringValue === 'string' && stringValue.trim().length > 0, `${context}.${key} must be a non-empty string`);
	return stringValue;
}

function readBoolean(value: Record<string, unknown>, key: string, context: string): boolean {
	assert.ok(key in value, `${context} is missing required key "${key}"`);
	const boolValue = value[key];
	assert.ok(typeof boolValue === 'boolean', `${context}.${key} must be a boolean`);
	return boolValue;
}

function readInteger(value: Record<string, unknown>, key: string, context: string): number {
	assert.ok(key in value, `${context} is missing required key "${key}"`);
	const numberValue = value[key];
	assert.ok(typeof numberValue === 'number' && Number.isInteger(numberValue), `${context}.${key} must be an integer`);
	return numberValue;
}

function readIsoDate(value: Record<string, unknown>, key: string, context: string): string {
	const isoDate = readString(value, key, context);
	assertIsoDate(isoDate, `${context}.${key}`);
	return isoDate;
}

function readEnum<const T extends readonly string[]>(
	value: Record<string, unknown>,
	key: string,
	options: T,
	context: string
): T[number] {
	const optionValue = readString(value, key, context);
	assert.ok(
		options.includes(optionValue),
		`${context}.${key} must be one of ${options.join(', ')}`
	);
	return optionValue as T[number];
}

function readSlug(value: Record<string, unknown>, key: string, context: string): string {
	const slug = readString(value, key, context);
	assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), `${context}.${key} must be a slug`);
	return slug;
}

function parseStringArray(value: unknown[], context: string): string[] {
	return value.map((item, index) => {
		assert.ok(typeof item === 'string' && item.trim().length > 0, `${context}[${index}] must be a non-empty string`);
		return item;
	});
}

function assertIsoDate(value: string, context: string): void {
	assert.ok(!Number.isNaN(Date.parse(value)), `${context} must be an ISO-8601 date string`);
}
