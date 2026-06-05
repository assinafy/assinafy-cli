import { CliError } from './errors';

/**
 * Parse a JSON string supplied on the command line into a record.
 * Throws a friendly {@link CliError} when the value is not valid JSON object.
 */
export function parseJsonObject(
	raw: string | undefined,
	flag: string,
): Record<string, unknown> | undefined {
	if (raw === undefined) return undefined;
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new CliError(`${flag} must be valid JSON.`);
	}
	if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new CliError(`${flag} must be a JSON object.`);
	}
	return parsed as Record<string, unknown>;
}

/**
 * Parse a JSON string into an array. Throws a friendly {@link CliError} when the
 * value is not a valid JSON array.
 */
export function parseJsonArray(raw: string | undefined, flag: string): unknown[] | undefined {
	if (raw === undefined) return undefined;
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new CliError(`${flag} must be valid JSON.`);
	}
	if (!Array.isArray(parsed)) {
		throw new CliError(`${flag} must be a JSON array.`);
	}
	return parsed;
}

/** Split a comma-separated flag value into a trimmed, non-empty string array. */
export function splitList(raw: string | undefined): string[] | undefined {
	if (raw === undefined) return undefined;
	const items = raw
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	return items;
}

/** Commander reducer for repeatable options: `--x a --x b` → `['a', 'b']`. */
export function collect(value: string, previous: string[] = []): string[] {
	return [...previous, value];
}

/**
 * Coerce a string flag to an integer, or throw a friendly error.
 *
 * Validates the WHOLE token (unlike `Number.parseInt`, which would silently
 * accept `5s` → 5 or `3.9` → 3). Pass `{ min }` to reject out-of-range values
 * (e.g. `--page`/`--per-page` require a value of at least 1).
 */
export function parseInteger(
	raw: string | undefined,
	flag: string,
	options: { min?: number } = {},
): number | undefined {
	if (raw === undefined) return undefined;
	const trimmed = raw.trim();
	if (!/^-?\d+$/.test(trimmed)) {
		throw new CliError(`${flag} must be an integer.`);
	}
	const n = Number(trimmed);
	if (options.min !== undefined && n < options.min) {
		throw new CliError(`${flag} must be ${options.min} or greater.`);
	}
	return n;
}
