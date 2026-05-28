import { Command } from '@commander-js/extra-typings';
import type { ICreateSignerPayload, IUpdateSignerPayload } from '../api';
import { requireAccountId } from '../lib/client';
import { parseJsonObject } from '../lib/json';
import { addListOptions } from '../lib/options';
import { printData, printSuccess } from '../lib/output';
import { listParams, paginationFooter } from '../lib/pagination';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const signerColumns = [
	{ header: 'ID', value: (r: { id: string }) => r.id },
	{ header: 'NAME', value: (r: { full_name: string }) => r.full_name },
	{ header: 'EMAIL', value: (r: { email: string | null }) => r.email },
	{
		header: 'PHONE',
		value: (r: { whatsapp_phone_number?: string | null }) => r.whatsapp_phone_number,
	},
];

const createCommand = new Command('create')
	.description('Create a signer (reuses an existing one with the same email)')
	.requiredOption('--name <name>', 'Signer full name')
	.option('--email <email>', 'Email address')
	.option('--phone <number>', 'WhatsApp phone number (E.164)')
	.option('--cpf <cpf>', 'Brazilian tax ID (CPF); non-digits are stripped')
	.option('--metadata <json>', 'JSON object of metadata')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const payload: ICreateSignerPayload = { full_name: opts.name };
			if (opts.email) payload.email = opts.email;
			if (opts.phone) payload.whatsapp_phone_number = opts.phone;
			if (opts.cpf) payload.cpf = opts.cpf;
			const metadata = parseJsonObject(opts.metadata, '--metadata');
			if (metadata) payload.metadata = metadata;
			const signer = await withSpinner('Creating signer', config, () =>
				client.signers.create(payload, accountId),
			);
			printSuccess(`Signer ${signer.id}`, config);
			printData(signer, config, (s) =>
				renderKeyValue({
					id: s.id,
					full_name: s.full_name,
					email: s.email,
					whatsapp_phone_number: s.whatsapp_phone_number,
				}),
			);
		});
	});

const listCommand = addListOptions(
	new Command('list').description('List signers in the workspace'),
).action(async (opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const result = await withSpinner('Fetching signers', config, () =>
			client.signers.list(listParams(opts), accountId),
		);
		printData(result.data, config, (rows) => {
			const table = renderTable(rows, signerColumns);
			const footer = paginationFooter(result);
			return footer ? `${table}\n${footer}` : table;
		});
	});
});

const getCommand = new Command('get')
	.description('Show a signer by ID')
	.argument('<id>', 'Signer ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const signer = await withSpinner('Fetching signer', config, () =>
				client.signers.get(id, accountId),
			);
			printData(signer, config, (s) => renderKeyValue(s as unknown as Record<string, unknown>));
		});
	});

const updateCommand = new Command('update')
	.description('Update a signer')
	.argument('<id>', 'Signer ID')
	.option('--name <name>', 'Signer full name')
	.option('--email <email>', 'Email address')
	.option('--phone <number>', 'WhatsApp phone number (E.164)')
	.option('--cpf <cpf>', 'Brazilian tax ID (CPF)')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const payload: IUpdateSignerPayload = {};
			if (opts.name) payload.full_name = opts.name;
			if (opts.email) payload.email = opts.email;
			if (opts.phone) payload.whatsapp_phone_number = opts.phone;
			if (opts.cpf) payload.cpf = opts.cpf;
			const signer = await withSpinner('Updating signer', config, () =>
				client.signers.update(id, payload, accountId),
			);
			printSuccess(`Updated signer ${signer.id}`, config);
			printData(signer, config, (s) =>
				renderKeyValue({ id: s.id, full_name: s.full_name, email: s.email }),
			);
		});
	});

const deleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete a signer')
	.argument('<id>', 'Signer ID')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			if (!(await confirmDestructive(`Delete signer ${id}?`, Boolean(opts.yes)))) return;
			await withSpinner('Deleting signer', config, () => client.signers.delete(id, accountId));
			printSuccess(`Deleted signer ${id}`, config);
			printData({ deleted: id }, config);
		});
	});

const findCommand = new Command('find-by-email')
	.description('Find a signer by email address')
	.argument('<email>', 'Email address')
	.action(async (email, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const signer = await withSpinner('Searching', config, () =>
				client.signers.findByEmail(email, accountId),
			);
			if (!signer) {
				printData({ found: false, email }, config, () => 'No signer found.');
				return;
			}
			printData(signer, config, (s) =>
				renderKeyValue({ id: s.id, full_name: s.full_name, email: s.email }),
			);
		});
	});

export const signersCommand = new Command('signers')
	.description('Create, list, and manage signers')
	.addCommand(createCommand)
	.addCommand(listCommand)
	.addCommand(getCommand)
	.addCommand(updateCommand)
	.addCommand(deleteCommand)
	.addCommand(findCommand);
