import type { AssinafyClient } from '../api';
import { createClient } from './client';
import { type GlobalOptions, type ResolvedConfig, resolveConfig } from './config';
import { printError } from './output';

/**
 * Minimal structural type for a commander Command, decoupled from commander's
 * heavy generic typings. Every command exposes `optsWithGlobals()` which merges
 * its own options with the inherited global flags.
 */
export interface CommandLike {
	optsWithGlobals(): Record<string, unknown>;
}

/** Extract and type the merged global flags from a command. */
export function getGlobals(command: CommandLike): GlobalOptions {
	const opts = command.optsWithGlobals();
	return {
		apiKey: opts.apiKey as string | undefined,
		token: opts.token as string | undefined,
		accountId: opts.accountId as string | undefined,
		baseUrl: opts.baseUrl as string | undefined,
		profile: opts.profile as string | undefined,
		json: Boolean(opts.json),
		quiet: Boolean(opts.quiet),
	};
}

/** Context handed to handlers that require an authenticated client. */
export interface ClientContext {
	client: AssinafyClient;
	config: ResolvedConfig;
}

/** Context handed to handlers that only need resolved configuration. */
export interface ActionContext {
	config: ResolvedConfig;
}

/**
 * Run a command handler that needs an authenticated SDK client. Resolves
 * configuration, builds the client (surfacing a friendly error when no
 * credentials are configured), and funnels every thrown value through a single
 * error printer that sets the process exit code.
 */
export async function runWithClient(
	command: CommandLike,
	handler: (ctx: ClientContext) => Promise<void>,
): Promise<void> {
	const config = resolveConfig(getGlobals(command));
	try {
		const client = createClient(config);
		await handler({ client, config });
	} catch (err) {
		printError(err, config);
	}
}

/** Run a command against endpoints that do not require API-key/JWT credentials. */
export async function runWithOptionalClient(
	command: CommandLike,
	handler: (ctx: ClientContext) => Promise<void>,
): Promise<void> {
	const config = resolveConfig(getGlobals(command));
	try {
		const client = createClient(config, { allowUnauthenticated: true });
		await handler({ client, config });
	} catch (err) {
		printError(err, config);
	}
}

/** Run a command that specifically requires a user JWT bearer token. */
export async function runWithTokenClient(
	command: CommandLike,
	handler: (ctx: ClientContext) => Promise<void>,
): Promise<void> {
	const config = resolveConfig(getGlobals(command));
	try {
		const client = createClient(config, { preferToken: true });
		await handler({ client, config });
	} catch (err) {
		printError(err, config);
	}
}

/** Run a command handler that only needs resolved configuration (no client). */
export async function runAction(
	command: CommandLike,
	handler: (ctx: ActionContext) => Promise<void>,
): Promise<void> {
	const config = resolveConfig(getGlobals(command));
	try {
		await handler({ config });
	} catch (err) {
		printError(err, config);
	}
}
