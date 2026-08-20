import { inspect } from 'node:util';
import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from './errors';
import {
	cleanParams,
	handleAssinafyResponse,
	requireIso8601,
	signerAccessConfig,
	toSdkError,
} from './utils';

describe('handleAssinafyResponse', () => {
	it('unwraps successful Assinafy envelopes', () => {
		expect(handleAssinafyResponse({ status: 200, message: '', data: { id: '1' } })).toEqual({
			id: '1',
		});
	});

	it('throws ApiError for failed envelopes', () => {
		expect(() => handleAssinafyResponse({ status: 400, message: 'Bad request', data: [] })).toThrow(
			ApiError,
		);
	});

	it('passes through non-envelope responses', () => {
		expect(handleAssinafyResponse({ ok: true })).toEqual({ ok: true });
	});
});

describe('cleanParams', () => {
	it('drops nullish params and normalizes per_page to the documented per-page key', () => {
		expect(cleanParams({ page: 2, per_page: 50, search: undefined, tags: null })).toEqual({
			page: 2,
			'per-page': 50,
		});
	});

	it('keeps an explicitly documented per-page key unchanged', () => {
		expect(cleanParams({ 'per-page': 25 })).toEqual({ 'per-page': 25 });
	});
});

it('does not let caller params override the trusted signer access code', () => {
	expect(signerAccessConfig('trusted', { 'signer-access-code': 'untrusted' }).params).toEqual({
		'signer-access-code': 'trusted',
	});
});

describe('requireIso8601', () => {
	it('accepts real calendar timestamps and rejects normalized impossible dates', () => {
		expect(requireIso8601('2028-02-29T23:59:59.123-03:00')).toBe('2028-02-29T23:59:59.123-03:00');
		for (const invalid of [
			'2026-02-29T00:00:00Z',
			'2026-02-31T00:00:00Z',
			'2026-04-31T00:00:00Z',
			'2026-01-01T24:00:00Z',
			'2026-01-01T00:00:00+14:01',
		]) {
			expect(() => requireIso8601(invalid)).toThrow('must be a valid ISO 8601 timestamp');
		}
	});
});

describe('toSdkError', () => {
	it('does not retain Axios request credentials or payloads on network errors', () => {
		const error = new AxiosError('socket closed', 'ECONNRESET', {
			headers: { 'X-Api-Key': 'header-secret' },
			data: { password: 'body-secret' },
			params: { 'signer-access-code': 'query-secret' },
		} as never);
		const wrapped = toSdkError(error, 'Request failed');
		const exposed = `${inspect(wrapped, { depth: 10, showHidden: true })}\n${JSON.stringify(wrapped)}`;

		expect(wrapped).toBeInstanceOf(NetworkError);
		expect(exposed).not.toContain('header-secret');
		expect(exposed).not.toContain('body-secret');
		expect(exposed).not.toContain('query-secret');
	});
});
