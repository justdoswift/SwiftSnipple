import path from 'node:path';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkPublishedIndex } from './check-published-index.js';
import {
	assertPublishedIndexVisibility,
	parsePublishedIndex,
	parseVisibilityIndex
} from './published-index.js';
import { validateSnippetDirectory } from './validate.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.resolve(currentDir, '..', 'fixtures');
const repoRoot = path.resolve(currentDir, '..', '..', '..');

function run() {
	const validResult = validateSnippetDirectory(path.join(fixturesRoot, 'valid/basic-card-feed'));
	assert.equal(validResult.ok, true);
	assert.equal(validResult.issues.length, 0);

	const missingRequiredResult = validateSnippetDirectory(
		path.join(fixturesRoot, 'invalid/missing-required')
	);
	assert.equal(missingRequiredResult.ok, false);
	assert.ok(
		missingRequiredResult.issues.some(
			(issue) => issue.path.includes('summary') || issue.path === '(root)'
		)
	);

	const invalidEnumResult = validateSnippetDirectory(
		path.join(fixturesRoot, 'invalid/invalid-enum')
	);
	assert.equal(invalidEnumResult.ok, false);
	assert.ok(
		invalidEnumResult.issues.some((issue) =>
			issue.message.includes('must be equal to one of the allowed values')
		)
	);

	const publishedIndexJson = fs.readFileSync(
		path.join(repoRoot, 'content', 'published', 'snippets.json'),
		'utf8'
	);
	const visibilityIndexJson = fs.readFileSync(
		path.join(repoRoot, 'content', 'published', 'visibility.json'),
		'utf8'
	);
	const publishedIndex = parsePublishedIndex(publishedIndexJson);
	const visibilityIndex = parseVisibilityIndex(visibilityIndexJson);
	assertPublishedIndexVisibility(publishedIndex, visibilityIndex);
	checkPublishedIndex();

	assert.throws(() => {
		parsePublishedIndex(
			JSON.stringify({
				generatedAt: '2026-03-24T08:00:00.000Z',
				items: [
					publishedIndex.items[0],
					{
						...publishedIndex.items[0],
						card: { ...publishedIndex.items[0].card },
						detail: { ...publishedIndex.items[0].detail },
						search: { ...publishedIndex.items[0].search }
					}
				]
			})
		);
	}, /duplicate published snippet id/);

	assert.throws(() => {
		assertPublishedIndexVisibility(
			publishedIndex,
			parseVisibilityIndex(
				JSON.stringify({
					generatedAt: '2026-03-24T08:00:00.000Z',
					items: visibilityIndex.items.filter((item) => item.id !== publishedIndex.items[0]?.card.id)
				})
			)
		);
	}, /missing from visibility registry/);

	console.log('snippet-schema tests passed');
}

run();
