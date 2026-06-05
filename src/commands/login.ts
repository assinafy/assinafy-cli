import { Command } from '@commander-js/extra-typings';
import {
	activeProfileName,
	configPath,
	type ProfileConfig,
	readConfigFile,
	writeConfigFile,
} from '../lib/config';
import { printData, printSuccess } from '../lib/output';
import { promptSecret, promptText } from '../lib/prompts';
import { getGlobals, runAction } from '../lib/run';

export const loginCommand = new Command('login')
	.description(
		'Store an API key and account ID in a profile (interactive). Reads the global --api-key, --account-id, --base-url flags when supplied.',
	)
	.action(async (_opts, command) => {
		await runAction(command, async ({ config }) => {
			// Credential flags are declared globally on the root program.
			const merged = command.optsWithGlobals() as {
				apiKey?: string;
				accountId?: string;
				baseUrl?: string;
			};
			const apiKey = merged.apiKey ?? (await promptSecret('Enter your Assinafy API key'));
			const accountId =
				merged.accountId ?? (await promptText('Default account/workspace ID (optional)'));

			const file = readConfigFile();
			const profileName = activeProfileName(getGlobals(command), file);
			const profiles = file.profiles ?? {};
			const profile: ProfileConfig = { ...profiles[profileName], api_key: apiKey };
			if (accountId) profile.account_id = accountId;
			if (merged.baseUrl) profile.base_url = merged.baseUrl;

			profiles[profileName] = profile;
			file.profiles = profiles;
			if (!file.default_profile) file.default_profile = profileName;
			writeConfigFile(file);

			printSuccess(`Logged in. Saved profile "${profileName}" to ${configPath()}`, config);
			printData({ profile: profileName, account_id: accountId || undefined }, config);
		});
	});
