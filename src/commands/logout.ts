import { Command } from '@commander-js/extra-typings';
import { activeProfileName, readConfigFile, writeConfigFile } from '../lib/config';
import { CliError } from '../lib/errors';
import { printData, printSuccess } from '../lib/output';
import { getGlobals, runAction } from '../lib/run';

export const logoutCommand = new Command('logout')
	.description('Remove stored credentials from the active profile')
	.action(async (_opts, command) => {
		await runAction(command, async ({ config }) => {
			const file = readConfigFile();
			const profileName = activeProfileName(getGlobals(command), file);
			const profile = file.profiles?.[profileName];
			if (!profile || (!profile.api_key && !profile.token)) {
				throw new CliError(`No stored credentials for profile "${profileName}".`);
			}
			profile.api_key = undefined;
			profile.token = undefined;
			writeConfigFile(file);
			printSuccess(`Removed credentials from profile "${profileName}"`, config);
			printData({ profile: profileName, logged_out: true }, config);
		});
	});
