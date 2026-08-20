import { Command, Option } from '@commander-js/extra-typings';
import type { ICollectAssignmentEntry, ICreateAssignmentPayload, SignerReference } from '../api';
import { requireAccountId } from '../lib/client';
import { CliError } from '../lib/errors';
import { parseJsonArray, splitList } from '../lib/json';
import { addSortableListOptions } from '../lib/options';
import { printData, printPaginatedData, printSuccess } from '../lib/output';
import { listParams, paginationFooter } from '../lib/pagination';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

/** Resolve the `signers` array from either --signers JSON or --signer-ids CSV. */
export function resolveSigners(
	signersJson?: string,
	signerIdsCsv?: string,
	required = true,
): SignerReference[] {
	if (signersJson) {
		return parseJsonArray(signersJson, '--signers') as SignerReference[];
	}
	const ids = splitList(signerIdsCsv);
	if (!ids || ids.length === 0) {
		if (!required) return [];
		throw new CliError('Provide signers with --signer-ids <id1,id2> or --signers <json>.');
	}
	return ids;
}

const listCommand = addSortableListOptions(
	new Command('list').description('List assignments across the account'),
	'Sort by created_at (prefix with - for descending)',
).action(async (opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const result = await withSpinner('Fetching assignments', config, () =>
			client.assignments.list(listParams(opts), accountId),
		);
		printPaginatedData(result, config, (rows) => {
			const table = renderTable(rows, [
				{ header: 'ID', value: (r) => r.id },
				{ header: 'METHOD', value: (r) => r.method },
				{ header: 'SENDER', value: (r) => r.sender_email },
				{ header: 'SIGNERS', value: (r) => r.signers?.length },
				{ header: 'EXPIRES', value: (r) => r.expires_at },
			]);
			const footer = paginationFooter(result);
			return footer ? `${table}\n${footer}` : table;
		});
	});
});

const createCommand = new Command('create')
	.description('Create a signing assignment for a document')
	.argument('<documentId>', 'Document ID')
	.addOption(new Option('--signer-ids <csv>', 'Comma-separated signer IDs').conflicts('signers'))
	.addOption(
		new Option(
			'--signers <json>',
			'JSON array of signer refs (with verification_method, step, …)',
		).conflicts('signerIds'),
	)
	.option('--method <method>', 'virtual or collect', 'virtual')
	.option('--message <message>', 'Message shown to signers')
	.option('--expires-at <iso8601>', 'Expiration timestamp')
	.option('--copy-receivers <csv>', 'Comma-separated signer IDs to receive a copy of the document')
	.option(
		'--entries <json>',
		'JSON array of field placement entries, required for --method collect (e.g. \'[{"page_id":"p1","fields":[{"signer_id":"s1","field_id":"f1"}]}]\')',
	)
	.action(async (documentId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const payload: ICreateAssignmentPayload = {
				method: opts.method as ICreateAssignmentPayload['method'],
				signers: resolveSigners(opts.signers, opts.signerIds),
			};
			if (opts.message) payload.message = opts.message;
			if (opts.expiresAt) payload.expires_at = opts.expiresAt;
			const cc = splitList(opts.copyReceivers);
			if (cc) payload.copy_receivers = cc;
			if (opts.entries) {
				payload.entries = parseJsonArray(opts.entries, '--entries') as ICollectAssignmentEntry[];
			}
			const assignment = await withSpinner('Creating assignment', config, () =>
				client.assignments.create(documentId, payload),
			);
			printSuccess(`Assignment ${assignment.id}`, config);
			printData(assignment, config, (a) =>
				renderKeyValue({
					id: a.id,
					method: a.method,
					signers: a.signers?.length,
					expires_at: a.expires_at,
				}),
			);
		});
	});

