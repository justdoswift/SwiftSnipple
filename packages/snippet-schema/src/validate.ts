import fs from 'node:fs';
import path from 'node:path';

import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import { parse } from 'yaml';

import { snippetSchema } from './schema.js';
import type { SnippetManifest } from './types.js';

export type ValidationIssue = {
	path: string;
	message: string;
};

export type ValidationResult = {
	ok: boolean;
	manifestPath: string;
	issues: ValidationIssue[];
};

const requiredEntries = [
	'snippet.yaml',
	'Media',
	'Code/SwiftUI/Sources',
	'Code/SwiftUI/Demo',
	'Code/SwiftUI/README.md',
	'Code/Vibe/prompt.yaml',
	'Code/Vibe/prompt.md',
	'Code/Vibe/acceptance.md',
	'Tests',
	'LICENSES/THIRD_PARTY.md'
] as const;

const Ajv = AjvModule.default ?? AjvModule;
const addFormats = addFormatsModule.default ?? addFormatsModule;

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validateManifest = ajv.compile<SnippetManifest>(snippetSchema);

export function validateSnippetDirectory(snippetDir: string): ValidationResult {
	const manifestPath = path.join(snippetDir, 'snippet.yaml');
	const issues: ValidationIssue[] = [];

	if (!fs.existsSync(manifestPath)) {
		return {
			ok: false,
			manifestPath,
			issues: [{ path: 'snippet.yaml', message: 'missing manifest file' }]
		};
	}

	const manifest = parse(fs.readFileSync(manifestPath, 'utf8')) as SnippetManifest;
	const valid = validateManifest(manifest);

	if (!valid) {
		for (const issue of validateManifest.errors ?? []) {
			issues.push({
				path: issue.instancePath || '(root)',
				message: issue.message ?? 'invalid manifest'
			});
		}
	}

	for (const requiredEntry of requiredEntries) {
		const fullPath = path.join(snippetDir, requiredEntry);
		if (!fs.existsSync(fullPath)) {
			issues.push({
				path: requiredEntry,
				message: 'required file or directory is missing'
			});
		}
	}

	if (valid && manifest.assets.cover && !fs.existsSync(path.join(snippetDir, manifest.assets.cover))) {
		issues.push({
			path: manifest.assets.cover,
			message: 'cover asset path does not exist'
		});
	}

	if (valid && manifest.assets.demo && !fs.existsSync(path.join(snippetDir, manifest.assets.demo))) {
		issues.push({
			path: manifest.assets.demo,
			message: 'demo asset path does not exist'
		});
	}

	return {
		ok: issues.length === 0,
		manifestPath,
		issues
	};
}

export function validateFixtures(rootDir: string): ValidationResult[] {
	const entries = fs
		.readdirSync(rootDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(rootDir, entry.name));

	return entries.map((entry) => validateSnippetDirectory(entry));
}
