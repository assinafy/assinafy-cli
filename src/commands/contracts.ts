import { Command } from '@commander-js/extra-typings';
import type {
	IContractListParams,
	IRenewContractPayload,
	ISetContractPayload,
	ITerminateContractPayload,
} from '../api';
import { requireAccountId } from '../lib/client';
import { parseInteger, parseJsonObject } from '../lib/json';
import { addListOptions } from '../lib/options';
import { printData } from '../lib/output';
import { listParams, tableWithFooter } from '../lib/pagination';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderTable } from '../lib/table';

const listCommand = addListOptions(
	new Command('list').description('List workspace contract terms'),
	'end_date or updated_at; prefix with - for descending',
)
	.option('--status <csv>', 'draft, active, expired, terminated (comma-separated)')
	.option('--counterparty <query>', 'Counterparty name or exact CPF/CNPJ')
	.option('--end-date-from <date>', 'Earliest end date (YYYY-MM-DD)')
	.option('--end-date-to <date>', 'Latest end date (YYYY-MM-DD)')
	.option('--ending-within-days <n>', 'Ends within 0–3650 days; 0 includes today in Brasília')
	.option('--external-system <system>', 'External reference system')
	.option('--external-id <id>', 'External reference ID')
	.option('--expand <relation>', 'Embed document')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const params: IContractListParams = {
				...listParams(opts),
				status: opts.status,
				counterparty: opts.counterparty,
				end_date_from: opts.endDateFrom,
				end_date_to: opts.endDateTo,
				ending_within_days: parseInteger(opts.endingWithinDays, '--ending-within-days', { min: 0 }),
				external_system: opts.externalSystem,
				external_id: opts.externalId,
				expand: opts.expand as IContractListParams['expand'],
			};
			const result = await withSpinner('Fetching contracts', config, () =>
				client.contracts.list(params, requireAccountId(config)),
			);
			printData(result, config, (page) =>
				tableWithFooter(
					renderTable(page.data, [
						{ header: 'DOCUMENT', value: (r) => r.document_id },
						{ header: 'STATUS', value: (r) => r.status },
						{ header: 'COUNTERPARTY', value: (r) => r.counterparty_name },
						{ header: 'END DATE', value: (r) => r.end_date },
						{ header: 'TERM', value: (r) => r.term },
					]),
					page,
				),
			);
		});
	});

const getCommand = new Command('get')
	.description('Read a document’s contract terms or amendment link')
	.argument('<documentId>', 'Document ID')
	.action(async (documentId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			printData(await client.contracts.get(documentId, requireAccountId(config)), config);
		});
	});

const setCommand = new Command('set')
	.description('Set terms or link an amendment; null clears, omitted fields stay unchanged')
	.argument('<documentId>', 'Document ID')
	.requiredOption(
		'--data <json>',
		'JSON terms or amendment link; include updated_at for conflict detection',
	)
	.action(async (documentId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const payload = parseJsonObject(opts.data, '--data') as ISetContractPayload;
			printData(await client.contracts.set(documentId, payload, requireAccountId(config)), config);
		});
	});

const relatedCommand = new Command('related')
	.description('Read the root contract and every linked instrument')
	.argument('<documentId>', 'Contract or amendment document ID')
	.action(async (documentId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			printData(await client.contracts.related(documentId, requireAccountId(config)), config);
		});
	});

const renewCommand = new Command('renew')
	.description('Start the next term using the current term or a later end_date')
	.argument('<documentId>', 'Document ID')
	.requiredOption('--data <json>', 'JSON with term or end_date, optional value and updated_at')
	.option('-y, --yes', 'Skip confirmation')
	.action(async (documentId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const payload = parseJsonObject(opts.data, '--data') as IRenewContractPayload;
			if (!(await confirmDestructive(`Renew contract ${documentId}?`, Boolean(opts.yes)))) return;
			printData(
				await client.contracts.renew(documentId, payload, requireAccountId(config)),
				config,
			);
		});
	});

const terminateCommand = new Command('terminate')
	.description('Terminate tracked terms and stop lifecycle alerts')
	.argument('<documentId>', 'Document ID')
	.option('--data <json>', 'JSON with optional reason and updated_at')
	.option('-y, --yes', 'Skip confirmation')
	.action(async (documentId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const payload: ITerminateContractPayload = parseJsonObject(opts.data, '--data') ?? {};
			if (!(await confirmDestructive(`Terminate contract ${documentId}?`, Boolean(opts.yes))))
				return;
			printData(
				await client.contracts.terminate(documentId, payload, requireAccountId(config)),
				config,
			);
		});
	});

export const contractsCommand = new Command('contracts')
	.description('Track contract terms, amendments, renewals and terminations (CLM)')
	.addCommand(listCommand)
	.addCommand(getCommand)
	.addCommand(setCommand)
	.addCommand(relatedCommand)
	.addCommand(renewCommand)
	.addCommand(terminateCommand);
