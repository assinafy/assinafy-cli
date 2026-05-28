import { describe, expect, it } from 'vitest';
import { AssinafyClient } from '../api';
import { createClient, requireAccountId } from './client';
import { DEFAULT_BASE_URL, type ResolvedConfig } from './config';
import { CliError } from './errors';

function cfg(partial: Partial<ResolvedConfig>): ResolvedConfig {
	return {
		baseUrl: DEFAULT_BASE_URL,
		profile: 'default',
		json: false,
		quiet: false,
		...partial,
	};
}

describe('createClient', () => {
	it('throws a CliError when no credentials are present', () => {
		expect(() => createClient(cfg({}))).toThrow(CliError);
	});

	it('builds a client from an API key', () => {
		const client = createClient(cfg({ apiKey: 'k_abc', accountId: 'acc_1' }));
		expect(client).toBeInstanceOf(AssinafyClient);
	});

	it('builds a client from a legacy token', () => {
		const client = createClient(cfg({ token: 'jwt_abc' }));
		expect(client).toBeInstanceOf(AssinafyClient);
	});

	it('builds an unauthenticated client when explicitly allowed', () => {
		const client = createClient(cfg({}), { allowUnauthenticated: true });
		expect(client).toBeInstanceOf(AssinafyClient);
	});

	it('prefers a JWT token when requested', () => {
		const client = createClient(cfg({ apiKey: 'k_abc', token: 'jwt_abc' }), {
			preferToken: true,
		});
		const headers = client.getAxiosInstance().defaults.headers as Record<string, unknown>;
		expect(headers.Authorization).toBe('Bearer jwt_abc');
		expect(headers['X-Api-Key']).toBeUndefined();
	});

	it('requires a JWT token for token-only commands', () => {
		expect(() => createClient(cfg({ apiKey: 'k_abc' }), { preferToken: true })).toThrow(CliError);
	});
});

describe('requireAccountId', () => {
	it('prefers the override', () => {
		expect(requireAccountId(cfg({ accountId: 'def' }), 'over')).toBe('over');
	});

	it('falls back to the configured account', () => {
		expect(requireAccountId(cfg({ accountId: 'def' }))).toBe('def');
	});

	it('throws when neither is available', () => {
		expect(() => requireAccountId(cfg({}))).toThrow(CliError);
	});
});