const estimateCostCommand = new Command('estimate-cost')
	.description('Estimate the credit cost of an assignment')
	.argument('<documentId>', 'Document ID')
	.addOption(new Option('--signer-ids <csv>', 'Comma-separated signer IDs').conflicts('signers'))
	.addOption(new Option('--signers <json>', 'JSON array of signer refs').conflicts('signerIds'))
	.option('--method <method>', 'virtual or collect', 'virtual')
	.option(
		'--entries <json>',
		'JSON array of field placement entries, required for --method collect',
	)
	.action(async (documentId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const method = opts.method as ICreateAssignmentPayload['method'];
			const payload: ICreateAssignmentPayload = {
				method,
				signers: resolveSigners(opts.signers, opts.signerIds, method !== 'collect'),
			};
			if (opts.entries) {
				payload.entries = parseJsonArray(opts.entries, '--entries') as ICollectAssignmentEntry[];
			}
			const result = await withSpinner('Estimating cost', config, () =>
				client.assignments.estimateCost(documentId, payload),
			);
			printData(result, config);
		});
	});

const resetExpirationCommand = new Command('reset-expiration')
	.description('Update or clear an assignment expiration date')
	.argument('<documentId>', 'Document ID')
	.argument('<assignmentId>', 'Assignment ID')
	.addOption(new Option('--expires-at <iso8601>', 'New expiration timestamp').conflicts('clear'))
	.addOption(new Option('--clear', 'Remove the expiration entirely').conflicts('expiresAt'))
	.action(async (documentId, assignmentId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			if (!opts.clear && !opts.expiresAt) {
				throw new CliError('Pass --expires-at <iso8601> or --clear.');
			}
			const expiresAt = opts.clear ? null : (opts.expiresAt as string);
			const assignment = await withSpinner('Updating expiration', config, () =>
				client.assignments.resetExpiration(documentId, assignmentId, expiresAt),
			);
			printSuccess('Expiration updated', config);
			printData(assignment, config, (a) => renderKeyValue({ id: a.id, expires_at: a.expires_at }));
		});
	});

const resendCommand = new Command('resend')
	.description('Resend the signing notification to a signer')
	.argument('<documentId>', 'Document ID')
	.argument('<assignmentId>', 'Assignment ID')
	.argument('<signerId>', 'Signer ID')
	.action(async (documentId, assignmentId, signerId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const result = await withSpinner('Resending notification', config, () =>
				client.assignments.resendNotification(documentId, assignmentId, signerId),
			);
			printSuccess('Notification resent', config);
			printData(result, config);
		});
	});

const estimateResendCostCommand = new Command('estimate-resend-cost')
	.description('Estimate the cost of resending a signer notification')
	.argument('<documentId>', 'Document ID')
	.argument('<assignmentId>', 'Assignment ID')
	.argument('<signerId>', 'Signer ID')
	.action(async (documentId, assignmentId, signerId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const result = await withSpinner('Estimating resend cost', config, () =>
				client.assignments.estimateResendCost(documentId, assignmentId, signerId),
			);
			printData(result, config);
		});
	});

const whatsappCommand = new Command('whatsapp-notifications')
	.description('List WhatsApp notifications sent for an assignment')
	.argument('<documentId>', 'Document ID')
	.argument('<assignmentId>', 'Assignment ID')
	.action(async (documentId, assignmentId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const notes = await withSpinner('Fetching notifications', config, () =>
				client.assignments.listWhatsAppNotifications(documentId, assignmentId),
			);
			printData(notes, config, (rows) =>
				renderTable(rows, [
					{ header: 'PHONE', value: (r) => r.phone_number },
					{ header: 'SIGNER', value: (r) => r.signer_id },
					{ header: 'SENT AT', value: (r) => r.sent_at },
					{ header: 'HEADER', value: (r) => r.header },
				]),
			);
		});
	});

export const assignmentsCommand = new Command('assignments')
	.description('Create and manage signing assignments')
	.addCommand(listCommand)
	.addCommand(createCommand)
	.addCommand(estimateCostCommand)
	.addCommand(resetExpirationCommand)
	.addCommand(resendCommand)
	.addCommand(estimateResendCostCommand)
	.addCommand(whatsappCommand);
