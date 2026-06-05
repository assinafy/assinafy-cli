import { Command } from '@commander-js/extra-typings';
import type {
	DocumentArtifactName,
	IDocumentListParams,
	ITemplateCostSigner,
	ITemplateSigner,
} from '../api';
import { requireAccountId } from '../lib/client';
import { defaultArtifactFilename, writeBinary } from '../lib/files';
import { parseInteger, parseJsonArray, parseJsonObject, splitList } from '../lib/json';
import { addListOptions } from '../lib/options';
import { printData, printSuccess } from '../lib/output';
import { listParams, paginationFooter } from '../lib/pagination';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient, runWithOptionalClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const uploadCommand = new Command('upload')
	.description('Upload a PDF to the workspace')
	.argument('<file>', 'Path to the PDF file')
	.option('--name <name>', 'Override the document name (defaults to the file name)')
	.option('--metadata <json>', 'JSON object of metadata to attach')
	.option('--wait', 'Wait until the document finishes processing')
	.action(async (file, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const metadata = parseJsonObject(opts.metadata, '--metadata');
			const source = opts.name ? { filePath: file, fileName: opts.name } : { filePath: file };

			const doc = await withSpinner('Uploading document', config, () =>
				client.documents.upload(source, metadata ? { accountId, metadata } : { accountId }),
			);

			if (opts.wait) {
				await withSpinner('Waiting for processing', config, () =>
					client.documents.waitUntilReady(doc.id),
				);
			}

			printSuccess(`Uploaded document ${doc.id}`, config);
			printData(doc, config, (d) =>
				renderKeyValue({ id: d.id, name: d.name, status: d.status, account_id: d.account_id }),
			);
		});
	});

const listCommand = addListOptions(
	new Command('list')
		.description('List workspace documents')
		.option('--status <status>', 'Filter by document status')
		.option('--method <method>', 'Filter by signature method (virtual or collect)')
		.option('--tags <ids>', 'Comma-separated tag IDs (AND semantics)'),
).action(async (opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const params: IDocumentListParams = { ...listParams(opts) };
		if (opts.status) params.status = opts.status;
		if (opts.method) params.method = opts.method as IDocumentListParams['method'];
		if (opts.tags) params.tags = opts.tags;
		const result = await withSpinner('Fetching documents', config, () =>
			client.documents.list(params, accountId),
		);
		printData(result.data, config, (rows) => {
			const table = renderTable(rows, [
				{ header: 'ID', value: (r) => r.id },
				{ header: 'NAME', value: (r) => r.name },
				{ header: 'STATUS', value: (r) => r.status },
				{ header: 'CREATED', value: (r) => r.created_at },
			]);
			const footer = paginationFooter(result);
			return footer ? `${table}\n${footer}` : table;
		});
	});
});

const getCommand = new Command('get')
	.description('Show details for a document')
	.argument('<id>', 'Document ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const doc = await withSpinner('Fetching document', config, () =>
				client.documents.details(id),
			);
			printData(doc, config, (d) =>
				renderKeyValue({
					id: d.id,
					name: d.name,
					status: d.status,
					account_id: d.account_id,
					created_at: d.created_at,
					updated_at: d.updated_at,
					is_closed: d.is_closed,
				}),
			);
		});
	});

const downloadCommand = new Command('download')
	.description('Download a document artifact')
	.argument('<id>', 'Document ID')
	.option(
		'--artifact <name>',
		'original | certificated | certificate-page | bundle',
		'certificated',
	)
	.option('-o, --output <path>', 'Output file path')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const artifact = opts.artifact as DocumentArtifactName;
			const buffer = await withSpinner('Downloading document', config, () =>
				client.documents.download(id, artifact),
			);
			const out = writeBinary(opts.output ?? defaultArtifactFilename(id, artifact), buffer);
			printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
			printData({ path: out, bytes: buffer.byteLength, artifact }, config, (d) => d.path);
		});
	});

const thumbnailCommand = new Command('thumbnail')
	.description('Download the document thumbnail (JPEG)')
	.argument('<id>', 'Document ID')
	.option('-o, --output <path>', 'Output file path')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const buffer = await withSpinner('Downloading thumbnail', config, () =>
				client.documents.thumbnail(id),
			);
			const out = writeBinary(opts.output ?? defaultArtifactFilename(id, 'thumbnail'), buffer);
			printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
			printData({ path: out, bytes: buffer.byteLength }, config, (d) => d.path);
		});
	});

