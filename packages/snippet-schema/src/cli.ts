import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateFixtures, validateSnippetDirectory } from './validate.js';

const fixtureExpectation: Record<string, boolean> = {
	valid: true,
	invalid: false
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, '..');

function printResult(label: string, ok: boolean, issues: { path: string; message: string }[]) {
	if (ok) {
		console.log(`PASS ${label}`);
		return;
	}

	console.error(`FAIL ${label}`);
	for (const issue of issues) {
		console.error(`  - ${issue.path}: ${issue.message}`);
	}
}

function runFixtures(fixturesRoot: string) {
	let hasFailures = false;
	const groups = ['valid', 'invalid'] as const;

	for (const group of groups) {
		const groupDir = path.join(fixturesRoot, group);
		const results = validateFixtures(groupDir);

		for (const result of results) {
			const expected = fixtureExpectation[group];
			const actual = result.ok;
			const relative = path.relative(fixturesRoot, path.dirname(result.manifestPath));
			const pass = actual === expected;

			printResult(relative, pass, pass ? [] : result.issues);
			if (!pass) {
				hasFailures = true;
			}
		}
	}

	process.exit(hasFailures ? 1 : 0);
}

function runSingle(snippetDir: string) {
	const result = validateSnippetDirectory(snippetDir);
	printResult(snippetDir, result.ok, result.issues);
	process.exit(result.ok ? 0 : 1);
}

const mode = process.argv[2];

if (mode === 'fixtures') {
	runFixtures(path.join(packageRoot, 'fixtures'));
} else if (mode === 'snippet') {
	const target = process.argv[3];
	if (!target) {
		console.error('usage: tsx src/cli.ts snippet <directory>');
		process.exit(1);
	}
	runSingle(path.resolve(process.cwd(), target));
} else {
	const expectedRoot = path.join(packageRoot, 'fixtures');
	if (fs.existsSync(expectedRoot)) {
		runFixtures(expectedRoot);
	} else {
		console.error('usage: tsx src/cli.ts fixtures | snippet <directory>');
		process.exit(1);
	}
}
