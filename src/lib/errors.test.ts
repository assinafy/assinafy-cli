import { describe, expect, it } from 'vitest';
import { ApiError, PartialWorkflowError, ValidationError } from '../api';
import { CliError, errorMessage, normalizeError } from './errors';

describe('normalizeError', () => {
	it('normalizes a CliError', () => {
		const n = normalizeError(new CliError('bad flag', { code: 'x' }));
		expect(n).toEqual({ message: 'bad flag', code: 'x', exitCode: 1 });
	});

	it('carries a custom CliError exitCode through', () => {
		const n = normalizeError(new CliError('nope', { code: 'x', exitCode: 2 }));
		expect(n.exitCode).toBe(2);
	});

	it('normalizes an ApiError with status and details', () => {
		const n = normalizeError(new ApiError('nope', 401, { foo: 'bar' }));
		expect(n.code).toBe('api_error');
		expect(n.statusCode).toBe(401);
		expect(n.details).toEqual({ foo: 'bar' });
	});

	it('normalizes a ValidationError', () => {
		const n = normalizeError(new ValidationError('invalid', { field: 'email' }));
		expect(n.code).toBe('validation_error');
		expect(n.details).toEqual({ field: 'email' });
	});

	it('preserves OAuth challenges and retry delays through a partial workflow', () => {
		const cause = ApiError.fromResponse(
			403,
			{ error: 'insufficient_scope' },
			{
				'www-authenticate': 'Bearer error="insufficient_scope", scope="documents:write"',
				'retry-after': '60',
			},
		);
		for (const error of [
			cause,
			new PartialWorkflowError('Incomplete', { documentId: 'doc' }, { cause }),
		]) {
			expect(normalizeError(error)).toMatchObject({
				statusCode: 403,
				wwwAuthenticate: cause.wwwAuthenticate,
				retryAfter: '60',
			});
		}
	});

	it('keeps the underlying status and exposes the resources a partial workflow left behind', () => {
		const n = normalizeError(
			new PartialWorkflowError(
				'Saldo insuficiente. (document doc1 exists; 2 signer(s) created or reused)',
				{ documentId: 'doc1', signerIds: ['sig1', 'sig2'] },
				{ cause: new ApiError('Saldo insuficiente.', 402) },
			),
		);
		expect(n.code).toBe('api_error');
		expect(n.statusCode).toBe(402);
		expect(n.details).toEqual({ documentId: 'doc1', signerIds: ['sig1', 'sig2'] });
		expect(n.message).toContain('doc1');
	});

	it('handles plain Errors and non-errors', () => {
		expect(normalizeError(new Error('boom')).code).toBe('unexpected_error');
		expect(normalizeError('a string').message).toBe('a string');
	});
});

describe('errorMessage', () => {
	it('extracts a message', () => {
		expect(errorMessage(new Error('hello'))).toBe('hello');
	});

	it('falls back when empty', () => {
		expect(errorMessage('', 'fallback')).toBe('fallback');
	});
});

describe('CliError', () => {
	it('defaults code and exitCode', () => {
		const e = new CliError('msg');
		expect(e.code).toBe('cli_error');
		expect(e.exitCode).toBe(1);
	});
});
