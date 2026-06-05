import { AssinafyClient } from '../api';
import type { ResolvedConfig } from './config';
import { CliError } from './errors';

interface CreateClientOptions {
	allowUnauthenticated?: boolean;
	preferToken?: boolean;
}

/** Build an SDK client from resolved configuration, or throw a friendly CLI error. */
export function createClient(
	config: ResolvedConfig,
	options: CreateClientOptions = {},
): AssinafyClient {
	const apiKey = options.preferToken ? undefined : config.apiKey;
	const token = config.token;

	if (options.preferToken && !token && !options.allowUnauthenticated) {
		throw new CliError(
			'This command requires a JWT access token. Run `assinafy auth login <email>` and pass the returned token with --token or ASSINAFY_TOKEN.',
		);
	}

	if (!apiKey && !token && !options.allowUnauthenticated) {
		throw new CliError(
			'No credentials found. Set one with `assinafy config set --api-key <key>`, pass --api-key, or set ASSINAFY_API_KEY.',
		);
	}

	const clientOptions: ConstructorParameters<typeof AssinafyClient>[0] = {
		baseUrl: config.baseUrl,
		allowUnauthenticated: options.allowUnauthenticated,
	};
	if (apiKey) clientOptions.apiKey = apiKey;
	else if (token) clientOptions.token = token;
	if (config.accountId) clientOptions.accountId = config.accountId;
	if (config.webhookSecret) clientOptions.webhookSecret = config.webhookSecret;

	return new AssinafyClient(clientOptions);
}

/**
 * Resolve the effective account ID for account-scoped commands, preferring an
 * explicit `--account-id` style override and falling back to the configured
 * default. Throws a friendly error when neither is available.
 */
export function requireAccountId(config: ResolvedConfig, override?: string): string {
	const id = override ?? config.accountId;
	if (!id) {
		throw new CliError(
			'No account ID found. Pass --account-id <id>, set ASSINAFY_ACCOUNT_ID, or run `assinafy config set --account-id <id>`.',
		);
	}
	return id;
}
