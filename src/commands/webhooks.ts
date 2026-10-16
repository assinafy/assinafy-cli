import { Command, Option, type OptionValues } from '@commander-js/extra-typings';
import {
	type IWebhookDispatchListParams,
	type IWebhookEndpointCreateResponse,
	type IWebhookEndpointUpdatePayload,
	WebhookVerifier,
} from '../api';
import { requireAccountId } from '../lib/client';
import { CliError } from '../lib/errors';
import { readBinary } from '../lib/files';
import { parseInteger, splitList } from '../lib/json';
import { addSortableListOptions } from '../lib/options';
import { printData, printPaginatedData, printSuccess } from '../lib/output';
import { listParams, tableWithFooter } from '../lib/pagination';
import { confirmDestructive } from '../lib/prompts';
import { runAction, runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const registerCommand = new Command('register')
	.description("Register (or replace) the account's oldest webhook endpoint")
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
	.description("Show the account's oldest webhook endpoint")
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

const inactivateCommand = new Command('inactivate')
	.description("Inactivate the account's oldest webhook endpoint without deleting it")
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

const dispatchesCommand = addSortableListOptions(
	new Command('dispatches')
		.description('List webhook delivery history')
		.option('--endpoint <endpointId>', 'Only deliveries to this webhook endpoint')
		.option('--event <event>', 'Filter by event name')
		.option('--delivered <bool>', 'Filter by delivery status (true/false)')
		.option('--from <unix>', 'Start of time range (unix seconds)')
		.option('--to <unix>', 'End of time range (unix seconds)'),
	'Sort by created_at (prefix with - for descending)',
).action(async (opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const params: IWebhookDispatchListParams = { ...listParams(opts) };
		if (opts.endpoint) params.endpoint_id = opts.endpoint;
		if (opts.event) params.event = opts.event;
		if (opts.delivered !== undefined) {
			const v = opts.delivered.toLowerCase();
			if (v !== 'true' && v !== 'false') {
				throw new CliError('--delivered must be true or false');
			}
			params.delivered = v as 'true' | 'false';
		}
		const from = parseInteger(opts.from, '--from');
		const to = parseInteger(opts.to, '--to');
		if (from !== undefined) params.from = from;
		if (to !== undefined) params.to = to;
		const result = await withSpinner('Fetching dispatches', config, () =>
			client.webhooks.listDispatches(params, accountId),
		);
		printPaginatedData(result, config, (rows) => {
			const table = renderTable(rows, [
				{ header: 'ID', value: (r) => r.id },
				{ header: 'EVENT', value: (r) => r.event },
				{ header: 'DELIVERED', value: (r) => r.delivered },
				{ header: 'STATUS', value: (r) => r.http_status },
				{ header: 'ENDPOINT', value: (r) => r.endpoint },
			]);
			return tableWithFooter(table, result);
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

const renderEndpoint = (e: IWebhookEndpointCreateResponse) =>
	renderKeyValue({
		id: e.id,
		name: e.name,
		url: e.url,
		email: e.email,
		is_active: e.is_active,
		signing_enabled: e.signing_enabled,
		events: e.events,
		secret: e.secret,
	});

/** Shared endpoint field options; booleans stay undefined unless a flag is given. */
function endpointFieldOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>) {
	return command
		.option('--name <name>', 'Label to tell endpoints apart')
		.option('--events <csv>', 'Comma-separated event names')
		.addOption(new Option('--active', 'Deliver events to this endpoint'))
		.addOption(new Option('--inactive', 'Stop delivering events').conflicts('active'))
		.addOption(new Option('--signing', 'Sign deliveries (Standard Webhooks)'))
		.addOption(
			new Option('--no-signing', 'Disable signing and discard the secret').default(undefined),
		);
}

function endpointPayload(opts: {
	url?: string;
	email?: string;
	name?: string;
	events?: string;
	active?: true;
	inactive?: true;
	signing?: boolean;
}): IWebhookEndpointUpdatePayload {
	const payload: IWebhookEndpointUpdatePayload = {};
	if (opts.url !== undefined) payload.url = opts.url;
	if (opts.email !== undefined) payload.email = opts.email;
	if (opts.name !== undefined) payload.name = opts.name;
	const events = splitList(opts.events);
	if (events !== undefined) payload.events = events;
	if (opts.active || opts.inactive) payload.is_active = Boolean(opts.active);
	if (opts.signing !== undefined) payload.signing_enabled = opts.signing;
	return payload;
}

const endpointsListCommand = new Command('list')
	.alias('ls')
	.description('List webhook endpoints, oldest first')
	.option('--url <url>', 'Only the endpoint registered with exactly this URL')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const rows = await withSpinner('Fetching endpoints', config, () =>
				client.webhooks.listEndpoints(accountId, { url: opts.url }),
			);
			printData(rows, config, (list) =>
				renderTable(list, [
					{ header: 'ID', value: (r) => r.id },
					{ header: 'NAME', value: (r) => r.name },
					{ header: 'URL', value: (r) => r.url },
					{ header: 'ACTIVE', value: (r) => r.is_active },
					{ header: 'SIGNED', value: (r) => r.signing_enabled },
				]),
			);
		});
	});

const endpointsCreateCommand = endpointFieldOptions(
	new Command('create')
		.description('Register a webhook endpoint (1 per account, up to 3 on paid plans)')
		.requiredOption('--url <url>', 'Endpoint URL to receive events')
		.requiredOption('--email <email>', 'Contact email for delivery problems'),
).action(async (opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const endpoint = await withSpinner('Creating endpoint', config, () =>
			client.webhooks.createEndpoint(
				{ ...endpointPayload(opts), url: opts.url, email: opts.email },
				accountId,
			),
		);
		printSuccess('Webhook endpoint created', config);
		printData(endpoint, config, renderEndpoint);
	});
});

