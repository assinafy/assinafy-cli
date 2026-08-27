import { Command } from '@commander-js/extra-typings';
import type { IDocumentStatsParams, IUpdateNotificationPreferencesPayload } from '../api';
import { parseJsonObject } from '../lib/json';
import { printData, printSuccess } from '../lib/output';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderDocumentStats, renderTable } from '../lib/table';

const selfCommand = new Command('self')
	.description("Show the authenticated user's profile and accounts")
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const user = await withSpinner('Fetching user profile', config, () => client.users.self());
			printData(user, config);
		});
	});

const statsCommand = new Command('stats')
	.description("Show document KPIs across the user's accounts")
	.option('--granularity <value>', 'monthly or daily', 'monthly')
	.option('--month <yyyy-mm>', 'Month required for daily granularity')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const params: IDocumentStatsParams = {
				granularity: opts.granularity as IDocumentStatsParams['granularity'],
				month: opts.month,
			};
			const rows = await withSpinner('Fetching user statistics', config, () =>
				client.users.stats(params),
			);
			printData(rows, config, renderDocumentStats);
		});
	});

const preferencesGetCommand = new Command('get')
	.description('Show all owner-facing email notification preferences')
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const preferences = await withSpinner('Fetching notification preferences', config, () =>
				client.users.getNotificationPreferences(),
			);
			printData(preferences, config, (value) =>
				renderTable(
					Object.entries(value).map(([notification, enabled]) => ({ notification, enabled })),
					[
						{ header: 'NOTIFICATION', value: (row) => row.notification },
						{ header: 'ENABLED', value: (row) => row.enabled },
					],
				),
			);
		});
	});

const preferencesUpdateCommand = new Command('update')
	.description('Merge one or more owner-facing email notification preferences')
	.requiredOption('--set <json>', 'JSON object mapping notification codes to booleans')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const payload = parseJsonObject(opts.set, '--set') as IUpdateNotificationPreferencesPayload;
			const preferences = await withSpinner('Updating notification preferences', config, () =>
				client.users.updateNotificationPreferences(payload),
			);
			printSuccess('Updated notification preferences', config);
			printData(preferences, config);
		});
	});

const preferencesCommand = new Command('notification-preferences')
	.alias('preferences')
	.description('Manage owner-facing email notification preferences')
	.addCommand(preferencesGetCommand)
	.addCommand(preferencesUpdateCommand);

export const usersCommand = new Command('users')
	.description('Show the authenticated user and personal preferences')
	.addCommand(selfCommand)
	.addCommand(statsCommand)
	.addCommand(preferencesCommand);
