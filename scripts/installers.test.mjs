import { execFileSync, spawnSync } from 'node:child_process';
import { linkSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const installer = fileURLToPath(new URL('../install.sh', import.meta.url));

it.skipIf(process.platform === 'win32')('rejects links before extracting release archives', () => {
	const directory = mkdtempSync(path.join(tmpdir(), 'assinafy-installer-test-'));
	const archive = path.join(directory, 'release.tar.gz');
	const validate = () =>
		spawnSync(
			'bash',
			[
				'-c',
				'source "$1"; setup_colors; validate_archive "$2" linux-x64',
				'bash',
				installer,
				archive,
			],
			{
				encoding: 'utf8',
			},
		);
	const pack = () =>
		execFileSync('tar', ['-czf', archive, '-C', directory, 'assinafy', 'VERSION', 'README.md']);
	try {
		writeFileSync(path.join(directory, 'assinafy'), 'example executable');
		writeFileSync(path.join(directory, 'VERSION'), '2.4.1');
		writeFileSync(path.join(directory, 'README.md'), 'example documentation');
		pack();
		expect(validate().status).toBe(0);
		for (const link of [symlinkSync, linkSync]) {
			rmSync(path.join(directory, 'README.md'));
			link(path.join(directory, 'assinafy'), path.join(directory, 'README.md'));
			pack();
			const result = validate();
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('link or special file');
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
