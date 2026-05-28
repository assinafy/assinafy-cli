import { Command } from '@commander-js/extra-typings';
import type { IWebhookDispatchListParams } from '../api';
import { requireAccountId } from '../lib/client';
import { parseInteger, splitList } from '../lib/json';
import { addListOptions } from '../lib/options';
import { printData, printSuccess } from '../lib/output';
import { listParams, paginationFooter } from '../lib/pagination';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const registerCommand = new Command('register')
	.description('Register (or replace) the workspace webhook subscription')
	.requiredOption('--url <url>', 'Endpoint URL to receive events')
	.requiredOption('--email <email>', 'Contact email for delivery problems')
	.option('--events <csv>', 'Comma-separated event names (defaults to a sensible set)')
	.option('--inactive', 'Register the subscription as inactive')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const events = splitList(opts.events);
			const sub = await withSpinner('Registering webhook', config, () =>
				client.webhooks.register(
					{ url: opts.url, email: opts.email, events, is_active: !opts.inactive },
					accountId,
				),
			);
			printSuccess('Webhook registered', config);
			printData(sub, config, (s) =>
				renderKeyValue({ url: s.url, email: s.email, is_active: s.is_active, events: s.events }),
			);
		});
	});

const getCommand = new Command('get')
	.description('Show the current webhook subscription')
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const sub = await withSpinner('Fetching webhook', config, () =>
				client.webhooks.get(accountId),
			);
			if (!sub) {
				printData({ subscription: null }, config, () => 'No webhook subscription configured.');
				return;
			}
			printData(sub, config, (s) =>
				renderKeyValue({ url: s.url, email: s.email, is_active: s.is_active, events: s.events }),
			);
		});
	});

const deleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete the webhook subscription')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			if (!(await confirmDestructive('Delete the webhook subscription?', Boolean(opts.yes))))
				return;
			await withSpinner('Deleting webhook', config, () => client.webhooks.delete(accountId));
			printSuccess('Webhook subscription deleted', config);
			printData({ deleted: true }, config);
		});
	});

const inactivateCommand = new Command('inactivate')
	.description('Inactivate the webhook subscription without deleting it')
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const sub = await withSpinner('Inactivating webhook', config, () =>
				client.webhooks.inactivate(accountId),
			);
			printSuccess('Webhook subscription inactivated', config);
			printData(sub, config, (s) => renderKeyValue({ url: s.url, is_active: s.is_active }));
		});
	});

const eventTypesCommand = new Command('event-types')
	.description('List supported webhook event types')
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const types = await withSpinner('Fetching event types', config, () =>
				client.webhooks.listEventTypes(),
			);
			printData(types, config, (rows) =>
				renderTable(rows, [
					{ header: 'EVENT', value: (r) => r.id },
					{ header: 'DESCRIPTION', value: (r) => r.description },
				]),
			);
		});
	});

const dispatchesCommand = addListOptions(
	new Command('dispatches')
		.description('List webhook delivery history')
		.option('--event <event>', 'Filter by event name')
		.option('--delivered <bool>', 'Filter by delivery status (true/false)')
		.option('--from <unix>', 'Start of time range (unix seconds)')
		.option('--to <unix>', 'End of time range (unix seconds)'),
).action(async (opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const params: IWebhookDispatchListParams = { ...listParams(opts) };
		if (opts.event) params.event = opts.event;
		if (opts.delivered) params.delivered = opts.delivered as 'true' | 'false';
		const from = parseInteger(opts.from, '--from');
		const to = parseInteger(opts.to, '--to');
		if (from !== undefined) params.from = from;
		if (to !== undefined) params.to = to;
		const result = await withSpinner('Fetching dispatches', config, () =>
			client.webhooks.listDispatches(params, accountId),
		);
		printData(result.data, config, (rows) => {
			const table = renderTable(rows, [
				{ header: 'ID', value: (r) => r.id },
				{ header: 'EVENT', value: (r) => r.event },
				{ header: 'DELIVERED', value: (r) => r.delivered },
				{ header: 'STATUS', value: (r) => r.http_status },
				{ header: 'ENDPOINT', value: (r) => r.endpoint },
			]);
			const footer = paginationFooter(result);
			return footer ? `${table}\n${footer}` : table;
		});
	});
});

const retryCommand = new Command('retry')
	.description('Retry delivery of a specific dispatch')
	.argument('<dispatchId>', 'Dispatch ID')
	.action(async (dispatchId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const result = await withSpinner('Retrying dispatch', config, () =>
				client.webhooks.retryDispatch(dispatchId, accountId),
			);
			printSuccess('Dispatch retried', config);
			printData(result, config, (r) =>
				renderKeyValue({ id: r.id, delivered: r.delivered, http_status: r.http_status }),
			);
		});
	});

export const webhooksCommand = new Command('webhooks')
	.description('Manage webhook subscriptions and delivery history')
	.addCommand(registerCommand)
	.addCommand(getCommand)
	.addCommand(deleteCommand)
	.addCommand(inactivateCommand)
	.addCommand(eventTypesCommand)
	.addCommand(dispatchesCommand)
	.addCommand(retryCommand);