const downloadPageCommand = new Command('download-page')
	.description('Download a single document page (JPEG)')
	.argument('<id>', 'Document ID')
	.argument('<pageId>', 'Page ID')
	.option('-o, --output <path>', 'Output file path')
	.action(async (id, pageId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const buffer = await withSpinner('Downloading page', config, () =>
				client.documents.downloadPage(id, pageId),
			);
			const out = writeBinary(opts.output ?? `${id}-page-${pageId}.jpg`, buffer);
			printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
			printData({ path: out, bytes: buffer.byteLength }, config, (d) => d.path);
		});
	});

const activitiesCommand = new Command('activities')
	.description('Show the activity log for a document')
	.argument('<id>', 'Document ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const activities = await withSpinner('Fetching activities', config, () =>
				client.documents.activities(id),
			);
			printData(activities, config, (rows) =>
				renderTable(rows, [
					{ header: 'EVENT', value: (r) => r.event },
					{ header: 'MESSAGE', value: (r) => r.message },
					{ header: 'WHEN', value: (r) => r.created_at },
				]),
			);
		});
	});

const deleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete a document')
	.argument('<id>', 'Document ID')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const ok = await confirmDestructive(`Delete document ${id}?`, Boolean(opts.yes));
			if (!ok) return;
			await withSpinner('Deleting document', config, () => client.documents.delete(id));
			printSuccess(`Deleted document ${id}`, config);
			printData({ deleted: id }, config);
		});
	});

const tagsCommand = new Command('tags')
	.description('List the tags attached to a document')
	.argument('<id>', 'Document ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const tags = await withSpinner('Fetching tags', config, () =>
				client.documents.listTags(id, accountId),
			);
			printData(tags, config, (rows) =>
				renderTable(rows, [
					{ header: 'ID', value: (r) => r.id },
					{ header: 'NAME', value: (r) => r.name },
					{ header: 'COLOR', value: (r) => r.color },
				]),
			);
		});
	});

const tagsSetCommand = new Command('tags-set')
	.description('Replace a document tag set (names; unknown names are auto-created)')
	.argument('<id>', 'Document ID')
	.argument('[names...]', 'Tag names (pass none to detach all)')
	.action(async (id, names, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const tags = await withSpinner('Replacing tags', config, () =>
				client.documents.replaceTags(id, names ?? [], accountId),
			);
			printSuccess(`Document now has ${tags.length} tag(s)`, config);
			printData(tags, config);
		});
	});

const tagsAddCommand = new Command('tags-add')
	.description('Attach additional tags by name without removing existing ones')
	.argument('<id>', 'Document ID')
	.argument('<names...>', 'Tag names to attach')
	.action(async (id, names, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const tags = await withSpinner('Adding tags', config, () =>
				client.documents.addTags(id, names, accountId),
			);
			printSuccess(`Document now has ${tags.length} tag(s)`, config);
			printData(tags, config);
		});
	});

const tagsRemoveCommand = new Command('tags-remove')
	.description('Detach a single tag from a document')
	.argument('<id>', 'Document ID')
	.argument('<tagId>', 'Tag ID to detach')
	.action(async (id, tagId, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			await withSpinner('Detaching tag', config, () =>
				client.documents.detachTag(id, tagId, accountId),
			);
			printSuccess(`Detached tag ${tagId}`, config);
			printData({ document_id: id, detached_tag: tagId }, config);
		});
	});

const createFromTemplateCommand = new Command('create-from-template')
	.description('Create a document from a template')
	.argument('<templateId>', 'Template ID')
	.requiredOption(
		'--signers <json>',
		'JSON array of signers, e.g. \'[{"role_id":"r","id":"s","verification_method":"Email","notification_methods":["Email"]}]\'',
	)
	.option('--name <name>', 'Document name')
	.option('--message <message>', 'Message shown to signers')
	.option('--expires-at <iso8601>', 'Expiration timestamp')
	.option('--tags <names>', 'Comma-separated tag names to attach')
	.option('--editor-fields <json>', 'JSON array of editor field placements')
	.action(async (templateId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const signers = parseJsonArray(opts.signers, '--signers') as ITemplateSigner[];
			const editorFields = parseJsonArray(opts.editorFields, '--editor-fields');
			const options = clean({
				name: opts.name,
				message: opts.message,
				expires_at: opts.expiresAt,
				tags: splitList(opts.tags),
				editor_fields: editorFields,
			});
			const doc = await withSpinner('Creating document from template', config, () =>
				client.documents.createFromTemplate(templateId, signers, options, accountId),
			);
			printSuccess(`Created document ${doc.id}`, config);
			printData(doc, config, (d) => renderKeyValue({ id: d.id, name: d.name, status: d.status }));
		});
	});

