import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ValidationError } from '../errors.js';
import type {
	IOAuthAuthorizationOptions,
	IOAuthAuthorizationRequest,
	IOAuthAuthorizationServer,
	IOAuthProtectedResource,
	IOAuthRevokePayload,
	IOAuthTokenPayload,
	IOAuthTokenResponse,
	IOAuthUserInfo,
} from '../types.js';
import { publicRequestConfig } from '../utils.js';
import { BaseResource } from './base.js';

/** OAuth 2.1 with S256 PKCE. Tokens are returned to the caller, never saved or retried. */
export class OAuthResource extends BaseResource {
	/** `GET /.well-known/oauth-protected-resource` at the API origin, outside `/v1`. */
	async metadata(): Promise<IOAuthProtectedResource> {
		return this.call('Failed to discover OAuth resource', () =>
			this.http.get(
				'/.well-known/oauth-protected-resource',
				publicRequestConfig({
					baseURL: new URL(this.http.defaults.baseURL!).origin,
				}),
			),
		);
	}

	/** Read RFC 8414 metadata from an HTTPS issuer and verify its issuer identity. */
	async discovery(issuer: string): Promise<IOAuthAuthorizationServer> {
		const url = httpsUrl(issuer, 'issuer');
		if (url.search || url.pathname !== '/') {
			throw new ValidationError('issuer must be an HTTPS origin');
		}
		const metadata = await this.call<IOAuthAuthorizationServer>(
			'Failed to discover OAuth authorization server',
			() =>
				this.http.get(
					`${url.origin}/.well-known/oauth-authorization-server`,
					publicRequestConfig(),
				),
		);
		if (metadata.issuer !== issuer) throw new ValidationError('OAuth issuer mismatch');
		httpsUrl(metadata.authorization_endpoint, 'authorization_endpoint');
		return metadata;
	}

	/** Discover endpoints and create a fresh authorization URL, PKCE verifier, and state. */
	async authorize(options: IOAuthAuthorizationOptions): Promise<IOAuthAuthorizationRequest> {
		required(options.clientId, 'clientId');
		httpsUrl(options.redirectUri, 'redirectUri');
		if (
			!Array.isArray(options.scopes) ||
			options.scopes.length === 0 ||
			options.scopes.some(
				(scope) => typeof scope !== 'string' || !/^[\x21\x23-\x5B\x5D-\x7E]+$/.test(scope),
			)
		) {
			throw new ValidationError('scopes must contain non-empty OAuth scope names');
		}
		const resource = await this.metadata();
		const issuer = resource.authorization_servers?.[0];
		if (!issuer) throw new ValidationError('OAuth metadata has no authorization server');
		httpsUrl(resource.resource, 'resource');
		const server = await this.discovery(issuer);
		const codeVerifier = randomBytes(32).toString('base64url');
		const state = randomBytes(32).toString('base64url');
		const nonce = options.scopes.includes('openid')
			? randomBytes(32).toString('base64url')
			: undefined;
		const url = new URL(server.authorization_endpoint);
		const params = {
			response_type: 'code',
			client_id: options.clientId,
			redirect_uri: options.redirectUri,
			scope: options.scopes.join(' '),
			state,
			code_challenge: createHash('sha256').update(codeVerifier).digest('base64url'),
			code_challenge_method: 'S256',
			resource: resource.resource,
		};
		for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
		if (nonce) url.searchParams.set('nonce', nonce);
		return {
			authorization_url: url.toString(),
			code_verifier: codeVerifier,
			state,
			issuer,
			client_id: options.clientId,
			redirect_uri: options.redirectUri,
			resource: resource.resource,
			...(nonce ? { nonce } : {}),
		};
	}

