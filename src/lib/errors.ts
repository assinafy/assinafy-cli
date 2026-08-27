import {
	ApiError,
	AssinafyError,
	NetworkError,
	PartialWorkflowError,
	ValidationError,
} from '../api';

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
	/** Process exit code to use (carried from {@link CliError}); defaults to 1. */
	exitCode?: number;
	details?: unknown;
}

/** Turn any thrown value into a normalized, presentable error. */
export function normalizeError(err: unknown): NormalizedError {
	if (err instanceof CliError) {
		return { message: err.message, code: err.code, exitCode: err.exitCode };
	}
	if (err instanceof ApiError) {
		return {
			message: err.message,
			code: 'api_error',
			statusCode: err.statusCode,
			details: err.responseData ?? undefined,
		};
	}
	// Keep the underlying code/status so a half-finished workflow still reports
	// *why* it failed; the created resource IDs ride along in `details`.
	if (err instanceof PartialWorkflowError) {
		const cause = normalizeError(err.cause);
		const normalized: NormalizedError = {
			message: err.message,
			code: cause.code,
			details: err.context,
		};
		if (cause.statusCode !== undefined) normalized.statusCode = cause.statusCode;
		return normalized;
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
