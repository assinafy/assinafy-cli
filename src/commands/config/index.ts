import { Command } from '@commander-js/extra-typings';
import pc from 'picocolors';
import {
	type ProfileConfig,
	activeProfileName,
	configPath,
	readConfigFile,
	resolveConfig,
	writeConfigFile,
} from '../../lib/config';
import { CliError } from '../../lib/errors';
import { printData, printSuccess } from '../../lib/output';
import { getGlobals, runAction } from '../../lib/run';
import { renderKeyValue, renderTable } from '../../lib/table';

/** Show only the last 4 characters of a secret. */
function mask(secret: string | undefined): string | undefined {
	if (!secret) return undefined;
	return secret.length <= 4 ? '****' : `****${secret.slice(-4)}`;
}

const setCommand = new Command('set')
	.description(
		'Save credentials/settings into the active profile. Uses the global --api-key, --token, --account-id, --base-url flags plus --webhook-secret.',
	)
	.option('--webhook-secret <secret>', 'Shared secret for verifying webhooks')
	.action(async (_opts, command) => {
		await runAction(command, async ({ config }) => {
			// The credential flags are declared globally on the root program, so
			// commander binds their values there — read the merged view.
			const merged = command.optsWithGlobals() as {
				apiKey?: string;
				token?: string;
				accountId?: string;
				baseUrl?: string;
				webhookSecret?: string;
			};

			const file = readConfigFile();
			const profileName = activeProfileName(getGlobals(command), file);
			const profiles = file.profiles ?? {};
			const profile: ProfileConfig = { ...profiles[profileName] };

			let changed = false;
			if (merged.apiKey !== undefined) {
				profile.api_key = merged.apiKey;
				changed = true;
			}
			if (merged.token !== undefined) {
				profile.token = merged.token;
				changed = true;
			}
			if (merged.accountId !== undefined) {
				profile.account_id = merged.accountId;
				changed = true;
			}
			if (merged.baseUrl !== undefined) {
				profile.base_url = merged.baseUrl;
				changed = true;
			}
			if (merged.webhookSecret !== undefined) {
				profile.webhook_secret = merged.webhookSecret;
				changed = true;
			}

			if (!changed) {
				throw new CliError(
					'Nothing to set. Pass at least one of --api-key, --token, --account-id, --base-url, --webhook-secret.',
				);
			}

			profiles[profileName] = profile;
			file.profiles = profiles;
			if (!file.default_profile) file.default_profile = profileName;
			writeConfigFile(file);

			printSuccess(`Saved profile "${profileName}" to ${configPath()}`, config);
			printData({ profile: profileName, path: configPath() }, config);
		});
	});

const getCommand = new Command('get')
	.description('Show the effective configuration (secrets masked)')
	.action(async (_opts, command) => {
		await runAction(command, async ({ config }) => {
			const view = {
				profile: config.profile,
				api_key: mask(config.apiKey),
				token: mask(config.token),
				account_id: config.accountId,
				base_url: config.baseUrl,
				webhook_secret: mask(config.webhookSecret),
			};
			printData(view, config, (data) => renderKeyValue(data));
		});
	});

const listCommand = new Command('list')
	.alias('profiles')
	.description('List configured profiles')
	.action(async (_opts, command) => {
		await runAction(command, async ({ config }) => {
			const file = readConfigFile();
			const profiles = file.profiles ?? {};
			const names = Object.keys(profiles);
			const rows = names.map((name) => ({
				name,
				default: name === (file.default_profile ?? 'default'),
				account_id: profiles[name]?.account_id,
				base_url: profiles[name]?.base_url,
				has_api_key: Boolean(profiles[name]?.api_key),
			}));
			printData(rows, config, (data) =>
				renderTable(data, [
					{
						header: 'PROFILE',
						value: (r) => (r.default ? `${r.name} ${pc.green('(default)')}` : r.name),
					},
					{ header: 'ACCOUNT', value: (r) => r.account_id },
					{ header: 'BASE URL', value: (r) => r.base_url },
					{ header: 'API KEY', value: (r) => r.has_api_key },
				]),
			);
		});
	});

const useCommand = new Command('use')
	.description('Set the default profile')
	.argument('<profile>', 'Profile name to make default')
	.action(async (profileArg, _opts, command) => {
		await runAction(command, async ({ config }) => {
			const file = readConfigFile();
			if (!file.profiles?.[profileArg]) {
				throw new CliError(
					`Profile "${profileArg}" does not exist. Create it with \`assinafy config set --profile ${profileArg} ...\`.`,
				);
			}
			file.default_profile = profileArg;
			writeConfigFile(file);
			printSuccess(`Default profile is now "${profileArg}"`, config);
			printData({ default_profile: profileArg }, config);
		});
	});

const removeCommand = new Command('remove')
	.alias('rm')
	.description('Delete a profile from the config file')
	.argument('<profile>', 'Profile name to delete')
	.action(async (profileArg, _opts, command) => {
		await runAction(command, async ({ config }) => {
			const file = readConfigFile();
			if (!file.profiles?.[profileArg]) {
				throw new CliError(`Profile "${profileArg}" does not exist.`);
			}
			delete file.profiles[profileArg];
			if (file.default_profile === profileArg) {
				file.default_profile = Object.keys(file.profiles)[0];
			}
			writeConfigFile(file);
			printSuccess(`Removed profile "${profileArg}"`, config);
			printData({ removed: profileArg }, config);
		});
	});

const pathCommand = new Command('path')
	.description('Print the config file path')
	.action(async (_opts, command) => {
		await runAction(command, async ({ config }) => {
			printData({ path: configPath() }, config, (data) => data.path);
		});
	});

export const configCommand = new Command('config')
	.description('Manage credentials, profiles, and settings')
	.addCommand(setCommand)
	.addCommand(getCommand)
	.addCommand(listCommand)
	.addCommand(useCommand)
	.addCommand(removeCommand)
	.addCommand(pathCommand);

// Re-exported so cli.ts can resolve config consistently when needed.
export { resolveConfig };
