import { spawn } from 'node:child_process';
import { createHash, timingSafeEqual } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { IOAuthAuthorizationOptions, IOAuthTokenResponse, OAuthResource } from '../api';
import { CliError } from './errors';

export const CLI_OAUTH_REDIRECT_URI =
	'https://integrations.assinafy.com.br/assinafy-cli/oauth-callback';

const clearHistory = "history.replaceState(null, '', '/');";
const brandOrigin = 'https://integrations.assinafy.com.br';
const callbackCopy = {
	received: {
		heading: 'Volte ao terminal.',
		status:
			'A resposta de autorização foi recebida. Confira no terminal se a conexão foi concluída.',
	},
	denied: {
		heading: 'Conexão não autorizada.',
		status:
			'A autorização não foi concluída. Confira o erro no terminal e inicie uma nova conexão.',
	},
	invalid: {
		heading: 'Retorno inválido.',
		status:
			'Continue na janela original de autorização. Se ela expirou, inicie uma nova conexão no terminal.',
	},
};

function callbackPage(status: keyof typeof callbackCopy): string {
	const copy = callbackCopy[status];
	return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>${copy.heading} | Assinafy CLI</title>
  <script>${clearHistory}</script>
  <link rel="icon" href="${brandOrigin}/brand/assinafy-icon.png">
  <link rel="stylesheet" href="${brandOrigin}/brand/colors.css">
  <link rel="stylesheet" href="${brandOrigin}/brand/site.css">
  <link rel="stylesheet" href="${brandOrigin}/oauth-callback.css">
</head>
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  <header class="site-header wrap">
    <a class="brand" href="${brandOrigin}" aria-label="Assinafy Integrações, início">
      <img src="${brandOrigin}/brand/assinafy-logotype.svg" width="148" height="32" alt="Assinafy">
      <span class="brand-section">integrações</span>
    </a>
  </header>
  <main id="conteudo" class="hero wrap">
    <div>
      <p class="eyebrow"><img src="${brandOrigin}/assinafy-cli/cli-icon.svg" width="24" height="24" alt="">Conexão com a Assinafy CLI</p>
      <h1>${copy.heading}</h1>
      <p class="hero-description" role="status">${copy.status}</p>
      <a class="button button-primary" href="${brandOrigin}/assinafy-cli">Ajuda para conectar<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg></a>
    </div>
    <figure class="connection-art">
      <div class="connection-map" role="img" aria-label="Retorno de autorização: Assinafy para Assinafy CLI.">
        <svg class="connection-lines" viewBox="0 0 480 240" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path class="connection-route" d="M120 106H240"/>
          <path class="connection-complete" d="M240 106H374m-64-5 5 5-5 5"/>
        </svg>
        <div class="connection-node connection-assinafy" aria-hidden="true">
          <span class="connection-tile"><img src="${brandOrigin}/brand/assinafy-icon.png" width="60" height="60" alt=""></span>
          <span class="connection-label">Assinafy</span>
        </div>
        <div class="connection-node connection-application" aria-hidden="true">
          <span class="connection-tile"><img src="${brandOrigin}/assinafy-cli/cli-icon.svg" width="36" height="36" alt=""></span>
          <span class="connection-label">Assinafy CLI</span>
        </div>
      </div>
      <figcaption class="connection-caption">Continue no terminal que iniciou a conexão.</figcaption>
    </figure>
  </main>
  <footer class="site-footer wrap"><span>Assinafy. Assinaturas que conectam.</span></footer>
</body>
</html>`;
}

const callbackHeaders = {
	'Content-Type': 'text/html; charset=utf-8',
	'Cache-Control': 'no-store',
	'Referrer-Policy': 'no-referrer',
	'X-Content-Type-Options': 'nosniff',
	'X-Robots-Tag': 'noindex, nofollow, noarchive',
	'Content-Security-Policy': `default-src 'none'; script-src 'sha256-${createHash('sha256').update(clearHistory).digest('base64')}'; style-src ${brandOrigin}; img-src ${brandOrigin}; font-src ${brandOrigin}; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
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
					response.writeHead(400, callbackHeaders);
					response.end(callbackPage('invalid'));
					return;
				}
				consumed = true;
				const callback = new URL(request.redirect_uri);
				for (const key of ['code', 'state', 'iss', 'error']) {
					if (query.has(key)) callback.searchParams.set(key, query.get(key)!);
				}
				response.writeHead(200, callbackHeaders);
				response.end(callbackPage(query.has('error') ? 'denied' : 'received'), () =>
					resolve(callback.toString()),
				);
			});
			void Promise.resolve()
				.then(() => onAuthorize(request.authorization_url))
				.catch(reject);
		});
	} finally {
		clearTimeout(timer);
		await new Promise<void>((resolve) => {
			server.close(() => resolve());
			server.closeAllConnections();
		});
	}
	return oauth.exchangeCode(callbackUrl, request);
}
