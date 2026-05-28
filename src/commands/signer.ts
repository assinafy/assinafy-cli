import { Command } from '@commander-js/extra-typings';
import type { DocumentArtifactName, ISignFieldEntry } from '../api';
import { defaultArtifactFilename, readBinary, writeBinary } from '../lib/files';
import { parseJsonArray, splitList } from '../lib/json';
import { addListOptions } from '../lib/options';
import { printData, printSuccess } from '../lib/output';
import { listParams } from '../lib/pagination';
import { runWithOptionalClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const documentCommand = new Command('document')
	.description("Fetch the signer's current document")
	.argument('<signerId>', 'Signer ID')
	.requiredOption('--access-code <code>', 'Signer access code')
	.action(async (signerId, opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const doc = await withSpinner('Fetching document', config, () =>
				client.signerDocuments.getCurrent(signerId, opts.accessCode),
			);
			printData(doc, config, (d) => renderKeyValue({ id: d.id, name: d.name, status: d.status }));
		});
	});

const documentsCommand = addListOptions(
	new Command('documents')
		.description("List the signer's documents")
		.argument('<signerId>', 'Signer ID')
		.requiredOption('--access-code <code>', 'Signer access code'),
).action(async (signerId, opts, command) => {
	await runWithOptionalClient(command, async ({ client, config }) => {
		const result = await withSpinner('Fetching documents', config, () =>
			client.signerDocuments.list(signerId, opts.accessCode, listParams(opts)),
		);
		printData(result.data, config, (rows) =>
			renderTable(rows, [
				{ header: 'ID', value: (r) => r.id },
				{ header: 'NAME', value: (r) => r.name },
				{ header: 'STATUS', value: (r) => r.status },
			]),
		);
	});
});

const downloadCommand = new Command('download')
	.description('Download a signer document artifact')
	.argument('<signerId>', 'Signer ID')
	.argument('<documentId>', 'Document ID')
	.argument('<artifact>', 'original | certificated | certificate-page | bundle')
	.requiredOption('--access-code <code>', 'Signer access code')
	.option('-o, --output <path>', 'Output file path')
	.action(async (signerId, documentId, artifact, opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const buffer = await withSpinner('Downloading', config, () =>
				client.signerDocuments.download(
					signerId,
					documentId,
					artifact as DocumentArtifactName,
					opts.accessCode,
				),
			);
			const out = writeBinary(opts.output ?? defaultArtifactFilename(documentId, artifact), buffer);
			printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
			printData({ path: out, bytes: buffer.byteLength }, config, (d) => d.path);
		});
	});

const selfCommand = new Command('self')
	.description("Fetch the signer's own profile")
	.requiredOption('--access-code <code>', 'Signer access code')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const profile = await withSpinner('Fetching profile', config, () =>
				client.signerDocuments.self(opts.accessCode),
			);
			printData(profile, config);
		});
	});

const acceptTermsCommand = new Command('accept-terms')
	.description('Accept the platform terms as the signer')
	.requiredOption('--access-code <code>', 'Signer access code')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const result = await withSpinner('Accepting terms', config, () =>
				client.signerDocuments.acceptTerms(opts.accessCode),
			);
			printSuccess('Terms accepted', config);
			printData(result, config);
		});
	});

const verifyEmailCommand = new Command('verify-email')
	.description('Verify the email OTP for a signer')
	.requiredOption('--access-code <code>', 'Signer access code')
	.requiredOption('--code <otp>', 'Verification code')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const result = await withSpinner('Verifying', config, () =>
				client.signerDocuments.verifyEmail({
					signerAccessCode: opts.accessCode,
					verificationCode: opts.code,
				}),
			);
			printSuccess('Email verified', config);
			printData(result, config);
		});
	});

const confirmDataCommand = new Command('confirm-data')
	.description("Confirm a signer's contact data")
	.argument('<documentId>', 'Document ID')
	.requiredOption('--access-code <code>', 'Signer access code')
	.option('--email <email>', 'Email to confirm')
	.option('--phone <number>', 'WhatsApp phone number to confirm')
	.option('--accept-terms', 'Also accept the platform terms')
	.action(async (documentId, opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const payload: {
				email?: string;
				whatsapp_phone_number?: string;
				has_accepted_terms?: boolean;
			} = {};
			if (opts.email) payload.email = opts.email;
			if (opts.phone) payload.whatsapp_phone_number = opts.phone;
			if (opts.acceptTerms) payload.has_accepted_terms = true;
			const result = await withSpinner('Confirming data', config, () =>
				client.signerDocuments.confirmData(documentId, opts.accessCode, payload),
			);
			printSuccess('Data confirmed', config);
			printData(result, config);
		});
	});

