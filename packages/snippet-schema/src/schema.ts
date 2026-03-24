import { categoryPrimaryOptions, difficultyOptions, snippetStatuses } from './types.js';

export const snippetSchema = {
	type: 'object',
	additionalProperties: false,
	required: [
		'id',
		'title',
		'summary',
		'version',
		'status',
		'category_primary',
		'tags',
		'facets',
		'difficulty',
		'platforms',
		'assets',
		'code',
		'license',
		'source_revision'
	],
	properties: {
		id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
		title: { type: 'string', minLength: 1 },
		summary: { type: 'string', minLength: 1 },
		version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
		status: { type: 'string', enum: [...snippetStatuses] },
		category_primary: { type: 'string', enum: [...categoryPrimaryOptions] },
		tags: {
			type: 'array',
			minItems: 1,
			items: { type: 'string', minLength: 1 }
		},
		facets: {
			type: 'array',
			minItems: 1,
			items: { type: 'string', minLength: 1 }
		},
		difficulty: { type: 'string', enum: [...difficultyOptions] },
		platforms: {
			type: 'array',
			minItems: 1,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['os', 'min_version'],
				properties: {
					os: { type: 'string', enum: ['iOS', 'macOS', 'watchOS', 'visionOS'] },
					min_version: { type: 'string', minLength: 1 }
				}
			}
		},
		assets: {
			type: 'object',
			additionalProperties: false,
			required: ['cover'],
			properties: {
				cover: { type: 'string', minLength: 1 },
				demo: { type: 'string', minLength: 1 }
			}
		},
		code: {
			type: 'object',
			additionalProperties: false,
			required: ['swiftui_root', 'prompt_root', 'tests_root'],
			properties: {
				swiftui_root: { type: 'string', minLength: 1 },
				prompt_root: { type: 'string', minLength: 1 },
				tests_root: { type: 'string', minLength: 1 }
			}
		},
		license: {
			type: 'object',
			additionalProperties: false,
			required: ['code', 'media', 'third_party_notice'],
			properties: {
				code: { type: 'string', minLength: 1 },
				media: { type: 'string', minLength: 1 },
				third_party_notice: { type: 'string', minLength: 1 }
			}
		},
		source_revision: { type: 'string', minLength: 1 }
	}
} as const;
