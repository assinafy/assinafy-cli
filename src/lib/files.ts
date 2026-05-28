import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CliError } from './errors';

/** Read a binary file into a Buffer, with a friendly error on failure. */
export function readBinary(inputPath: string): Buffer {
	try {
		return readFileSync(path.resolve(inputPath));
	} catch (err) {
		throw new CliError(
			`Failed to read file "${inputPath}": ${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

/**
 * Write a downloaded binary artifact to disk and return the absolute path.
 * Throws a friendly error if the file cannot be written.
 */
export function writeBinary(outputPath: string, data: Buffer): string {
	const resolved = path.resolve(outputPath);
	try {
		writeFileSync(resolved, data);
	} catch (err) {
		throw new CliError(
			`Failed to write file "${resolved}": ${err instanceof Error ? err.message : String(err)}`,
		);
	}
	return resolved;
}

/** Build a sensible default output filename for a document artifact download. */
export function defaultArtifactFilename(documentId: string, artifact: string): string {
	const ext = artifact === 'thumbnail' ? 'jpg' : 'pdf';
	return `${documentId}-${artifact}.${ext}`;
}