	/** Validate callback URI, state, and issuer before exchanging its one-time code. */
	async exchangeCode(
		callbackUrl: string,
		request: IOAuthAuthorizationRequest,
		clientSecret?: string,
	): Promise<IOAuthTokenResponse> {
		const callback = httpsUrl(callbackUrl, 'callbackUrl');
		const redirect = httpsUrl(request.redirect_uri, 'redirect_uri');
		if (
			callback.origin !== redirect.origin ||
			callback.pathname !== redirect.pathname ||
			[...new Set(redirect.searchParams.keys())].some((key) => {
				const expected = redirect.searchParams.getAll(key);
				const actual = callback.searchParams.getAll(key);
				return (
					expected.length !== actual.length || expected.some((value, i) => value !== actual[i])
				);
			})
		) {
			throw new ValidationError('OAuth callback does not match the registered redirect URI');
		}
		for (const key of ['state', 'iss', 'code', 'error']) {
			if (callback.searchParams.getAll(key).length > 1) {
				throw new ValidationError(`Duplicate OAuth callback parameter: ${key}`);
			}
		}
		const actual = Buffer.from(callback.searchParams.get('state') ?? '');
		const expected = Buffer.from(required(request.state, 'state'));
		if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
			throw new ValidationError('OAuth state mismatch');
		}
		if (callback.searchParams.get('iss') !== request.issuer) {
			throw new ValidationError('OAuth issuer mismatch');
		}
		if (callback.searchParams.has('error')) {
			throw new ValidationError('OAuth authorization was declined or failed');
		}
		return this.token({
			grant_type: 'authorization_code',
			code: required(callback.searchParams.get('code'), 'code'),
			client_id: request.client_id,
			client_secret: clientSecret,
			redirect_uri: request.redirect_uri,
			code_verifier: request.code_verifier,
			resource: request.resource,
		});
	}

	/** `POST /oauth/token` — code exchange or refresh; returns the flat OAuth JSON body. */
	async token(payload: IOAuthTokenPayload): Promise<IOAuthTokenResponse> {
		required(payload.client_id, 'client_id');
		if (payload.client_secret !== undefined) required(payload.client_secret, 'client_secret');
		if (payload.resource !== undefined) httpsUrl(payload.resource, 'resource');
		if (payload.grant_type === 'authorization_code') {
			required(payload.code, 'code');
			httpsUrl(payload.redirect_uri, 'redirect_uri');
			if (
				typeof payload.code_verifier !== 'string' ||
				!/^[A-Za-z0-9._~-]{43,128}$/.test(payload.code_verifier)
			) {
				throw new ValidationError(
					'code_verifier must contain 43–128 RFC 7636 unreserved characters',
				);
			}
		} else if (payload.grant_type === 'refresh_token') {
			required(payload.refresh_token, 'refresh_token');
		} else {
			throw new ValidationError('grant_type must be authorization_code or refresh_token');
		}
		return this.call('OAuth token request failed', () =>
			this.http.post('/oauth/token', payload, publicRequestConfig()),
		);
	}

	/** `POST /oauth/revoke` — revoke an access/refresh token; success has no required body. */
	async revoke(payload: IOAuthRevokePayload): Promise<void> {
		required(payload.client_id, 'client_id');
		required(payload.token, 'token');
		if (payload.client_secret !== undefined) required(payload.client_secret, 'client_secret');
		if (
			payload.token_type_hint !== undefined &&
			!['access_token', 'refresh_token'].includes(payload.token_type_hint)
		) {
			throw new ValidationError('token_type_hint must be access_token or refresh_token');
		}
		await this.call('OAuth revocation failed', () =>
			this.http.post('/oauth/revoke', payload, publicRequestConfig()),
		);
	}

	/** `GET /oauth/userinfo` — flat OIDC claims; requires a bearer token with `openid`. */
	async userinfo(): Promise<IOAuthUserInfo> {
		return this.call('Failed to fetch OAuth userinfo', () => this.http.get('/oauth/userinfo'));
	}
}

function required(value: unknown, name: string): string {
	if (typeof value !== 'string' || !value.trim()) throw new ValidationError(`${name} is required`);
	return value;
}

function httpsUrl(value: string, name: string): URL {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new ValidationError(`${name} must be an absolute HTTPS URL`);
	}
	if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
		throw new ValidationError(`${name} must use HTTPS without credentials or a fragment`);
	}
	return url;
}
