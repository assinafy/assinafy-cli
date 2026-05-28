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

/** Coerce a string flag to an integer, or throw a friendly error. */
export function parseInteger(raw: string | undefined, flag: string): number | undefined {
	if (raw === undefined) return undefined;
	const n = Number.parseInt(raw, 10);
	if (!Number.isFinite(n)) {
		throw new CliError(`${flag} must be an integer.`);
	}
	return n;
}
