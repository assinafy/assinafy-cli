import { createHash } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import type { InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { AssinafyClient } from '../api';
import { CLI_OAUTH_REDIRECT_URI, connectOAuth } from './oauth-browser';

const issuer = 'https://auth.assinafy.com.br';
const resource = 'https://api.example.com';
const options = {
	clientId: 'example-public-client',
	redirectUri: CLI_OAUTH_REDIRECT_URI,
	scopes: ['documents:read'],
};
const tokens = {
	access_token: 'example-access',
	token_type: 'Bearer',
	expires_in: 3600,
	scope: 'documents:read',
};

function setup() {
	const client = new AssinafyClient({ baseUrl: `${resource}/v1`, apiKey: 'example-owner-secret' });
	const requests: InternalAxiosRequestConfig[] = [];
	client.getAxiosInstance().defaults.adapter = async (config) => {
		requests.push(config);
		const data =
			config.url === '/.well-known/oauth-protected-resource'
				? { resource, authorization_servers: [issuer] }
				: config.url === `${issuer}/.well-known/oauth-authorization-server`
					? { issuer, authorization_endpoint: `${issuer}/oauth/authorize` }
					: tokens;
		return { data, config, status: 200, statusText: 'OK', headers: {} };
	};
	return { oauth: client.oauth, requests };
}

function callback(authorizationUrl: string): URL {
	const authorization = new URL(authorizationUrl);
	const state = authorization.searchParams.get('state')!;
	expect(state).toMatch(/^[A-Za-z0-9_-]{43}\.\d{4,5}$/);
	const url = new URL(`http://127.0.0.1:${state.split('.')[1]}/callback`);
	url.search = new URLSearchParams({ state, iss: issuer, code: 'example-code' }).toString();
	return url;
}

function send(url: URL, options: { method?: string; host?: string; path?: string } = {}) {
	return new Promise<{ status: number; body: string; headers: Record<string, unknown> }>(
		(resolve, reject) => {
			const req = httpRequest(
				url,
				{
					method: options.method ?? 'GET',
					...(options.path ? { path: options.path } : {}),
					headers: options.host ? { Host: options.host } : {},
					agent: false,
				},
				(response) => {
					let body = '';
					response.setEncoding('utf8');
					response.on('data', (chunk) => {
						body += chunk;
					});
					response.on('end', () =>
						resolve({ status: response.statusCode!, body, headers: response.headers }),
					);
				},
			);
			req.once('error', reject);
			req.end();
		},
	);
}

describe('browser OAuth connection', () => {
	it('receives one loopback callback and exchanges local PKCE using the registered HTTPS redirect', async () => {
		const { oauth, requests } = setup();
		let authorization: URL;
		let local: URL;
		let browser: ReturnType<typeof send>;
		const result = await connectOAuth(oauth, options, async (url) => {
			authorization = new URL(url);
			local = callback(url);
			browser = send(local);
			await browser;
		});
		const response = await browser!;
		expect(response.status).toBe(200);
		expect(response.body).toContain('history.replaceState');
		expect(response.body).toContain('Volte ao terminal.');
		expect(response.body).toContain('https://integrations.assinafy.com.br/brand/site.css');
		expect(response.body).toContain(
			'https://integrations.assinafy.com.br/brand/assinafy-logotype.svg',
		);
		expect(response.body).not.toMatch(/example-code|example-access/);
		expect(response.headers).toMatchObject({
			'cache-control': 'no-store',
			'referrer-policy': 'no-referrer',
		});
		expect(response.headers['content-security-policy']).toContain("script-src 'sha256-");
		expect(response.headers['content-security-policy']).toContain(
			'style-src https://integrations.assinafy.com.br',
		);
		expect(response.body.match(/<script\b/g)).toHaveLength(1);
		expect(result).toEqual(tokens);
		const body = Object.fromEntries(new URLSearchParams(requests.at(-1)!.data));
		expect(body).toEqual({
			grant_type: 'authorization_code',
			code: 'example-code',
			client_id: options.clientId,
			redirect_uri: CLI_OAUTH_REDIRECT_URI,
			code_verifier: expect.any(String),
			resource,
		});
		expect(authorization!.searchParams.get('redirect_uri')).toBe(CLI_OAUTH_REDIRECT_URI);
		expect(authorization!.searchParams.get('code_challenge')).toBe(
			createHash('sha256').update(body.code_verifier!).digest('base64url'),
		);
		for (const request of requests) {
			expect(request.headers.get('X-Api-Key')).toBeUndefined();
			expect(request.headers.get('Authorization')).toBeUndefined();
		}
		await expect(send(local!)).rejects.toMatchObject({ code: 'ECONNREFUSED' });
	});

	it('ignores malformed, forged, and ambiguous callbacks while the legitimate session remains usable', async () => {
		const { oauth, requests } = setup();
		const results: number[] = [];
		let browser: Promise<void>;
		await connectOAuth(oauth, options, (authorization) => {
			browser = (async () => {
				const valid = callback(authorization);
				for (const mutate of [
					(url: URL) => url.searchParams.set('state', 'wrong'),
					(url: URL) => url.searchParams.set('iss', 'https://other.example.com'),
					(url: URL) => url.searchParams.append('state', 'duplicate'),
					(url: URL) => url.searchParams.append('code', 'duplicate'),
					(url: URL) => {
						url.searchParams.append('extra', 'one');
						url.searchParams.append('extra', 'two');
					},
					(url: URL) => url.searchParams.set('error', 'access_denied'),
					(url: URL) => url.searchParams.set('code', ''),
					(url: URL) => url.searchParams.set('code', ' \t'),
					(url: URL) => url.searchParams.set('state', `${url.searchParams.get('state')}\n`),
					(url: URL) => url.searchParams.append('iss', issuer),
					(url: URL) => {
						url.searchParams.delete('code');
						url.searchParams.set('error', ' ');
					},
					(url: URL) => {
						url.pathname = '/other';
					},
				]) {
					const malformed = new URL(valid);
					mutate(malformed);
					const response = await send(malformed);
					results.push(response.status);
					expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
					expect(response.body).toContain('Retorno inválido.');
					expect(response.body).not.toContain('example-code');
				}
				for (const opts of [
					{ method: 'POST' },
					{ host: 'other.example.com' },
					{ path: '//[invalid' },
				]) {
					results.push((await send(valid, opts)).status);
				}
				expect(requests.filter((sent) => sent.method === 'post')).toHaveLength(0);
				results.push((await send(valid)).status);
			})();
			return browser;
		});
		await browser!;
		expect(results).toEqual([...Array(15).fill(400), 200]);
		expect(requests.filter((sent) => sent.method === 'post')).toHaveLength(1);
	});

	it('accepts a consent denial once, closes the listener, and never exchanges a code', async () => {
		const { oauth, requests } = setup();
		let local: URL;
		let browser: ReturnType<typeof send>;
		await expect(
			connectOAuth(oauth, options, async (url) => {
				local = callback(url);
				local.searchParams.delete('code');
				local.searchParams.set('error', 'access_denied');
				browser = send(local);
				await browser;
			}),
		).rejects.toThrow(/declined or failed/);
		const response = await browser!;
		expect(response.status).toBe(200);
		expect(response.body).toContain('Conexão não autorizada.');
		expect(response.body).not.toContain('access_denied');
		expect(requests.filter((sent) => sent.method === 'post')).toHaveLength(0);
		await expect(send(local!)).rejects.toMatchObject({ code: 'ECONNREFUSED' });
	});

	it.each(['timeout', 'launch failure'] as const)(
		'closes the listener after %s',
		async (reason) => {
			const { oauth, requests } = setup();
			let local: URL;
			const connection = connectOAuth(
				oauth,
				options,
				async (url) => {
					local = callback(url);
					if (reason === 'launch failure') throw new Error('Launch failed');
				},
				50,
			);
			await expect(connection).rejects.toThrow();
			expect(requests.filter((sent) => sent.method === 'post')).toHaveLength(0);
			await expect(send(local!)).rejects.toMatchObject({ code: 'ECONNREFUSED' });
		},
	);

	it('rejects invalid time limits before discovery or binding a port', async () => {
		const { oauth, requests } = setup();
		for (const timeout of [0, -1, 600_001, Number.NaN, Number.MAX_SAFE_INTEGER]) {
			await expect(connectOAuth(oauth, options, async () => {}, timeout)).rejects.toThrow(
				/timeout/,
			);
		}
		expect(requests).toHaveLength(0);
	});
});
