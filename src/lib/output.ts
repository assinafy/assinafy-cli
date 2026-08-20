import pc from 'picocolors';
import { normalizeError } from './errors';
import { sanitizeTerminalText } from './terminal';

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

/** JSON permits literal C1 controls, but terminals do not. Escape them losslessly. */
function stringifyJson(value: unknown): string {
	const json = JSON.stringify(value, null, 2) ?? 'null';
	return json.replace(
		/[\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069]/g,
		(character) => `\\u${character.codePointAt(0)?.toString(16).padStart(4, '0')}`,
	);
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
		writeOut(stringifyJson(data));
		return;
	}
	if (human) {
		writeOut(human(data));
		return;
	}
	writeOut(typeof data === 'string' ? sanitizeTerminalText(data) : stringifyJson(data));
}

/** Print a complete paginated response as JSON while rendering only its rows for humans. */
export function printPaginatedData<T>(
	result: { data: T },
	config: OutputConfig,
	human: (data: T) => string,
): void {
	if (config.json) {
		printData(result, config);
		return;
	}
	printData(result.data, config, human);
}

/** Print a success/status message. Suppressed under `--json` and `--quiet`. */
export function printSuccess(message: string, config: OutputConfig): void {
	if (config.json || config.quiet) return;
	writeErr(`${pc.green('✓')} ${sanitizeTerminalText(message)}`);
}

/** Print an informational message. Suppressed under `--json` and `--quiet`. */
export function printInfo(message: string, config: OutputConfig): void {
	if (config.json || config.quiet) return;
	writeErr(pc.dim(sanitizeTerminalText(message)));
}

/** Print a warning. Suppressed under `--json` and `--quiet`. */
export function printWarning(message: string, config: OutputConfig): void {
	if (config.json || config.quiet) return;
	writeErr(`${pc.yellow('!')} ${sanitizeTerminalText(message)}`);
}

/**
 * Print an error and set the process exit code. Under `--json` the normalized
 * error is emitted as JSON on stderr; otherwise a red, single-line message.
 */
export function printError(err: unknown, config: OutputConfig): void {
	const normalized = normalizeError(err);
	if (config.json) {
		writeErr(stringifyJson({ error: normalized }));
	} else {
		writeErr(`${pc.red('error:')} ${sanitizeTerminalText(normalized.message)}`);
		if (normalized.statusCode) {
			writeErr(pc.dim(`  (HTTP ${normalized.statusCode})`));
		}
	}
	process.exitCode = normalized.exitCode ?? 1;
}
