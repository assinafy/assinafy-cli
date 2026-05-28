#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
	chmodSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const bundle = path.join(root, 'dist', 'cli.cjs');
const releaseDir = path.join(root, 'dist', 'release');

const targets = [
	{ name: 'darwin-arm64', type: 'posix' },
	{ name: 'darwin-x64', type: 'posix' },
	{ name: 'linux-arm64', type: 'posix' },
	{ name: 'linux-x64', type: 'posix' },
	{ name: 'windows-arm64', type: 'windows' },
	{ name: 'windows-x64', type: 'windows' },
];

function fail(message) {
	console.error(`Release packaging failed: ${message}`);
	process.exit(1);
}

function sha256(filePath) {
	return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function assertBundle() {
	if (!existsSync(bundle)) fail('dist/cli.cjs does not exist; run npm run build first');
	const content = readFileSync(bundle, 'utf8');
	if (!content.startsWith('#!/usr/bin/env node')) fail('dist/cli.cjs is missing the node shebang');
}

function copyDocs(targetDir) {
	for (const file of ['README.md', 'LICENSE']) {
		const source = path.join(root, file);
		if (existsSync(source)) copyFileSync(source, path.join(targetDir, file));
	}
	writeFileSync(path.join(targetDir, 'VERSION'), `${pkg.version}\n`);
}

function preparePayload(target) {
	const tmp = mkdtempSync(path.join(os.tmpdir(), `assinafy-${target.name}-`));
	const payload = path.join(tmp, 'payload');
	mkdirSync(payload, { recursive: true });
	copyDocs(payload);

	if (target.type === 'windows') {
		copyFileSync(bundle, path.join(payload, 'assinafy.cjs'));
		writeFileSync(
			path.join(payload, 'assinafy.cmd'),
			'@echo off\r\nnode "%~dp0assinafy.cjs" %*\r\n',
		);
		return { tmp, payload };
	}

	const executable = path.join(payload, 'assinafy');
	copyFileSync(bundle, executable);
	chmodSync(executable, 0o755);
	return { tmp, payload };
}

function archiveTarget(target) {
	const { tmp, payload } = preparePayload(target);
	const archive = path.join(releaseDir, `assinafy-${target.name}.tar.gz`);

	try {
		execFileSync('tar', ['-czf', archive, '-C', payload, '.'], { stdio: 'inherit' });
		return archive;
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

assertBundle();
rmSync(releaseDir, { recursive: true, force: true });
mkdirSync(releaseDir, { recursive: true });

const archives = targets.map(archiveTarget);
const checksumLines = archives
	.map((archive) => `${sha256(archive)}  ${path.basename(archive)}`)
	.sort();

writeFileSync(path.join(releaseDir, 'SHA256SUMS'), `${checksumLines.join('\n')}\n`);

for (const archive of archives) {
	console.log(`Created ${path.relative(root, archive)}`);
}
console.log(`Created ${path.relative(root, path.join(releaseDir, 'SHA256SUMS'))}`);
