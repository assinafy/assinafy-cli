import pc from 'picocolors';
import { normalizeError } from './errors';

/** Subset of resolved config that controls how output is rendered. */
export interface OutputConfig {
	json: boolean;
	quiet: boolean;
}

/** Write a line to stdout. Used for primary command output. */
function writeOut(text: string): void {
	process.stdout.write(`${text}\n`);
}

/** Write a line to stderr. Used for status messages so stdout stays clean for piping. */
function writeErr(text: string): void {
	process.stderr.write(`${text}\n`);
}

/**
 * Print the primary result of a command.
 *
 * Under `--json` the structured `data` is emitted as pretty JSON on stdout.
 * Otherwise the `human` formatter renders a friendly view; if none is supplied
 * the data is pretty-printed as JSON.
 */
export function printData<T>(data: T, config: OutputConfig, human?: (data: T) => string): void {
	if (config.json) {
		writeOut(JSON.stringify(data, null, 2));
		return;
	}
	if (human) {
		writeOut(human(data));
		return;
	}
	writeOut(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

/** Print a success/status message. Suppressed under `--json` and `--quiet`. */
export function printSuccess(message: string, config: OutputConfig): void {
	if (config.json || config.quiet) return;
	writeErr(`${pc.green('✓')} ${message}`);
}

/** Print an informational message. Suppressed under `--json` and `--quiet`. */
export function printInfo(message: string, config: OutputConfig): void {
	if (config.json || config.quiet) return;
	writeErr(pc.dim(message));
}

/** Print a warning. Suppressed under `--json` and `--quiet`. */
export function printWarning(message: string, config: OutputConfig): void {
	if (config.json || config.quiet) return;
	writeErr(`${pc.yellow('!')} ${message}`);
}

/**
 * Print an error and set the process exit code. Under `--json` the normalized
 * error is emitted as JSON on stderr; otherwise a red, single-line message.
 */
export function printError(err: unknown, config: OutputConfig): void {
	const normalized = normalizeError(err);
	if (config.json) {
		writeErr(JSON.stringify({ error: normalized }, null, 2));
	} else {
		writeErr(`${pc.red('error:')} ${normalized.message}`);
		if (normalized.statusCode) {
			writeErr(pc.dim(`  (HTTP ${normalized.statusCode})`));
		}
	}
	process.exitCode = normalized.exitCode ?? 1;
}
