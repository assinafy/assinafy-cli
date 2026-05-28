import { describe, expect, it } from 'vitest';
import { cleanParams, handleAssinafyResponse } from './utils';
import { ApiError } from './errors';

describe('handleAssinafyResponse', () => {
	it('unwraps successful Assinafy envelopes', () => {
		expect(handleAssinafyResponse({ status: 200, message: '', data: { id: '1' } })).toEqual({
			id: '1',
		});
	});

	it('throws ApiError for failed envelopes', () => {
		expect(() =>
			handleAssinafyResponse({ status: 400, message: 'Bad request', data: [] }),
		).toThrow(ApiError);
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
