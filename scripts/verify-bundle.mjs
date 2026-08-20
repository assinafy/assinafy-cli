#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = path.join(root, 'dist', 'cli.cjs');
const apiCjs = path.join(root, 'dist', 'api.cjs');
const apiEsm = path.join(root, 'dist', 'api.js');
const apiTypes = path.join(root, 'dist', 'types', 'api', 'index.d.ts');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const npmCli = process.env.npm_execpath;

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
if (!npmCli) fail('npm_execpath is not set; run npm run verify:bundle');
for (const file of [apiCjs, apiEsm, apiTypes]) {
	if (!existsSync(file))
		fail(`${path.relative(root, file)} does not exist; run npm run build first`);
}

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

const cjsApi = createRequire(import.meta.url)(`${pkg.name}/api`);
const esmApi = await import(`${pkg.name}/api`);
if (typeof cjsApi.AssinafyClient !== 'function' || typeof esmApi.AssinafyClient !== 'function') {
	fail('SDK entry points do not export AssinafyClient');
}

const consumer = mkdtempSync(path.join(tmpdir(), 'assinafy-sdk-consumer-'));
let consumerError;
try {
	execFileSync(
		process.execPath,
		[npmCli, 'pack', '--ignore-scripts', '--pack-destination', consumer],
		{
			cwd: root,
			stdio: ['ignore', 'pipe', 'pipe'],
		},
	);
	const archive = readdirSync(consumer).find((file) => file.endsWith('.tgz'));
	if (!archive) throw new Error('npm pack did not create an archive');
	execFileSync(
		process.execPath,
		[
			npmCli,
			'install',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			'--package-lock=false',
			path.join(consumer, archive),
		],
		{ cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'] },
	);
	// Simulate pnpm/non-hoisted dependency placement. The public declaration's
	// explicit Node type reference must resolve from inside the installed package.
	const packageModules = path.join(consumer, 'node_modules', '@assinafy', 'cli', 'node_modules');
	mkdirSync(path.join(packageModules, '@types'), { recursive: true });
	renameSync(
		path.join(consumer, 'node_modules', '@types', 'node'),
		path.join(packageModules, '@types', 'node'),
	);
	if (existsSync(path.join(consumer, 'node_modules', 'undici-types'))) {
		renameSync(
			path.join(consumer, 'node_modules', 'undici-types'),
			path.join(packageModules, 'undici-types'),
		);
	}
	writeFileSync(
		path.join(consumer, 'index.ts'),
		"import { type AssinafyClient, type ISendTokenResponse } from '@assinafy/cli/api';\ndeclare const client: AssinafyClient;\nconst response: Promise<ISendTokenResponse> = client.documents.sendToken('document1', { email: 'signer@example.com' });\nvoid response;\n",
	);
	writeFileSync(
		path.join(consumer, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				module: 'NodeNext',
				moduleResolution: 'NodeNext',
				strict: true,
				skipLibCheck: false,
				noEmit: true,
			},
			include: ['index.ts'],
		}),
	);
	execFileSync(
		process.execPath,
		[path.join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.json'],
		{ cwd: consumer, stdio: 'pipe' },
	);
	execFileSync(process.execPath, ['--input-type=module', '--eval', "import('@assinafy/cli/api')"], {
		cwd: consumer,
		stdio: 'pipe',
	});
	execFileSync(process.execPath, ['--eval', "require('@assinafy/cli/api')"], {
		cwd: consumer,
		stdio: 'pipe',
	});
} catch (error) {
	consumerError = [error?.stdout, error?.stderr]
		.map((output) => output?.toString().trim())
		.filter(Boolean)
		.join('\n');
	if (!consumerError) consumerError = error?.message || String(error);
} finally {
	rmSync(consumer, { recursive: true, force: true });
}
if (consumerError) fail(`packed SDK failed strict NodeNext typecheck: ${consumerError}`);

console.log(`Verified CLI bundle (${size} bytes) and packed SDK ESM/CJS/NodeNext types`);
