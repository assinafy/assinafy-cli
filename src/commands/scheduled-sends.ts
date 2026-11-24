import { Command } from '@commander-js/extra-typings';
import { requireAccountId } from '../lib/client';
import { addPaginationOptions } from '../lib/options';
import { printData } from '../lib/output';
import { listParams } from '../lib/pagination';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient } from '../lib/run';

export const scheduledSendsCommand = new Command('scheduled-sends').description(
	'List, cancel or send queued requests (staging)',
);
scheduledSendsCommand.addCommand(
	addPaginationOptions(new Command('list').description('List queued assignments and envelopes'))
		.option('--document <id>', 'Filter by document ID')
		.action(async (opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				printData(
					await client.scheduledSends.list(
						{ ...listParams(opts), document_id: opts.document },
						requireAccountId(config),
					),
					config,
				);
			});
		}),
);
for (const action of ['cancel', 'send'] as const) {
	scheduledSendsCommand.addCommand(
		new Command(action)
			.description(
				action === 'send'
					? 'Send now, charging the current cost and notifying signers'
					: 'Cancel a pending request without sending',
			)
			.argument('<scheduledSendId>', 'Scheduled send ID')
			.option('-y, --yes', 'Skip confirmation')
			.action(async (id, opts, command) => {
				await runWithClient(command, async ({ client, config }) => {
					if (!(await confirmDestructive(`${action} scheduled request ${id}?`, Boolean(opts.yes))))
						return;
					printData(await client.scheduledSends[action](id, requireAccountId(config)), config);
				});
			}),
	);
}
