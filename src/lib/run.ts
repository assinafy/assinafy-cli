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
 * Shared scaffold for every command handler: resolve configuration, run the
 * handler, and funnel any thrown value through a single error printer that sets
 * the process exit code. Client construction happens INSIDE the try so a
 * missing-credentials error is reported the same way as any other failure.
 */
async function withResolvedConfig(
	command: CommandLike,
	handler: (config: ResolvedConfig) => Promise<void>,
): Promise<void> {
	let outputConfig = { json: false, quiet: false };
	try {
		const globals = getGlobals(command);
		outputConfig = { json: Boolean(globals.json), quiet: Boolean(globals.quiet) };
		const config = resolveConfig(globals);
		await handler(config);
	} catch (err) {
		printError(err, outputConfig);
	}
}

/**
 * Run a command handler that needs an authenticated SDK client. Surfaces a
 * friendly error when no credentials are configured.
 */
export function runWithClient(
	command: CommandLike,
	handler: (ctx: ClientContext) => Promise<void>,
): Promise<void> {
	return withResolvedConfig(command, (config) => handler({ client: createClient(config), config }));
}

/** Run a command against endpoints that do not require API-key/JWT credentials. */
export function runWithOptionalClient(
	command: CommandLike,
	handler: (ctx: ClientContext) => Promise<void>,
): Promise<void> {
	return withResolvedConfig(command, (config) =>
		handler({ client: createClient(config, { allowUnauthenticated: true }), config }),
	);
}

/** Run a public command without forwarding any configured credentials. */
export function runWithPublicClient(
	command: CommandLike,
	handler: (ctx: ClientContext) => Promise<void>,
): Promise<void> {
	return withResolvedConfig(command, (config) =>
		handler({
			client: createClient(config, { allowUnauthenticated: true, omitCredentials: true }),
			config,
		}),
	);
}

/** Run a command handler that only needs resolved configuration (no client). */
export function runAction(
	command: CommandLike,
	handler: (ctx: ActionContext) => Promise<void>,
): Promise<void> {
	return withResolvedConfig(command, (config) => handler({ config }));
}
