import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { validateSnippetDirectory } from './validate.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.resolve(currentDir, '..', 'fixtures');

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

	console.log('snippet-schema tests passed');
}

run();
