import { createHash } from 'node:crypto';
import { inspect } from 'node:util';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { AssinafyClient } from '../client';
import { ApiError } from '../errors';
import type { IOAuthAuthorizationRequest, IOAuthTokenPayload } from '../types';

const issuer = 'https://auth.example.com';
const resource = 'https://api.example.com';
const tokens = {
	access_token: 'example-access',
	token_type: 'Bearer',
	expires_in: 3600,
	scope: 'documents:read openid',
	refresh_token: 'example-refresh',
	id_token: 'example-id-token',
};

function setup(token?: string) {
	const client = new AssinafyClient({
		baseUrl: `${resource}/v1`,
		...(token ? { token } : { apiKey: 'owner-secret' }),
	});
	const requests: InternalAxiosRequestConfig[] = [];
	client.getAxiosInstance().defaults.adapter = async (config) => {
		requests.push(config);
		const url = client.getAxiosInstance().getUri(config);
		let data: unknown;
		switch (url) {
			case `${resource}/.well-known/oauth-protected-resource`:
				data = {
					resource,
					authorization_servers: [issuer],
					scopes_supported: ['documents:read'],
					bearer_methods_supported: ['header'],
				};
				break;
			case `${issuer}/.well-known/oauth-authorization-server`:
				data = {
					issuer,
					authorization_endpoint: `${issuer}/oauth/authorize`,
					token_endpoint: `${resource}/v1/oauth/token`,
					response_types_supported: ['code'],
				};
				break;
			case `${resource}/v1/oauth/token`:
				data = tokens;
				break;
			case `${resource}/v1/oauth/revoke`:
				data = '';
				break;
			case `${resource}/v1/oauth/userinfo`:
				data = { sub: 'example-user', name: null, email: null };
				break;
			default:
				throw new Error(`Unexpected request: ${url}`);
		}
		return { data, status: 200, statusText: 'OK', headers: {}, config };
	};
	return { client, requests };
}

async function authorize(client: AssinafyClient): Promise<IOAuthAuthorizationRequest> {
	return client.oauth.authorize({
		clientId: 'example-app',
		redirectUri: 'https://example.com/callback?environment=test',
		scopes: ['documents:read', 'openid', 'offline_access'],
	});
}

function callback(request: IOAuthAuthorizationRequest): URL {
	const url = new URL(request.redirect_uri);
	url.searchParams.set('code', 'example-code');
	url.searchParams.set('state', request.state);
	url.searchParams.set('iss', request.issuer);
	return url;
}

