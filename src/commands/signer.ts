import { Command, Option } from '@commander-js/extra-typings';
import type { ISignFieldEntry } from '../api';
import { requireDocumentArtifactName, requireSignerImageType } from '../api/utils';
import { defaultArtifactFilename, readBinary, writeBinary } from '../lib/files';
import { parseJsonArray, splitList } from '../lib/json';
import { addListOptions } from '../lib/options';
import { printData, printPaginatedData, printSuccess } from '../lib/output';
import { listParams } from '../lib/pagination';
import { runWithPublicClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';
import { sanitizeTerminalText } from '../lib/terminal';

const accessCodeOption = () =>
	new Option('--access-code <code>', 'Signer access code')
		.env('ASSINAFY_SIGNER_ACCESS_CODE')
		.makeOptionMandatory();

const documentCommand = new Command('document')
	.description("Fetch the signer's current document")
	.argument('<signerId>', 'Signer ID')
	.addOption(accessCodeOption())
	.action(async (signerId, opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
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
		.addOption(accessCodeOption()),
).action(async (signerId, opts, command) => {
	await runWithPublicClient(command, async ({ client, config }) => {
		const result = await withSpinner('Fetching documents', config, () =>
			client.signerDocuments.list(signerId, opts.accessCode, listParams(opts)),
		);
		printPaginatedData(result, config, (rows) =>
			renderTable(rows, [
				{ header: 'ID', value: (r) => r.id },
				{ header: 'NAME', value: (r) => r.name },
				{ header: 'STATUS', value: (r) => r.status },
			]),
		);
	});
});

const searchCommand = new Command('search')
	.description("Search the signer's documents")
	.argument('<signerId>', 'Signer ID')
	.argument('<query>', 'Search text')
	.addOption(accessCodeOption())
	.action(async (signerId, query, opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const result = await withSpinner('Searching documents', config, () =>
				client.signerDocuments.search(signerId, query, opts.accessCode),
			);
			printPaginatedData(result, config, (rows) =>
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
	.argument('<artifact>', 'original | certificated | certificate-page | pades | bundle')
	.addOption(accessCodeOption())
	.option('-o, --output <path>', 'Output file path')
	.option('--force', 'Overwrite the output file if it already exists')
	.action(async (signerId, documentId, artifact, opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const artifactName = requireDocumentArtifactName(artifact);
			const buffer = await withSpinner('Downloading', config, () =>
				client.signerDocuments.download(signerId, documentId, artifactName, opts.accessCode),
			);
			const out = writeBinary(
				opts.output ?? defaultArtifactFilename(documentId, artifactName),
				buffer,
				{ force: opts.force },
			);
			printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
			printData({ path: out, bytes: buffer.byteLength }, config, (d) =>
				sanitizeTerminalText(d.path),
			);
		});
	});

const selfCommand = new Command('self')
	.description("Fetch the signer's own profile")
	.addOption(accessCodeOption())
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const profile = await withSpinner('Fetching profile', config, () =>
				client.signerDocuments.self(opts.accessCode),
			);
			printData(profile, config);
		});
	});

const acceptTermsCommand = new Command('accept-terms')
	.description('Accept the platform terms as the signer')
	.addOption(accessCodeOption())
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const result = await withSpinner('Accepting terms', config, () =>
				client.signerDocuments.acceptTerms(opts.accessCode),
			);
			printSuccess('Terms accepted', config);
			printData(result, config);
		});
	});

const verifyEmailCommand = new Command('verify-email')
	.description('Verify the email OTP for a signer')
	.addOption(accessCodeOption())
	.addOption(
		new Option('--code <otp>', 'Verification code')
			.env('ASSINAFY_VERIFICATION_CODE')
			.makeOptionMandatory(),
	)
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
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
	.addOption(accessCodeOption())
	.option('--full-name <name>', 'Full name to confirm')
	.option('--email <email>', 'Email to confirm')
	.option('--phone <number>', 'WhatsApp phone number to confirm')
	.option('--government-id <id>', 'Government ID (e.g. CPF) to confirm')
	.option('--accept-terms', 'Also accept the platform terms')
	.action(async (documentId, opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const payload: {
				full_name?: string;
				email?: string;
				whatsapp_phone_number?: string;
				government_id?: string;
				has_accepted_terms?: boolean;
			} = {};
			if (opts.fullName) payload.full_name = opts.fullName;
			if (opts.email) payload.email = opts.email;
			if (opts.phone) payload.whatsapp_phone_number = opts.phone;
			if (opts.governmentId) payload.government_id = opts.governmentId;
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
	.addOption(accessCodeOption())
	.requiredOption('--file <path>', 'Path to the signature image (PNG)')
	.option('--type <type>', 'signature or initial', 'signature')
	.option('--content-type <mime>', 'Image MIME type', 'image/png')
	.option('--reuse', "Mark the signer's signature as reusable in future processes")
	.option('--no-reuse', "Disable reuse of the signer's signature in future processes")
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const image = readBinary(opts.file);
			const imageType = requireSignerImageType(opts.type);
			const result = await withSpinner('Uploading signature', config, () =>
				client.signerDocuments.uploadSignature(opts.accessCode, image, {
					imageType,
					contentType: opts.contentType,
					reuse: opts.reuse,
				}),
			);
			printSuccess('Signature uploaded', config);
			printData(result, config);
		});
	});

const downloadSignatureCommand = new Command('download-signature')
	.description("Download the signer's signature or initial image")
	.addOption(accessCodeOption())
	.option('--type <type>', 'signature or initial', 'signature')
	.option('-o, --output <path>', 'Output file path')
	.option('--force', 'Overwrite the output file if it already exists')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const imageType = requireSignerImageType(opts.type);
			const buffer = await withSpinner('Downloading signature', config, () =>
				client.signerDocuments.downloadSignature(opts.accessCode, imageType),
			);
			const out = writeBinary(opts.output ?? `signer-${imageType}.png`, buffer, {
				force: opts.force,
			});
			printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
			printData({ path: out, bytes: buffer.byteLength }, config, (d) =>
				sanitizeTerminalText(d.path),
			);
		});
	});

const assignmentCommand = new Command('assignment')
	.description('Fetch the assignment as the signer sees it')
	.addOption(accessCodeOption())
	.option('--accept-terms', 'Pass has_accepted_terms=true')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
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
	.addOption(accessCodeOption())
	.requiredOption('--entries <json>', 'JSON array of { itemId, fieldId, pageId, value } entries')
	.action(async (documentId, assignmentId, opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
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
	.addOption(accessCodeOption())
	.requiredOption('--reason <reason>', 'Reason for declining')
	.action(async (documentId, assignmentId, opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const result = await withSpinner('Declining', config, () =>
				client.signerDocuments.decline(documentId, assignmentId, opts.accessCode, opts.reason),
			);
			printSuccess('Assignment declined', config);
			printData(result, config);
		});
	});

const signMultipleCommand = new Command('sign-multiple')
	.description('Sign multiple documents at once')
	.addOption(accessCodeOption())
	.requiredOption('--document-ids <csv>', 'Comma-separated document IDs')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
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
	.addOption(accessCodeOption())
	.requiredOption('--document-ids <csv>', 'Comma-separated document IDs')
	.requiredOption('--reason <reason>', 'Reason for declining')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
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
	.addCommand(searchCommand)
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
