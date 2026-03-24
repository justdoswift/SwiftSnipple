import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	assertPublishedIndexVisibility,
	parsePublishedIndex,
	parseVisibilityIndex
} from './published-index.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..', '..', '..');
const publishedIndexPath = path.join(repoRoot, 'content', 'published', 'snippets.json');
const visibilityIndexPath = path.join(repoRoot, 'content', 'published', 'visibility.json');

export function checkPublishedIndex(): void {
	const publishedJson = fs.readFileSync(publishedIndexPath, 'utf8');
	const visibilityJson = fs.readFileSync(visibilityIndexPath, 'utf8');

	const publishedIndex = parsePublishedIndex(publishedJson);
	const visibilityIndex = parseVisibilityIndex(visibilityJson);

	assertPublishedIndexVisibility(publishedIndex, visibilityIndex);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	try {
		checkPublishedIndex();
		console.log('published index validation passed');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'unknown validation failure';
		console.error(`published index validation failed: ${message}`);
		process.exitCode = 1;
	}
}