const uploadSignatureCommand = new Command('upload-signature')
	.description("Upload the signer's signature or initial image")
	.requiredOption('--access-code <code>', 'Signer access code')
	.requiredOption('--file <path>', 'Path to the signature image (PNG)')
	.option('--type <type>', 'signature or initial', 'signature')
	.option('--content-type <mime>', 'Image MIME type', 'image/png')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const image = readBinary(opts.file);
			const result = await withSpinner('Uploading signature', config, () =>
				client.signerDocuments.uploadSignature(opts.accessCode, image, {
					imageType: opts.type as 'signature' | 'initial',
					contentType: opts.contentType,
				}),
			);
			printSuccess('Signature uploaded', config);
			printData(result, config);
		});
	});

const downloadSignatureCommand = new Command('download-signature')
	.description("Download the signer's signature or initial image")
	.requiredOption('--access-code <code>', 'Signer access code')
	.option('--type <type>', 'signature or initial', 'signature')
	.option('-o, --output <path>', 'Output file path')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const buffer = await withSpinner('Downloading signature', config, () =>
				client.signerDocuments.downloadSignature(
					opts.accessCode,
					opts.type as 'signature' | 'initial',
				),
			);
			const out = writeBinary(opts.output ?? `signer-${opts.type}.png`, buffer);
			printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
			printData({ path: out, bytes: buffer.byteLength }, config, (d) => d.path);
		});
	});

const assignmentCommand = new Command('assignment')
	.description('Fetch the assignment as the signer sees it')
	.requiredOption('--access-code <code>', 'Signer access code')
	.option('--accept-terms', 'Pass has_accepted_terms=true')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const result = await withSpinner('Fetching assignment', config, () =>
				client.signerDocuments.getAssignment(opts.accessCode, opts.acceptTerms ? true : undefined),
			);
			printData(result, config);
		});
	});

const signCommand = new Command('sign')
	.description('Sign a document as the signer')
	.argument('<documentId>', 'Document ID')
	.argument('<assignmentId>', 'Assignment ID')
	.requiredOption('--access-code <code>', 'Signer access code')
	.requiredOption('--entries <json>', 'JSON array of { itemId, fieldId, pageId, value } entries')
	.action(async (documentId, assignmentId, opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const entries = parseJsonArray(opts.entries, '--entries') as ISignFieldEntry[];
			const result = await withSpinner('Signing document', config, () =>
				client.signerDocuments.sign(documentId, assignmentId, opts.accessCode, entries),
			);
			printSuccess('Document signed', config);
			printData(result, config);
		});
	});

const declineCommand = new Command('decline')
	.description('Decline an assignment as the signer')
	.argument('<documentId>', 'Document ID')
	.argument('<assignmentId>', 'Assignment ID')
	.requiredOption('--access-code <code>', 'Signer access code')
	.requiredOption('--reason <reason>', 'Reason for declining')
	.action(async (documentId, assignmentId, opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const result = await withSpinner('Declining', config, () =>
				client.signerDocuments.decline(documentId, assignmentId, opts.accessCode, opts.reason),
			);
			printSuccess('Assignment declined', config);
			printData(result, config);
		});
	});

const signMultipleCommand = new Command('sign-multiple')
	.description('Sign multiple documents at once')
	.requiredOption('--access-code <code>', 'Signer access code')
	.requiredOption('--document-ids <csv>', 'Comma-separated document IDs')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const ids = splitList(opts.documentIds) ?? [];
			const result = await withSpinner('Signing documents', config, () =>
				client.signerDocuments.signMultiple(ids, opts.accessCode),
			);
			printSuccess(`Signed ${ids.length} document(s)`, config);
			printData(result, config);
		});
	});

const declineMultipleCommand = new Command('decline-multiple')
	.description('Decline multiple documents at once')
	.requiredOption('--access-code <code>', 'Signer access code')
	.requiredOption('--document-ids <csv>', 'Comma-separated document IDs')
	.requiredOption('--reason <reason>', 'Reason for declining')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const ids = splitList(opts.documentIds) ?? [];
			const result = await withSpinner('Declining documents', config, () =>
				client.signerDocuments.declineMultiple(ids, opts.reason, opts.accessCode),
			);
			printSuccess(`Declined ${ids.length} document(s)`, config);
			printData(result, config);
		});
	});

export const signerCommand = new Command('signer')
	.description('Signer-side flows authenticated by a signer access code')
	.addCommand(documentCommand)
	.addCommand(documentsCommand)
	.addCommand(downloadCommand)
	.addCommand(selfCommand)
	.addCommand(acceptTermsCommand)
	.addCommand(verifyEmailCommand)
	.addCommand(confirmDataCommand)
	.addCommand(uploadSignatureCommand)
	.addCommand(downloadSignatureCommand)
	.addCommand(assignmentCommand)
	.addCommand(signCommand)
	.addCommand(declineCommand)
	.addCommand(signMultipleCommand)
	.addCommand(declineMultipleCommand);
