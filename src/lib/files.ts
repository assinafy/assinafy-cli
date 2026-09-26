import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CliError } from './errors';
import { type OutputConfig, printData, printSuccess } from './output';
import { withSpinner } from './spinner';
import { sanitizeTerminalText } from './terminal';

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
export function writeBinary(
	outputPath: string,
	data: Buffer,
	options: { force?: boolean } = {},
): string {
	const resolved = path.resolve(outputPath);
	try {
		writeFileSync(resolved, data, { flag: options.force ? 'w' : 'wx' });
	} catch (err) {
		if (err && typeof err === 'object' && 'code' in err && err.code === 'EEXIST') {
			throw new CliError(`File "${resolved}" already exists. Pass --force to overwrite it.`);
		}
		throw new CliError(
			`Failed to write file "${resolved}": ${err instanceof Error ? err.message : String(err)}`,
		);
	}
	return resolved;
}

/** Build a sensible default output filename for a document artifact download. */
export function defaultArtifactFilename(documentId: string, artifact: string): string {
	const ext = artifact === 'thumbnail' ? 'jpg' : artifact === 'bundle' ? 'zip' : 'pdf';
	return `${documentId}-${artifact}.${ext}`;
}

export interface SaveDownloadOptions {
	/** Spinner label while the download runs. */
	message: string;
	/** Fetch the artifact bytes. */
	download: () => Promise<Buffer>;
	/** Explicit `--output` path; falls back to `defaultName`. */
	output?: string;
	defaultName: string;
	force?: boolean;
	/** Extra fields merged into the JSON result after `path` and `bytes`. */
	data?: Record<string, unknown>;
}

/** Download a binary artifact with a spinner, write it to disk, and report the result. */
export async function saveDownload(
	config: OutputConfig,
	options: SaveDownloadOptions,
): Promise<void> {
	const buffer = await withSpinner(options.message, config, options.download);
	const out = writeBinary(options.output ?? options.defaultName, buffer, { force: options.force });
	printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
	printData({ path: out, bytes: buffer.byteLength, ...options.data }, config, (d) =>
		sanitizeTerminalText(d.path),
	);
}
