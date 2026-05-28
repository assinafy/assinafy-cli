import { describe, expect, it } from 'vitest';
import { ApiError, ValidationError } from '../api';
import { CliError, errorMessage, normalizeError } from './errors';

describe('normalizeError', () => {
	it('normalizes a CliError', () => {
		const n = normalizeError(new CliError('bad flag', { code: 'x' }));
		expect(n).toEqual({ message: 'bad flag', code: 'x' });
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
