import { Command, Option } from '@commander-js/extra-typings';
import type {
	ICreateEnvelopePayload,
	IEnvelopeDocumentPayload,
	IUpdateEnvelopePayload,
} from '../api';
import { requireDocumentArtifactName } from '../api/utils';
import { requireAccountId } from '../lib/client';
import { saveDownload } from '../lib/files';
import { parseJsonObject } from '../lib/json';
import { addDownloadOptions, addPaginationOptions, addSortableListOptions } from '../lib/options';
import { printData } from '../lib/output';
import { listParams } from '../lib/pagination';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient } from '../lib/run';

export const envelopesCommand = new Command('envelopes').description(
	'Send and manage groups of documents',
);

envelopesCommand.addCommand(
	addPaginationOptions(new Command('list').description('List workspace envelopes'))
		.option('--search <text>', 'Part of the envelope name')
		.addOption(
			new Option('--status <status>', 'Document lifecycle group').choices([
				'open',
				'closed',
			] as const),
		)
		.action(async (opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				printData(
					await client.envelopes.list(
						{ ...listParams(opts), status: opts.status },
						requireAccountId(config),
					),
					config,
				);
			});
		}),
);

for (const action of ['create', 'estimate-cost'] as const) {
	const cmd = new Command(action)
		.description(
			action === 'create'
				? 'Create an envelope and send invitations'
				: 'Estimate without sending or charging',
		)
		.requiredOption(
			'--data <json>',
			'Envelope JSON: name, signers, documents, optional max_total_credits',
		);
	if (action === 'create')
		cmd.option('--idempotency-key <key>', 'Creation key for recovering a lost response');
	envelopesCommand.addCommand(
		cmd.action(async (opts: { data: string; idempotencyKey?: string }, command) => {
			await runWithClient(command, async ({ client, config }) => {
				const payload = parseJsonObject(opts.data, '--data') as unknown as ICreateEnvelopePayload;
				const accountId = requireAccountId(config);
				const result =
					action === 'create'
						? await client.envelopes.create(payload, {
								accountId,
								idempotencyKey: opts.idempotencyKey,
							})
						: await client.envelopes.estimateCost(payload, accountId);
				printData(result, config);
			});
		}),
	);
}

envelopesCommand.addCommand(
	new Command('get')
		.description('Read an envelope and its documents')
		.argument('<envelopeId>', 'Envelope ID')
		.action(async (id, _opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				printData(await client.envelopes.get(id, requireAccountId(config)), config);
			});
		}),
);

envelopesCommand.addCommand(
	new Command('update')
		.description('Rename, change message, or reorder documents')
		.argument('<envelopeId>', 'Envelope ID')
		.requiredOption('--data <json>', 'Partial JSON: name, message (null clears), document_ids')
		.action(async (id, opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				printData(
					await client.envelopes.update(
						id,
						parseJsonObject(opts.data, '--data') as IUpdateEnvelopePayload,
						requireAccountId(config),
					),
					config,
				);
			});
		}),
);

for (const action of ['cancel', 'delete'] as const) {
	envelopesCommand.addCommand(
		new Command(action)
			.description(
				action === 'cancel'
					? 'Cancel open documents and notify recipients'
					: 'Delete a closed envelope, keeping its documents',
			)
			.argument('<envelopeId>', 'Envelope ID')
			.option('-y, --yes', 'Skip confirmation')
			.action(async (id, opts, command) => {
				await runWithClient(command, async ({ client, config }) => {
					if (!(await confirmDestructive(`${action} envelope ${id}?`, Boolean(opts.yes)))) return;
					printData(await client.envelopes[action](id, requireAccountId(config)), config);
				});
			}),
	);
}

envelopesCommand.addCommand(
	addSortableListOptions(
		new Command('activities')
			.description('Read a page of document activities')
			.argument('<envelopeId>', 'Envelope ID'),
		'id or -id',
	).action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			printData(
				await client.envelopes.activities(id, listParams(opts), requireAccountId(config)),
				config,
			);
		});
	}),
);

envelopesCommand.addCommand(
	addDownloadOptions(
		new Command('download')
			.description('Download a ZIP of document artifacts')
			.argument('<envelopeId>', 'Envelope ID'),
	)
		.option(
			'--artifact <name>',
			'original, certificated, certificate-page, pades, bundle',
			'certificated',
		)
		.action(async (id, opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				const artifact = requireDocumentArtifactName(opts.artifact);
				await saveDownload(config, {
					message: 'Downloading envelope',
					download: () => client.envelopes.download(id, artifact, requireAccountId(config)),
					output: opts.output,
					defaultName: `envelope-${id}-${artifact}.zip`,
					force: opts.force,
				});
			});
		}),
);

envelopesCommand.addCommand(
	new Command('resend')
		.description('Resend one signer’s envelope invitation; paid channels cost credits')
		.argument('<envelopeId>', 'Envelope ID')
		.argument('<signerId>', 'Signer ID')
		.action(async (id, signerId, _opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				printData(
					await client.envelopes.resendNotification(id, signerId, requireAccountId(config)),
					config,
				);
			});
		}),
);

envelopesCommand.addCommand(
	new Command('add-document')
		.description('Add a processed document and notify its envelope signers')
		.argument('<envelopeId>', 'Envelope ID')
		.requiredOption(
			'--data <json>',
			'JSON: id, signer_ids, optional method, entries, expires_at, copy_receiver_ids, max_total_credits',
		)
		.action(async (id, opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				printData(
					await client.envelopes.addDocument(
						id,
						parseJsonObject(opts.data, '--data') as unknown as IEnvelopeDocumentPayload,
						requireAccountId(config),
					),
					config,
				);
			});
		}),
);

envelopesCommand.addCommand(
	new Command('remove-document')
		.description('Cancel and remove an open document, notifying its recipients')
		.argument('<envelopeId>', 'Envelope ID')
		.argument('<documentId>', 'Document ID')
		.option('-y, --yes', 'Skip confirmation')
		.action(async (id, documentId, opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				if (
					!(await confirmDestructive(
						`Cancel and remove document ${documentId} from envelope ${id}?`,
						Boolean(opts.yes),
					))
				)
					return;
				printData(
					await client.envelopes.removeDocument(id, documentId, requireAccountId(config)),
					config,
				);
			});
		}),
);
