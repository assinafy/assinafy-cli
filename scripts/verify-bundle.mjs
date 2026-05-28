#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = path.join(root, 'dist', 'cli.cjs');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

function fail(message) {
	console.error(`Bundle verification failed: ${message}`);
	process.exit(1);
}

function run(args) {
	return execFileSync('node', [bin, ...args], {
		cwd: root,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	}).trim();
}

if (!existsSync(bin)) fail('dist/cli.cjs does not exist; run npm run build first');

const content = readFileSync(bin, 'utf8');
const size = statSync(bin).size;

if (!content.startsWith('#!/usr/bin/env node')) fail('missing node shebang');
if (size < 10_000) fail(`bundle is unexpectedly small (${size} bytes)`);
if (content.includes('sourceMappingURL')) fail('bundle contains a source map reference');
if (!content.includes('assinafy')) fail('bundle does not contain the CLI command name');

const version = run(['--version']);
const expectedVersion = `${pkg.name} v${pkg.version}`;
if (version !== expectedVersion) {
	fail(`unexpected version output "${version}", expected "${expectedVersion}"`);
}

const help = run(['--help']);
if (!help.includes('Usage: assinafy')) fail('help output is missing usage text');
if (!help.includes('Commands:')) fail('help output is missing command list');

console.log(`Verified ${path.relative(root, bin)} (${size} bytes)`);
