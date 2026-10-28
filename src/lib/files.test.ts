import { chmodSync, fchmodSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultArtifactFilename, writeBinary } from './files';

vi.mock('node:fs', async (importOriginal) => {
	const fs = await importOriginal<typeof import('node:fs')>();
	return { ...fs, fchmodSync: vi.fn(fs.fchmodSync) };
});

let tempDir: string | undefined;

afterEach(() => {
	if (tempDir) rmSync(tempDir, { recursive: true, force: true });
	tempDir = undefined;
});

describe('defaultArtifactFilename', () => {
	it('uses the actual artifact file format', () => {
		expect(defaultArtifactFilename('doc1', 'thumbnail')).toBe('doc1-thumbnail.jpg');
		expect(defaultArtifactFilename('doc1', 'bundle')).toBe('doc1-bundle.zip');
		expect(defaultArtifactFilename('doc1', 'pades')).toBe('doc1-pades.pdf');
	});
});

describe('writeBinary', () => {
	it.skipIf(process.platform === 'win32')('keeps new and replaced downloads private', () => {
		tempDir = mkdtempSync(path.join(os.tmpdir(), 'assinafy-download-'));
		const output = path.join(tempDir, 'evidence.bin');
		const mask = process.umask(0o022);
		try {
			writeBinary(output, Buffer.from('first'));
			expect(statSync(output).mode & 0o777).toBe(0o600);
			chmodSync(output, 0o644);
			writeBinary(output, Buffer.from('second'), { force: true });
			expect(statSync(output).mode & 0o777).toBe(0o600);
			expect(readFileSync(output, 'utf8')).toBe('second');
		} finally {
			process.umask(mask);
		}
	});

	it.skipIf(process.platform === 'win32')(
		'preserves existing bytes if permission changes fail',
		() => {
			tempDir = mkdtempSync(path.join(os.tmpdir(), 'assinafy-download-'));
			const output = path.join(tempDir, 'document.pdf');
			writeBinary(output, Buffer.from('existing document'));
			vi.mocked(fchmodSync).mockImplementationOnce(() => {
				throw Object.assign(new Error('operation not permitted'), { code: 'EPERM' });
			});

			expect(() => writeBinary(output, Buffer.from('replacement'), { force: true })).toThrow(
				/operation not permitted/,
			);
			expect(readFileSync(output, 'utf8')).toBe('existing document');
		},
	);

	it('refuses to overwrite an existing download by default', () => {
		tempDir = mkdtempSync(path.join(os.tmpdir(), 'assinafy-download-'));
		const output = path.join(tempDir, 'document.pdf');
		writeBinary(output, Buffer.from('first'));

		expect(() => writeBinary(output, Buffer.from('second'))).toThrow(/--force/);
		expect(readFileSync(output, 'utf8')).toBe('first');
	});

	it('overwrites only when force is explicit', () => {
		tempDir = mkdtempSync(path.join(os.tmpdir(), 'assinafy-download-'));
		const output = path.join(tempDir, 'document.pdf');
		writeBinary(output, Buffer.from('first document with a longer tail'));
		writeBinary(output, Buffer.from('second'), { force: true });

		expect(readFileSync(output, 'utf8')).toBe('second');
	});
});
