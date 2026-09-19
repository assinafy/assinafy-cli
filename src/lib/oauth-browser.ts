import { spawn } from 'node:child_process';
import { createHash, timingSafeEqual } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { IOAuthAuthorizationOptions, IOAuthTokenResponse, OAuthResource } from '../api';
import { CliError } from './errors';

export const CLI_OAUTH_REDIRECT_URI =
	'https://integrations.assinafy.com.br/assinafy-cli/oauth-callback';

const clearHistory = "history.replaceState(null, '', '/');";
const callbackPage = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Assinafy CLI</title><script>${clearHistory}</script><h1>Return to your terminal</h1><p>The authorization response was received. Check the terminal for the connection result.</p></html>`;
const callbackHeaders = {
	'Cache-Control': 'no-store',
	'Referrer-Policy': 'no-referrer',
	'X-Content-Type-Options': 'nosniff',
	'Content-Security-Policy': `default-src 'none'; script-src 'sha256-${createHash('sha256').update(clearHistory).digest('base64')}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
	Connection: 'close',
};

/** Open the system browser without a shell; callers can print the URL as a fallback. */
export function openBrowser(url: string): Promise<void> {
	const [executable, args]: [string, string[]] =
		process.platform === 'darwin'
			? ['open', [url]]
			: process.platform === 'win32'
				? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
				: ['xdg-open', [url]];
	return new Promise((resolve, reject) => {
		const child = spawn(executable, args, {
			stdio: 'ignore',
			detached: true,
			windowsHide: true,
		});
		child.once('error', () => reject(new CliError('Could not open the system browser.')));
		child.once('spawn', () => {
			child.unref();
			resolve();
		});
	});
}

/** Receive one HTTPS-page relay on loopback, close the listener, then exchange with local PKCE. */
export async function connectOAuth(
	oauth: OAuthResource,
	options: IOAuthAuthorizationOptions,
	onAuthorize: (url: string) => Promise<void>,
	timeoutMs = 180_000,
): Promise<IOAuthTokenResponse> {
	if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600_000) {
		throw new CliError('OAuth connection timeout must be between 1 and 600000 milliseconds.');
	}
	const request = await oauth.authorize(options);
	if (new URL(request.redirect_uri).search) {
		throw new CliError('The browser relay redirect URI must not contain query parameters.');
	}
	const server = createServer({ maxHeaderSize: 8192, requestTimeout: 5000, headersTimeout: 5000 });
	server.maxConnections = 8;
	server.setTimeout(5000, (socket) => socket.destroy());
	let timer: ReturnType<typeof setTimeout> | undefined;
	let cancel: (() => void) | undefined;
	let terminate: (() => void) | undefined;
	let callbackUrl: string;
	try {
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');
		const address = server.address();
		if (!address || typeof address === 'string') throw new CliError('No OAuth listener address.');
		const host = `127.0.0.1:${address.port}`;
		request.state += `.${address.port}`;
		const expectedState = Buffer.from(request.state);
		const authorization = new URL(request.authorization_url);
		authorization.searchParams.set('state', request.state);
		request.authorization_url = authorization.toString();

		callbackUrl = await new Promise<string>((resolve, reject) => {
			let consumed = false;
			timer = setTimeout(
				() => reject(new CliError('OAuth connection timed out. Start again.')),
				timeoutMs,
			);
			cancel = () => reject(new CliError('OAuth connection cancelled.', { exitCode: 130 }));
			terminate = () => reject(new CliError('OAuth connection terminated.', { exitCode: 143 }));
			process.once('SIGINT', cancel);
			process.once('SIGTERM', terminate);
			server.once('error', reject);
			server.on('request', (incoming, response) => {
				const raw = incoming.url ?? '';
				const url = new URL(raw.startsWith('/callback?') ? raw : '/invalid', `http://${host}`);
				const query = url.searchParams;
				const state = Buffer.from(query.get('state') ?? '');
				const valid =
					!consumed &&
					incoming.method === 'GET' &&
					incoming.headers.host === host &&
					raw.startsWith('/callback?') &&
					raw.length <= 8192 &&
					url.origin === `http://${host}` &&
					url.pathname === '/callback' &&
					!url.hash &&
					[...query.keys()].every((key) => query.getAll(key).length === 1) &&
					state.length === expectedState.length &&
					timingSafeEqual(state, expectedState) &&
					query.get('iss') === request.issuer &&
					query.has('code') !== query.has('error') &&
					Boolean((query.get('code') ?? query.get('error'))?.trim());
				if (!valid) {
					response.writeHead(400, {
						...callbackHeaders,
						'Content-Type': 'text/plain; charset=utf-8',
					});
					response.end('Invalid authorization response. Continue in the original browser session.');
					return;
				}
				consumed = true;
				const callback = new URL(request.redirect_uri);
				for (const key of ['code', 'state', 'iss', 'error']) {
					if (query.has(key)) callback.searchParams.set(key, query.get(key)!);
				}
				response.writeHead(200, { ...callbackHeaders, 'Content-Type': 'text/html; charset=utf-8' });
				response.end(callbackPage, () => resolve(callback.toString()));
			});
			void Promise.resolve()
				.then(() => onAuthorize(request.authorization_url))
				.catch(reject);
		});
	} finally {
		clearTimeout(timer);
		if (cancel) process.off('SIGINT', cancel);
		if (terminate) process.off('SIGTERM', terminate);
		await new Promise<void>((resolve) => {
			server.close(() => resolve());
			server.closeAllConnections();
		});
	}
	return oauth.exchangeCode(callbackUrl, request);
}
