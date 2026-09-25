import { Command, Option } from '@commander-js/extra-typings';
import { type IOAuthAuthorizationRequest, ValidationError } from '../api';
import { readBinary } from '../lib/files';
import { parseInteger, parseJsonObject } from '../lib/json';
import { CLI_OAUTH_REDIRECT_URI, connectOAuth, openBrowser } from '../lib/oauth-browser';
import { printData } from '../lib/output';
import { runWithClient, runWithPublicClient } from '../lib/run';
import { sanitizeTerminalText } from '../lib/terminal';

const clientIdOption = () =>
	new Option('--client-id <id>', 'OAuth application client ID')
		.env('ASSINAFY_OAUTH_CLIENT_ID')
		.default('96BZZ0sZTb2NkEXt1GCaIRCTprI2YKHZr8JDHawuXUyCLC88');
const clientSecretOption = () =>
	new Option(
		'--client-secret <secret>',
		'Confidential application secret; omit for public applications',
	).env('ASSINAFY_OAUTH_CLIENT_SECRET');

const connectCommand = new Command('connect')
	.description(
		'Open browser consent for a public OAuth app, receive its loopback return, and print tokens',
	)
	.addOption(clientIdOption())
	.option('--redirect-uri <uri>', 'Exactly registered HTTPS relay URI', CLI_OAUTH_REDIRECT_URI)
	.option(
		'--scope <scopes>',
		'Space-separated scopes; the default requests every published scope',
		'account:read documents:read documents:write templates:read templates:write webhooks:write openid profile email offline_access',
	)
	.option('--timeout <seconds>', 'Wait for browser consent (1–600 seconds)', '180')
	.option('--no-browser', 'Print the authorization URL without opening the system browser')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const timeout = parseInteger(opts.timeout, '--timeout', { min: 1 })!;
			const tokens = await connectOAuth(
				client.oauth,
				{
					clientId: opts.clientId,
					redirectUri: opts.redirectUri,
					scopes: opts.scope.trim().split(/\s+/),
				},
				async (url) => {
					process.stderr.write(
						`Open this URL in a browser on this computer:\n${sanitizeTerminalText(url)}\n`,
					);
					if (opts.browser) {
						await openBrowser(url).catch(() => {
							process.stderr.write('Could not open the browser. Open the URL above manually.\n');
						});
					}
				},
				timeout * 1000,
			).catch((error: unknown) => {
				throw withScopeHint(error);
			});
			printData(tokens, config);
		});
	});

/** Explain the likely fix when the authorization server rejects a requested scope. */
export function withScopeHint(error: unknown): unknown {
	if (!(error instanceof ValidationError) || error.errors.oauthError !== 'invalid_scope')
		return error;
	return new ValidationError(
		`${error.message}. The application is not registered for one of the requested scopes: ` +
			'the default requests all ten published scopes, including webhooks:write. Ask the ' +
			'application owner to register them, or pass --scope with the scopes it permits.',
		error.errors,
	);
}

const metadataCommand = new Command('metadata')
	.description('Read protected-resource metadata from the API origin')
	.action(async (_opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			printData(await client.oauth.metadata(), config);
		});
	});

const discoveryCommand = new Command('discovery')
	.description('Read authorization-server metadata from an HTTPS issuer')
	.argument('<issuer>', 'Issuer from protected-resource metadata')
	.action(async (issuer, _opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			printData(await client.oauth.discovery(issuer), config);
		});
	});

const authorizeCommand = new Command('authorize')
	.description(
		'Create an authorization URL and a sensitive PKCE/state request; save the JSON securely',
	)
	.addOption(clientIdOption())
	.requiredOption('--redirect-uri <uri>', 'Exactly registered HTTPS callback URI')
	.requiredOption(
		'--scope <scopes>',
		'Space-separated scopes; offline_access requests refresh tokens',
	)
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			printData(
				await client.oauth.authorize({
					clientId: opts.clientId,
					redirectUri: opts.redirectUri,
					scopes: opts.scope.trim().split(/\s+/),
				}),
				config,
			);
		});
	});

const exchangeCommand = new Command('exchange')
	.description('Validate the callback against a saved authorization request and exchange its code')
	.requiredOption('--request <path>', 'Private JSON file returned by oauth authorize')
	.addOption(
		new Option('--callback-url <url>', 'Complete callback URL with code, state, and iss')
			.env('ASSINAFY_OAUTH_CALLBACK_URL')
			.makeOptionMandatory(),
	)
	.addOption(clientSecretOption())
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const request = parseJsonObject(
				readBinary(opts.request).toString('utf8'),
				'--request',
			) as unknown as IOAuthAuthorizationRequest;
			printData(
				await client.oauth.exchangeCode(opts.callbackUrl, request, opts.clientSecret),
				config,
			);
		});
	});

const refreshCommand = new Command('refresh')
	.description('Rotate a refresh token once; securely persist the full response before using it')
	.addOption(clientIdOption())
	.addOption(clientSecretOption())
	.addOption(
		new Option('--refresh-token <token>', 'Current refresh token')
			.env('ASSINAFY_OAUTH_REFRESH_TOKEN')
			.makeOptionMandatory(),
	)
	.option('--resource <uri>', 'Resource indicator used during authorization')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const tokens = await client.oauth
				.token({
					grant_type: 'refresh_token',
					client_id: opts.clientId,
					client_secret: opts.clientSecret,
					refresh_token: opts.refreshToken,
					resource: opts.resource,
				})
				.catch((error: unknown) => {
					// No replacement token: the submitted one may be retired, and replaying it ends the connection.
					if (!(error instanceof ValidationError) || error.errors.field !== 'refresh_token')
						throw error;
					throw new ValidationError(
						`${error.message}. Run \`assinafy oauth connect\` to authorize again.`,
						error.errors,
					);
				});
			printData(tokens, config);
		});
	});

const revokeCommand = new Command('revoke')
	.description('Revoke an access or refresh token for this application')
	.addOption(clientIdOption())
	.addOption(clientSecretOption())
	.addOption(
		new Option('--revoke-token <token>', 'Token to revoke')
			.env('ASSINAFY_OAUTH_REVOKE_TOKEN')
			.makeOptionMandatory(),
	)
	.addOption(
		new Option('--token-type-hint <type>', 'Type of token being revoked').choices([
			'access_token',
			'refresh_token',
		] as const),
	)
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			await client.oauth.revoke({
				token: opts.revokeToken,
				client_id: opts.clientId,
				client_secret: opts.clientSecret,
				token_type_hint: opts.tokenTypeHint,
			});
			printData({ revoked: true }, config);
		});
	});

const userinfoCommand = new Command('userinfo')
	.description('Read OIDC claims using --token / ASSINAFY_TOKEN with openid scope')
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			printData(await client.oauth.userinfo(), config);
		});
	});

export const oauthCommand = new Command('oauth')
	.description('OAuth 2.1 authorization, PKCE, token rotation, and OpenID Connect')
	.addCommand(connectCommand)
	.addCommand(metadataCommand)
	.addCommand(discoveryCommand)
	.addCommand(authorizeCommand)
	.addCommand(exchangeCommand)
	.addCommand(refreshCommand)
	.addCommand(revokeCommand)
	.addCommand(userinfoCommand);