const estimateTemplateCostCommand = new Command('estimate-template-cost')
	.description('Estimate the credit cost of creating a document from a template')
	.argument('<templateId>', 'Template ID')
	.requiredOption('--signers <json>', 'JSON array of signers')
	.action(async (templateId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const signers = parseJsonArray(opts.signers, '--signers') as ITemplateCostSigner[];
			const result = await withSpinner('Estimating cost', config, () =>
				client.documents.estimateCostFromTemplate(templateId, signers, accountId),
			);
			printData(result, config);
		});
	});

const verifyCommand = new Command('verify')
	.description('Verify a document by its signature hash')
	.argument('<hash>', 'Signature hash')
	.action(async (hash, _opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const result = await withSpinner('Verifying document', config, () =>
				client.documents.verify(hash),
			);
			printData(result, config);
		});
	});

const statusesCommand = new Command('statuses')
	.description('List every possible document status')
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const statuses = await withSpinner('Fetching statuses', config, () =>
				client.documents.statuses(),
			);
			// The API returns only `code` + `deletable` (no `description`), so we
			// don't render a permanently-empty DESCRIPTION column.
			printData(statuses, config, (rows) =>
				renderTable(rows, [
					{ header: 'CODE', value: (r) => r.code },
					{ header: 'DELETABLE', value: (r) => r.deletable },
				]),
			);
		});
	});

const publicCommand = new Command('public')
	.description('Public (unauthenticated) lookup of basic document info')
	.argument('<id>', 'Document ID')
	.action(async (id, _opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const info = await withSpinner('Fetching public info', config, () =>
				client.documents.getPublic(id),
			);
			printData(info, config, (d) => renderKeyValue(d as Record<string, unknown>));
		});
	});

const sendTokenCommand = new Command('send-token')
	.description('Send a 6-digit verification token to a signer')
	.argument('<id>', 'Document ID')
	.requiredOption('--recipient <value>', 'Email address or phone number')
	.option('--channel <channel>', 'email or whatsapp', 'email')
	.action(async (id, opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const result = await withSpinner('Sending token', config, () =>
				client.documents.sendToken(id, opts.recipient, opts.channel),
			);
			printSuccess(`Token sent to ${opts.recipient}`, config);
			printData(result, config);
		});
	});

const progressCommand = new Command('progress')
	.description('Show signing progress for a document')
	.argument('<id>', 'Document ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const progress = await withSpinner('Fetching progress', config, () =>
				client.documents.getSigningProgress(id),
			);
			printData(progress, config, (p) =>
				renderKeyValue({
					signed: p.signed,
					pending: p.pending,
					total: p.total,
					percentage: `${p.percentage}%`,
				}),
			);
		});
	});

const waitCommand = new Command('wait')
	.description('Poll a document until it is ready (or fails / times out)')
	.argument('<id>', 'Document ID')
	.option('--timeout <ms>', 'Maximum time to wait in milliseconds', '30000')
	.option('--interval <ms>', 'Poll interval in milliseconds', '2000')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const maxWaitMs = parseInteger(opts.timeout, '--timeout', { min: 1 });
			const pollIntervalMs = parseInteger(opts.interval, '--interval', { min: 1 });
			const doc = await withSpinner('Waiting for document', config, () =>
				client.documents.waitUntilReady(id, { maxWaitMs, pollIntervalMs }),
			);
			printSuccess(`Document ${id} is ${doc.status}`, config);
			printData(doc, config, (d) => renderKeyValue({ id: d.id, status: d.status }));
		});
	});

/** Drop undefined/null entries so we never send empty params. */
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v !== undefined && v !== null) out[k] = v;
	}
	return out as Partial<T>;
}

export const documentsCommand = new Command('documents')
	.description('Upload, list, download, and manage documents')
	.addCommand(uploadCommand)
	.addCommand(listCommand)
	.addCommand(getCommand)
	.addCommand(downloadCommand)
	.addCommand(thumbnailCommand)
	.addCommand(downloadPageCommand)
	.addCommand(activitiesCommand)
	.addCommand(deleteCommand)
	.addCommand(tagsCommand)
	.addCommand(tagsSetCommand)
	.addCommand(tagsAddCommand)
	.addCommand(tagsRemoveCommand)
	.addCommand(createFromTemplateCommand)
	.addCommand(estimateTemplateCostCommand)
	.addCommand(verifyCommand)
	.addCommand(statusesCommand)
	.addCommand(publicCommand)
	.addCommand(sendTokenCommand)
	.addCommand(progressCommand)
	.addCommand(waitCommand);
