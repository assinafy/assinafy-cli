import { spawnSync } from 'node:child_process';
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

let directory;
const previousPage = '# `assinafy previous`\n\nExisting command help.\n';
const topHelp = 'Usage: assinafy [command]\n\nCommands:\n  documents  Manage documents\n';
const groupHelp = 'Usage: assinafy documents [command]\n\nCommands:\n  get  Fetch a document\n';

beforeEach(() => {
	directory = mkdtempSync(path.join(tmpdir(), 'assinafy-docs-test-'));
	for (const name of ['scripts', 'dist', 'docs']) mkdirSync(path.join(directory, name));
	copyFileSync(
		new URL('./gen-docs.mjs', import.meta.url),
		path.join(directory, 'scripts/gen-docs.mjs'),
	);
	writeFileSync(path.join(directory, 'docs/api-operations.json'), '{"operations":[]}');
	writeFileSync(path.join(directory, 'docs/previous.md'), previousPage);
	writeFileSync(path.join(directory, 'docs/README.md'), 'Existing index.\n');
	writeFileSync(path.join(directory, 'docs/manual.md'), '# Manual\n');
});

afterEach(() => rmSync(directory, { recursive: true, force: true }));

function generate(source) {
	writeFileSync(path.join(directory, 'dist/cli.cjs'), source);
	return spawnSync(process.execPath, [path.join(directory, 'scripts/gen-docs.mjs')], {
		encoding: 'utf8',
		timeout: 10_000,
	});
}

it.each([
	['startup failure', 'process.exit(1);'],
	['missing help output', ''],
	['missing command list', 'console.log("Usage: assinafy [command]");'],
	[
		'nested command failure',
		`if (process.argv[3]) process.exit(1); console.log(${JSON.stringify(topHelp)});`,
	],
])('preserves existing pages after %s', (_name, source) => {
	const result = generate(source);
	expect(result.status).not.toBe(0);
	expect(readFileSync(path.join(directory, 'docs/previous.md'), 'utf8')).toBe(previousPage);
	expect(readFileSync(path.join(directory, 'docs/README.md'), 'utf8')).toBe('Existing index.\n');
	expect(existsSync(path.join(directory, 'docs/documents.md'))).toBe(false);
});

it('renders nested help before replacing generated pages and keeps manual documentation', () => {
	const result = generate(
		`const help = ${JSON.stringify([topHelp, groupHelp, 'Usage: assinafy documents get <id>'])}; console.log(help[process.argv.length - 3]);`,
	);
	expect(result.status, result.stderr).toBe(0);
	expect(existsSync(path.join(directory, 'docs/previous.md'))).toBe(false);
	expect(readFileSync(path.join(directory, 'docs/documents.md'), 'utf8')).toContain(
		'Usage: assinafy documents get <id>',
	);
	expect(readFileSync(path.join(directory, 'docs/README.md'), 'utf8')).toContain(
		'[documents](./documents.md)',
	);
	expect(readFileSync(path.join(directory, 'docs/manual.md'), 'utf8')).toBe('# Manual\n');
});
