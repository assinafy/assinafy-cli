import { ApiError, AssinafyError, NetworkError, ValidationError } from '../api';

/**
 * A user-facing CLI error. Thrown for problems we detect before (or instead of)
 * an API call — missing credentials, bad flag combinations, unreadable files.
 * Carries no stack noise: the message is meant to be shown verbatim.
 */
export class CliError extends Error {
	readonly code: string;
	readonly exitCode: number;

	constructor(message: string, options: { code?: string; exitCode?: number } = {}) {
		super(message);
		this.name = 'CliError';
		this.code = options.code ?? 'cli_error';
		this.exitCode = options.exitCode ?? 1;
	}
}

/** Structured, normalized view of any error for both human and JSON output. */
export interface NormalizedError {
	message: string;
	code: string;
	statusCode?: number;
	details?: unknown;
}

/** Turn any thrown value into a normalized, presentable error. */
export function normalizeError(err: unknown): NormalizedError {
	if (err instanceof CliError) {
		return { message: err.message, code: err.code };
	}
	if (err instanceof ApiError) {
		return {
			message: err.message,
			code: 'api_error',
			statusCode: err.statusCode,
			details: err.responseData ?? undefined,
		};
	}
	if (err instanceof ValidationError) {
		return { message: err.message, code: 'validation_error', details: err.errors };
	}
	if (err instanceof NetworkError) {
		return { message: err.message, code: 'network_error' };
	}
	if (err instanceof AssinafyError) {
		return { message: err.message, code: 'sdk_error', details: err.context };
	}
	if (err instanceof Error) {
		return { message: err.message, code: 'unexpected_error' };
	}
	return { message: String(err), code: 'unexpected_error' };
}

/** Best-effort single-line message from any thrown value. */
export function errorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
	const normalized = normalizeError(err);
	return normalized.message || fallback;
}
