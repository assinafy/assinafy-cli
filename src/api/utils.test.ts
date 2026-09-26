import { inspect } from 'node:util';
import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from './errors';
import {
	appendFilePart,
	cleanParams,
	handleAssinafyResponse,
	requireIso8601,
	signerAccessConfig,
	stripEmpty,
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

describe('stripEmpty', () => {
	it('drops nullish body fields without renaming keys', () => {
		expect(stripEmpty({ name: 'Ana', email: undefined, color: null, per_page: 50 })).toEqual({
			name: 'Ana',
			per_page: 50,
		});
	});

	it('keeps falsy values that are meaningful in a body', () => {
		expect(stripEmpty({ step: 0, force: false, message: '' })).toEqual({
			step: 0,
			force: false,
			message: '',
		});
	});
});

describe('appendFilePart', () => {
	it('appends a typed, named file part over the exact buffer bytes', async () => {
		const form = new FormData();
		const bytes = Buffer.from([0, 1, 2, 3, 255]);
		appendFilePart(form, bytes.subarray(1, 4), 'image/webp', 'brand.webp');
		const file = form.get('file') as Blob & { name: string };
		expect(file.name).toBe('brand.webp');
		expect(file.type).toBe('image/webp');
		expect(Buffer.from(await file.arrayBuffer())).toEqual(Buffer.from([1, 2, 3]));
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
	it('decodes JSON API errors returned from binary download requests', () => {
		const wrapped = toSdkError(
			{
				isAxiosError: true,
				response: {
					status: 404,
					data: Buffer.from('{"status":404,"message":"Artifact unavailable","data":null}'),
				},
			},
			'Download failed',
		);
		expect(wrapped).toBeInstanceOf(ApiError);
		expect(wrapped.message).toBe('Artifact unavailable');
		expect((wrapped as ApiError).responseData).toEqual({
			status: 404,
			message: 'Artifact unavailable',
			data: null,
		});
	});

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
