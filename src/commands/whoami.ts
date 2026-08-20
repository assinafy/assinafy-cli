import { Command } from '@commander-js/extra-typings';
import { printPaginatedData } from '../lib/output';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderTable } from '../lib/table';

export const whoamiCommand = new Command('whoami')
	.description('Verify credentials and list the workspaces they can access')
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const result = await withSpinner('Checking credentials', config, () =>
				client.workspaces.list(),
			);
			printPaginatedData(result, config, (rows) =>
				renderTable(rows, [
					{ header: 'ACCOUNT ID', value: (r) => r.id },
					{ header: 'NAME', value: (r) => r.name },
					{ header: 'ROLES', value: (r) => r.roles },
					{ header: 'CREATED', value: (r) => r.created_at },
				]),
			);
		});
	});
