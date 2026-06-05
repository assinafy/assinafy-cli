import { Command } from '@commander-js/extra-typings';
import type { ICreateAssignmentPayload, SignerReference } from '../api';
import { CliError } from '../lib/errors';
import { parseJsonArray, splitList } from '../lib/json';
import { printData, printSuccess } from '../lib/output';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

/** Resolve the `signers` array from either --signers JSON or --signer-ids CSV. */
function resolveSigners(signersJson?: string, signerIdsCsv?: string): SignerReference[] {
	if (signersJson) {
		return parseJsonArray(signersJson, '--signers') as SignerReference[];
	}
	const ids = splitList(signerIdsCsv);
	if (!ids || ids.length === 0) {
		throw new CliError('Provide signers with --signer-ids <id1,id2> or --signers <json>.');
	}
	return ids;
}

const createCommand = new Command('create')
	.description('Create a signing assignment for a document')
	.argument('<documentId>', 'Document ID')
	.option('--signer-ids <csv>', 'Comma-separated signer IDs')
	.option('--signers <json>', 'JSON array of signer refs (with verification_method, step, …)')
	.option('--method <method>', 'virtual or collect', 'virtual')
	.option('--message <message>', 'Message shown to signers')
	.option('--expires-at <iso8601>', 'Expiration timestamp')
	.option('--copy-receivers <csv>', 'Comma-separated signer IDs to receive a copy of the document')
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
	.option('--signer-ids <csv>', 'Comma-separated signer IDs')
	.option('--signers <json>', 'JSON array of signer refs')
	.action(async (documentId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const payload: ICreateAssignmentPayload = {
				signers: resolveSigners(opts.signers, opts.signerIds),
			};
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
	.option('--expires-at <iso8601>', 'New expiration timestamp')
	.option('--clear', 'Remove the expiration entirely')
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
	.addCommand(createCommand)
	.addCommand(estimateCostCommand)
	.addCommand(resetExpirationCommand)
	.addCommand(resendCommand)
	.addCommand(estimateResendCostCommand)
	.addCommand(whatsappCommand);