const endpointsGetCommand = new Command('get')
	.description('Show one webhook endpoint')
	.argument('<endpointId>', 'Endpoint ID')
	.action(async (endpointId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const endpoint = await withSpinner('Fetching endpoint', config, () =>
				client.webhooks.getEndpoint(endpointId, accountId),
			);
			printData(endpoint, config, renderEndpoint);
		});
	});

const endpointsUpdateCommand = endpointFieldOptions(
	new Command('update')
		.description('Update the given fields of a webhook endpoint')
		.argument('<endpointId>', 'Endpoint ID')
		.option('--url <url>', 'Endpoint URL to receive events')
		.option('--email <email>', 'Contact email for delivery problems'),
).action(async (endpointId, opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const payload = endpointPayload(opts);
		if (Object.keys(payload).length === 0) {
			throw new CliError('Provide at least one field to update');
		}
		const endpoint = await withSpinner('Updating endpoint', config, () =>
			client.webhooks.updateEndpoint(endpointId, payload, accountId),
		);
		printSuccess('Webhook endpoint updated', config);
		printData(endpoint, config, renderEndpoint);
	});
});

const endpointsDeleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete a webhook endpoint and free its slot')
	.argument('<endpointId>', 'Endpoint ID')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (endpointId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			if (!(await confirmDestructive(`Delete webhook endpoint ${endpointId}?`, Boolean(opts.yes))))
				return;
			await withSpinner('Deleting endpoint', config, () =>
				client.webhooks.deleteEndpoint(endpointId, accountId),
			);
			printSuccess('Webhook endpoint deleted', config);
			printData({ id: endpointId, deleted: true }, config);
		});
	});

const endpointsDeleteByUrlCommand = new Command('delete-by-url')
	.description('Delete the webhook endpoint with exactly this registered URL')
	.requiredOption('--url <url>', 'Registered endpoint URL')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			if (!(await confirmDestructive(`Delete webhook endpoint ${opts.url}?`, Boolean(opts.yes))))
				return;
			const result = await withSpinner('Deleting endpoint', config, () =>
				client.webhooks.deleteEndpointByUrl(opts.url, accountId),
			);
			printSuccess('Webhook endpoint deleted', config);
			printData(result, config);
		});
	});

const endpointsSecretCommand = new Command('secret')
	.description(
		'Print the endpoint signing secret (signing must be enabled; not available via OAuth)',
	)
	.argument('<endpointId>', 'Endpoint ID')
	.action(async (endpointId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const result = await withSpinner('Fetching secret', config, () =>
				client.webhooks.getEndpointSecret(endpointId, accountId),
			);
			printData(result, config, (r) => r.secret);
		});
	});

const endpointsRotateSecretCommand = new Command('rotate-secret')
	.description('Replace the endpoint signing secret; the old one stops working immediately')
	.argument('<endpointId>', 'Endpoint ID')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (endpointId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			if (
				!(await confirmDestructive(
					`Rotate the signing secret of ${endpointId}? The current secret stops working immediately.`,
					Boolean(opts.yes),
				))
			)
				return;
			const result = await withSpinner('Rotating secret', config, () =>
				client.webhooks.rotateEndpointSecret(endpointId, accountId),
			);
			printSuccess('Signing secret rotated', config);
			printData(result, config, (r) => r.secret);
		});
	});

export const verifyCommand = new Command('verify')
	.description(
		'Verify a signed delivery (Standard Webhooks) against ASSINAFY_WEBHOOK_SECRET or the profile secret',
	)
	.argument('<bodyFile>', 'Raw request body exactly as received')
	.requiredOption('--id <value>', 'webhook-id header')
	.requiredOption('--timestamp <seconds>', 'webhook-timestamp header')
	.requiredOption('--signature <value>', 'webhook-signature header')
	.option('--tolerance <seconds>', 'Accepted clock difference in seconds', '300')
	.action(async (bodyFile, opts, command) => {
		await runAction(command, async ({ config }) => {
			if (!config.webhookSecret) {
				throw new CliError(
					'No webhook secret found. Set ASSINAFY_WEBHOOK_SECRET or `assinafy config set --webhook-secret`.',
				);
			}
			const valid = new WebhookVerifier(config.webhookSecret).verifyDelivery(
				readBinary(bodyFile),
				{
					'webhook-id': opts.id,
					'webhook-timestamp': opts.timestamp,
					'webhook-signature': opts.signature,
				},
				{ toleranceSeconds: parseInteger(opts.tolerance, '--tolerance', { min: 0 }) },
			);
			if (!valid) {
				throw new CliError('Invalid webhook signature or timestamp outside the tolerance window.');
			}
			printSuccess('Webhook signature is valid', config);
			printData({ valid, id: opts.id }, config, () => 'valid');
		});
	});

const endpointsCommand = new Command('endpoints')
	.description('Manage webhook endpoints and their signing secrets')
	.addCommand(endpointsListCommand)
	.addCommand(endpointsCreateCommand)
	.addCommand(endpointsGetCommand)
	.addCommand(endpointsUpdateCommand)
	.addCommand(endpointsDeleteCommand)
	.addCommand(endpointsDeleteByUrlCommand)
	.addCommand(endpointsSecretCommand)
	.addCommand(endpointsRotateSecretCommand);

export const webhooksCommand = new Command('webhooks')
	.description('Manage webhook endpoints, the primary subscription, and delivery history')
	.addCommand(endpointsCommand)
	.addCommand(registerCommand)
	.addCommand(getCommand)
	.addCommand(inactivateCommand)
	.addCommand(eventTypesCommand)
	.addCommand(dispatchesCommand)
	.addCommand(retryCommand)
	.addCommand(verifyCommand);
