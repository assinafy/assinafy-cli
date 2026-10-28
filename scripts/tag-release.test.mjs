import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const directories = [];
afterEach(() => {
	for (const directory of directories.splice(0))
		rmSync(directory, { recursive: true, force: true });
});

function fixture() {
	const cwd = mkdtempSync(join(tmpdir(), 'assinafy-tag-release-'));
	directories.push(cwd);
	const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
	git('init', '-q');
	git('config', 'user.name', 'Release Test');
	git('config', 'user.email', 'release@example.com');
	git('config', 'commit.gpgsign', 'false');
	git('config', 'tag.gpgsign', 'false');
	mkdirSync(join(cwd, 'scripts'));
	copyFileSync(resolve('scripts/semver-greater.mjs'), join(cwd, 'scripts/semver-greater.mjs'));
	const version = '2.7.0';
	writeFileSync(join(cwd, 'package.json'), JSON.stringify({ version }));
	writeFileSync(
		join(cwd, 'package-lock.json'),
		JSON.stringify({ version, packages: { '': { version } } }),
	);
	writeFileSync(join(cwd, 'CHANGELOG.md'), `## [${version}] - 2026-10-28\n`);
	git('add', '.');
	git('commit', '-qm', 'Initial version');
	const sha = git('rev-parse', 'HEAD');
	git('update-ref', 'refs/remotes/origin/main', sha);
	const bin = join(cwd, 'bin');
	mkdirSync(bin);
	const log = join(cwd, 'gh.log');
	writeFileSync(
		join(bin, 'gh'),
		`#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$GH_TEST_LOG"
if [[ "$*" == *git/tags* ]]; then printf '%s\\n' 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; fi
if [[ "$*" == *git/refs* && "$GH_TEST_REF_FAILURE" == 1 ]]; then exit 1; fi
`,
		{ mode: 0o700 },
	);
	return {
		cwd,
		git,
		sha,
		calls: () => readFileSync(log, 'utf8'),
		run: (env = {}) =>
			spawnSync('bash', [resolve('scripts/tag-release.sh')], {
				cwd,
				encoding: 'utf8',
				env: {
					...process.env,
					PATH: `${bin}:${process.env.PATH}`,
					GH_TEST_LOG: log,
					GH_TEST_REF_FAILURE: '',
					GH_REPO: 'example/cli',
					RELEASE_SHA: sha,
					...env,
				},
			}),
	};
}

describe.skipIf(process.platform === 'win32')('automatic release tags', () => {
	it('creates an annotated tag for the tested commit and explicitly dispatches publication', () => {
		const f = fixture();
		expect(f.run().status).toBe(0);
		const calls = f.calls().trim().split('\n');
		expect(calls).toHaveLength(3);
		expect(calls[0]).toContain(`-f tag=v2.7.0 -f message=v2.7.0 -f object=${f.sha} -f type=commit`);
		expect(calls[1]).toContain(
			'-f ref=refs/tags/v2.7.0 -f sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		);
		expect(calls[2]).toBe(
			'workflow run release.yml --repo example/cli --ref main --raw-field tag=v2.7.0',
		);
	});

	it('resumes the same annotated tag without recreating it', () => {
		const f = fixture();
		f.git('tag', '-a', 'v2.7.0', '-m', 'v2.7.0');
		expect(f.run().status).toBe(0);
		expect(f.calls().trim().split('\n')).toHaveLength(1);
		expect(f.calls()).toContain('workflow run release.yml');
	});

	it('skips an unchanged version on a subsequent commit', () => {
		const f = fixture();
		f.git('tag', '-a', 'v2.7.0', '-m', 'v2.7.0');
		f.git('commit', '--allow-empty', '-qm', 'Later change');
		const sha = f.git('rev-parse', 'HEAD');
		f.git('update-ref', 'refs/remotes/origin/main', sha);
		const result = f.run({ RELEASE_SHA: sha });
		expect(result.status).toBe(0);
		expect(result.stdout).toContain('bump the version');
		expect(() => f.calls()).toThrow();
	});

	it('rejects lightweight tags and unrelated tags without GitHub writes', () => {
		const f = fixture();
		f.git('tag', 'v2.7.0');
		expect(f.run().stderr).toContain('annotated or signed');
		f.git('tag', '-d', 'v2.7.0');
		f.git('commit', '--allow-empty', '-qm', 'Unverified change');
		f.git('tag', '-a', 'v2.7.0', '-m', 'v2.7.0');
		f.git('checkout', '-q', f.sha);
		expect(f.run().stderr).toContain('outside this commit');
		expect(() => f.calls()).toThrow();
	});

	it('rejects a checkout different from CI and a commit not on main', () => {
		const f = fixture();
		expect(f.run({ RELEASE_SHA: 'b'.repeat(40) }).stderr).toContain('successful CI commit');
		f.git('update-ref', '-d', 'refs/remotes/origin/main');
		expect(f.run().stderr).toContain('reachable from main');
		expect(() => f.calls()).toThrow();
	});

	it('rejects mismatched versions, missing release notes and malformed SemVer', () => {
		const f = fixture();
		writeFileSync(join(f.cwd, 'package-lock.json'), '{}');
		expect(f.run().stderr).toContain('versions must match');
		f.git('checkout', '--', 'package-lock.json');
		writeFileSync(join(f.cwd, 'CHANGELOG.md'), '## [Unreleased]\n');
		expect(f.run().stderr).toContain('dated changelog entry');
		writeFileSync(join(f.cwd, 'package.json'), '{"version":"2.7.0-01"}');
		expect(f.run().stderr).toContain('Invalid SemVer');
		expect(() => f.calls()).toThrow();
	});

	it('does not dispatch a release when tag creation fails', () => {
		const f = fixture();
		expect(f.run({ GH_TEST_REF_FAILURE: '1' }).status).toBe(1);
		expect(f.calls()).not.toContain('workflow run');
	});
});
