import axios, { type AxiosRequestConfig } from 'axios';
import { ApiError, AssinafyError, NetworkError, ValidationError } from './errors.js';
import type { DocumentArtifactName, IDocumentStatsParams, Logger } from './types.js';

const DOCUMENT_ARTIFACT_NAMES: readonly DocumentArtifactName[] = [
	'original',
	'certificated',
	'certificate-page',
	'pades',
	'bundle',
];

/**
 * Unwrap the Assinafy API envelope `{ status, message, data }`.
 * Throws {@link ApiError} when the envelope reports a non-success status.
 */
export function handleAssinafyResponse<T>(response: unknown): T {
	const resp = response as { status?: number; data?: T; message?: string } | null | undefined;

	if (resp && typeof resp === 'object' && resp.status !== undefined && 'data' in resp) {
		if ((resp.status as number) >= 200 && (resp.status as number) < 300) {
			return resp.data as T;
		}
		throw ApiError.fromResponse(resp.status as number, resp);
	}

	return response as T;
}

/**
 * Convert an unknown thrown value into a typed SDK error.
 * Axios errors become {@link ApiError} / {@link NetworkError}; SDK errors pass through.
 */
export function toSdkError(error: unknown, fallbackMessage: string): AssinafyError {
	if (error instanceof AssinafyError) {
		return error;
	}

	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		if (status) {
			return ApiError.fromResponse(status, error.response?.data ?? null);
		}
		// Axios errors retain the complete request config, including auth headers,
		// body, and query values. Never attach the raw error as a public cause.
		return new NetworkError(`${fallbackMessage}: ${error.message}`);
	}

	if (error instanceof Error) {
		return new AssinafyError(`${fallbackMessage}: ${error.message}`, {}, { cause: error });
	}

	return new AssinafyError(fallbackMessage, { cause: error });
}

/** No-op logger used when the caller does not supply one. */
export function createNoopLogger(): Logger {
	return {
		debug: () => undefined,
		info: () => undefined,
		warn: () => undefined,
		error: () => undefined,
	};
}

/** Strip undefined values from a params record (Axios sends `undefined` as literal). */
export function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			out[normalizeQueryKey(key)] = value;
		}
	}
	return out;
}

/** Remove owner credentials from a request that is public or signer-authenticated. */
export function publicRequestConfig(config: AxiosRequestConfig = {}): AxiosRequestConfig {
	return {
		...config,
		headers: { ...config.headers, Authorization: undefined, 'X-Api-Key': undefined },
	};
}

/** Build an isolated signer-access-code request config. */
export function signerAccessConfig(
	signerAccessCode: string,
	params: Record<string, unknown> = {},
	headers: Record<string, string> = {},
): AxiosRequestConfig {
	return publicRequestConfig({
		params: cleanParams({ ...params, 'signer-access-code': signerAccessCode }),
		headers,
	});
}

/** Validate an RFC 3339 timestamp before it reaches an API request body. */
export function requireIso8601(value: string, name = 'timestamp'): string {
	const match =
		/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.[0-9]+)?(?:Z|[+-]([0-9]{2}):([0-9]{2}))$/.exec(
			value,
		);
	if (!match) {
		throw new ValidationError(`${name} must be a valid ISO 8601 timestamp`);
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const hour = Number(match[4]);
	const minute = Number(match[5]);
	const second = Number(match[6]);
	const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	const timezoneHour = match[7] === undefined ? 0 : Number(match[7]);
	const timezoneMinute = match[8] === undefined ? 0 : Number(match[8]);

	if (
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > (daysInMonth[month - 1] ?? 0) ||
		hour > 23 ||
		minute > 59 ||
		second > 59 ||
		timezoneHour > 14 ||
		(timezoneHour === 14 && timezoneMinute !== 0) ||
		timezoneMinute > 59 ||
		!Number.isFinite(Date.parse(value))
	) {
		throw new ValidationError(`${name} must be a valid ISO 8601 timestamp`);
	}
	return value;
}

/** Validate and serialize the query shared by account/user statistics endpoints. */
export function documentStatsParams(params: IDocumentStatsParams = {}): Record<string, unknown> {
	if (params.granularity !== undefined && !['monthly', 'daily'].includes(params.granularity)) {
		throw new ValidationError('granularity must be monthly or daily');
	}
	if (params.month !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(params.month)) {
		throw new ValidationError('month must use YYYY-MM format');
	}
	if (params.granularity === 'daily' && !params.month) {
		throw new ValidationError('month is required for daily statistics');
	}
	return cleanParams(params as Record<string, unknown>);
}

/** Validate an artifact before it is interpolated into a request path. */
export function requireDocumentArtifactName(value: string): DocumentArtifactName {
	if ((DOCUMENT_ARTIFACT_NAMES as readonly string[]).includes(value)) {
		return value as DocumentArtifactName;
	}
	throw new ValidationError(`artifact must be one of: ${DOCUMENT_ARTIFACT_NAMES.join(', ')}`);
}

/** Validate a signer image type before it is interpolated into a request path. */
export function requireSignerImageType(value: string): 'signature' | 'initial' {
	if (value === 'signature' || value === 'initial') return value;
	throw new ValidationError('image type must be signature or initial');
}

/** Validate a live-supported sort value before sending it to an endpoint. */
export function requireSort<T extends string>(
	value: T | undefined,
	allowed: readonly T[],
): T | undefined {
	if (value === undefined || allowed.includes(value)) return value;
	throw new ValidationError(`sort must be one of: ${allowed.join(', ')}`);
}

function normalizeQueryKey(key: string): string {
	return key === 'per_page' ? 'per-page' : key;
}

/** Strip a single trailing slash from a base URL, so paths can always join with a leading `/`. */
export function normalizeBaseUrl(raw: string): string {
	return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}