describe('OAuth flow', () => {
	it('discovers at the correct origins, generates S256 PKCE, and exchanges a validated callback', async () => {
		const { client, requests } = setup();
		const request = await authorize(client);
		const url = new URL(request.authorization_url);
		expect(url.origin).toBe(issuer);
		expect(Object.fromEntries(url.searchParams)).toEqual({
			response_type: 'code',
			client_id: 'example-app',
			redirect_uri: request.redirect_uri,
			scope: 'documents:read openid offline_access',
			state: request.state,
			code_challenge: createHash('sha256').update(request.code_verifier).digest('base64url'),
			code_challenge_method: 'S256',
			resource,
			nonce: request.nonce,
		});
		expect(request.code_verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(request.state).toHaveLength(43);
		expect(request.nonce).toHaveLength(43);
		const result = await client.oauth.exchangeCode(
			callback(request).toString(),
			request,
			'client-secret',
		);
		expect(result).toEqual(tokens);
		expect(JSON.parse(requests.at(-1)!.data)).toEqual({
			grant_type: 'authorization_code',
			code: 'example-code',
			client_id: 'example-app',
			client_secret: 'client-secret',
			redirect_uri: request.redirect_uri,
			code_verifier: request.code_verifier,
			resource,
		});
		const second = await authorize(client);
		expect(second.code_verifier).not.toBe(request.code_verifier);
		expect(second.state).not.toBe(request.state);
		for (const sent of requests) {
			expect(sent.headers.get('Authorization')).toBeUndefined();
			expect(sent.headers.get('X-Api-Key')).toBeUndefined();
		}
	});

	it('refreshes and revokes without an owner credential or a public-client secret', async () => {
		const { client, requests } = setup('owner-bearer');
		await expect(
			client.oauth.token({
				grant_type: 'refresh_token',
				refresh_token: 'old-refresh',
				client_id: 'example-app',
			}),
		).resolves.toEqual(tokens);
		await expect(
			client.oauth.revoke({
				token: 'example-refresh',
				client_id: 'example-app',
				token_type_hint: 'refresh_token',
			}),
		).resolves.toBeUndefined();
		expect(requests.map((sent) => [sent.method, sent.url, JSON.parse(sent.data)])).toEqual([
			[
				'post',
				'/oauth/token',
				{ grant_type: 'refresh_token', refresh_token: 'old-refresh', client_id: 'example-app' },
			],
			[
				'post',
				'/oauth/revoke',
				{ token: 'example-refresh', client_id: 'example-app', token_type_hint: 'refresh_token' },
			],
		]);
		for (const sent of requests) {
			expect(sent.headers.get('Authorization')).toBeUndefined();
			expect(sent.headers.get('X-Api-Key')).toBeUndefined();
			expect(sent.headers.getContentType()).toBe('application/json');
		}
	});

	it('preserves repeated registered query values and rejects injected duplicates', async () => {
		const { client, requests } = setup();
		const request = await client.oauth.authorize({
			clientId: 'example-app',
			redirectUri: 'https://example.com/callback?destination=a&destination=b',
			scopes: ['documents:read'],
		});
		expect(request.nonce).toBeUndefined();
		const url = callback(request);
		await expect(client.oauth.exchangeCode(url.toString(), request)).resolves.toEqual(tokens);
		url.searchParams.append('destination', 'injected');
		await expect(client.oauth.exchangeCode(url.toString(), request)).rejects.toThrow(
			/redirect URI/,
		);
		expect(requests.filter((sent) => sent.method === 'post')).toHaveLength(1);
	});

	it('keeps OIDC claims flat and authenticates userinfo with a bearer token', async () => {
		const { client, requests } = setup('oauth-access');
		await expect(client.oauth.userinfo()).resolves.toEqual({
			sub: 'example-user',
			name: null,
			email: null,
		});
		expect(requests[0]!.headers.get('Authorization')).toBe('Bearer oauth-access');
		expect(requests[0]!.headers.get('X-Api-Key')).toBeUndefined();
	});

	it('rejects mismatched and ambiguous callbacks before submitting a code', async () => {
		const { client, requests } = setup();
		const request = await authorize(client);
		for (const modify of [
			(url: URL) => url.searchParams.set('state', 'wrong'),
			(url: URL) => url.searchParams.delete('state'),
			(url: URL) => url.searchParams.set('iss', 'https://wrong.example.com'),
			(url: URL) => url.searchParams.delete('iss'),
			(url: URL) => url.searchParams.append('code', 'another'),
			(url: URL) => url.searchParams.set('error', 'access_denied'),
			(url: URL) => {
				url.pathname = '/different';
			},
			(url: URL) => {
				url.protocol = 'http:';
			},
			(url: URL) => url.searchParams.set('environment', 'different'),
		]) {
			const url = callback(request);
			modify(url);
			await expect(client.oauth.exchangeCode(url.toString(), request)).rejects.toThrow();
		}
		expect(requests).toHaveLength(2);
	});

	it.each([
		['invalid_scope', 'invalid_scope'],
		['https://example.com/?code=private-code\n', 'unknown_error'],
	])('reports the authorization error safely for %j', async (returned, expected) => {
		const { client, requests } = setup();
		const request = await authorize(client);
		const url = callback(request);
		url.searchParams.delete('code');
		url.searchParams.set('error', returned);
		const error = await client.oauth.exchangeCode(url.toString(), request).catch((error) => error);
		expect(error).toMatchObject({
			message: `OAuth authorization was declined or failed: ${expected}`,
			errors: { oauthError: expected },
		});
		expect(inspect(error)).not.toMatch(/private-code|code_verifier|owner-secret/);
		expect(requests).toHaveLength(2);
	});

	it('rejects invalid grants, PKCE, and insecure URLs before network access', async () => {
		const { client, requests } = setup();
		const base = {
			grant_type: 'authorization_code',
			code: 'example-code',
			client_id: 'example-app',
			redirect_uri: 'https://example.com/callback',
			code_verifier: 'a'.repeat(43),
		} as const;
		for (const payload of [
			{ ...base, code_verifier: 'short' },
			{ ...base, code_verifier: 'a'.repeat(129) },
			{ ...base, code_verifier: '+'.repeat(43) },
			{ ...base, code: '' },
			{ ...base, redirect_uri: 'http://localhost/callback' },
			{ ...base, client_secret: '' },
			{ ...base, grant_type: 'client_credentials' },
			{ grant_type: 'refresh_token', client_id: 'example-app', refresh_token: '' },
		]) {
			await expect(client.oauth.token(payload as IOAuthTokenPayload)).rejects.toThrow();
		}
		await expect(
			client.oauth.authorize({
				clientId: 'app',
				redirectUri: 'https://example.com/#fragment',
				scopes: ['documents:read'],
			}),
		).rejects.toThrow();
		await expect(
			client.oauth.authorize({
				clientId: 'app',
				redirectUri: 'https://example.com/',
				scopes: ['documents:read offline_access'],
			}),
		).rejects.toThrow();
		await expect(client.oauth.discovery('http://example.com')).rejects.toThrow();
		await expect(
			client.oauth.revoke({
				client_id: 'app',
				token: 'token',
				token_type_hint: 'invalid' as never,
			}),
		).rejects.toThrow();
		expect(requests).toHaveLength(0);
	});

	it('rejects a mismatched discovered issuer', async () => {
		const { client } = setup();
		client.getAxiosInstance().defaults.adapter = async (config) => ({
			data: {
				issuer: 'https://wrong.example.com',
				authorization_endpoint: `${issuer}/oauth/authorize`,
			},
			status: 200,
			statusText: 'OK',
			headers: {},
			config,
		});
		await expect(client.oauth.discovery(issuer)).rejects.toThrow('OAuth issuer mismatch');
	});

	it('preserves OAuth errors and challenges without retaining credentials or retrying', async () => {
		const { client } = setup();
		let attempts = 0;
		client.getAxiosInstance().defaults.adapter = async (config) => {
			attempts++;
			throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, {
				status: 403,
				statusText: 'Forbidden',
				config,
				data: { error: 'insufficient_scope', error_description: 'Consent required' },
				headers: {
					'www-authenticate': 'Bearer error="insufficient_scope", scope="documents:write"',
					'retry-after': '60',
				},
			});
		};
		const error = await client.oauth
			.token({
				grant_type: 'refresh_token',
				client_id: 'app',
				client_secret: 'private-secret',
				refresh_token: 'private-refresh',
			})
			.catch((error: unknown) => error);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({
			statusCode: 403,
			responseData: { error: 'insufficient_scope' },
			wwwAuthenticate: expect.stringContaining('documents:write'),
			retryAfter: '60',
		});
		expect(inspect(error, { depth: 10, showHidden: true })).not.toMatch(
			/private-secret|private-refresh|owner-secret/,
		);
		expect(attempts).toBe(1);
	});
});
