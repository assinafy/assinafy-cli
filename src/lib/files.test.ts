import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultArtifactFilename, writeBinary } from './files';

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
		writeBinary(output, Buffer.from('first'));
		writeBinary(output, Buffer.from('second'), { force: true });

		expect(readFileSync(output, 'utf8')).toBe('second');
	});
});
