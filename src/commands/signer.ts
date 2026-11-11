import { Command, Option } from '@commander-js/extra-typings';
import type { ISignFieldEntry } from '../api';
import { requireDocumentArtifactName, requireSignerImageType } from '../api/utils';
import { CliError } from '../lib/errors';
import { defaultArtifactFilename, readBinary, saveDownload } from '../lib/files';
import { parseJsonArray, splitList } from '../lib/json';
import { addDownloadOptions, addListOptions } from '../lib/options';
import { printData, printPaginatedData, printSuccess } from '../lib/output';
import { listParams } from '../lib/pagination';
import { runWithClient, runWithPublicClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const accessCodeOption = () =>
	new Option('--access-code <code>', 'Signer access code')
		.env('ASSINAFY_SIGNER_ACCESS_CODE')
		.makeOptionMandatory();

/** Signer document listing accepts the access code or, when omitted, owner credentials. */
const optionalAccessCodeOption = () =>
	new Option('--access-code <code>', 'Signer access code (omit to use your API key or token)').env(
		'ASSINAFY_SIGNER_ACCESS_CODE',
	);

const runSignerOrOwner = (accessCode: string | undefined) =>
	accessCode === undefined ? runWithClient : runWithPublicClient;

const documentCommand = new Command('document')
	.description("Fetch the signer's current document")
	.argument('<signerId>', 'Signer ID')
	.addOption(accessCodeOption())
	.addOption(
		new Option('--expand <relation>', 'Include the envelope').choices(['envelope'] as const),
	)
	.action(async (signerId, opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const doc = await withSpinner('Fetching document', config, () =>
				client.signerDocuments.getCurrent(signerId, opts.accessCode, { expand: opts.expand }),
			);
			printData(doc, config, (d) => renderKeyValue({ id: d.id, name: d.name, status: d.status }));
		});
	});

const documentsCommand = addListOptions(
	new Command('documents')
		.description("List the signer's documents")
		.option('--envelope <id>', 'Filter by envelope ID')
		.argument('<signerId>', 'Signer ID')
		.addOption(optionalAccessCodeOption()),
).action(async (signerId, opts, command) => {
	await runSignerOrOwner(opts.accessCode)(command, async ({ client, config }) => {
		const result = await withSpinner('Fetching documents', config, () =>
			opts.accessCode === undefined
				? client.signerDocuments.listAsOwner(signerId, {
						...listParams(opts),
						envelope_id: opts.envelope,
					})
				: client.signerDocuments.list(signerId, opts.accessCode, {
						...listParams(opts),
						envelope_id: opts.envelope,
					}),
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
	.option('--envelope <id>', 'Filter by envelope ID')
	.argument('<signerId>', 'Signer ID')
	.argument('<query>', 'Search text')
	.addOption(optionalAccessCodeOption())
	.action(async (signerId, query, opts, command) => {
		await runSignerOrOwner(opts.accessCode)(command, async ({ client, config }) => {
			const result = await withSpinner('Searching documents', config, () =>
				opts.accessCode === undefined
					? client.signerDocuments.searchAsOwner(signerId, query, { envelope_id: opts.envelope })
					: client.signerDocuments.search(signerId, query, opts.accessCode, {
							envelope_id: opts.envelope,
						}),
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

const downloadCommand = addDownloadOptions(
	new Command('download')
		.description('Download the original with a signer code; use download-copy for certified files')
		.argument('<signerId>', 'Signer ID')
		.argument('<documentId>', 'Document ID')
		.argument('<artifact>', 'original | certificated | certificate-page | pades | bundle')
		.addOption(
			new Option('--access-code <code>', 'Signer access code (required by the current API)').env(
				'ASSINAFY_SIGNER_ACCESS_CODE',
			),
		),
).action(async (signerId, documentId, artifact, opts, command) => {
	await runWithPublicClient(command, async ({ client, config }) => {
		const artifactName = requireDocumentArtifactName(artifact);
		await saveDownload(config, {
			message: 'Downloading',
			download: () =>
				client.signerDocuments.download(signerId, documentId, artifactName, opts.accessCode),
			output: opts.output,
			defaultName: defaultArtifactFilename(documentId, artifactName),
			force: opts.force,
		});
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

const identityStatusCommand = new Command('identity-status')
	.description('Fetch biometric verification status and the private capture URL')
	.addOption(accessCodeOption())
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const result = await withSpinner('Fetching identity verification', config, () =>
				client.signerDocuments.getIdentityVerification(opts.accessCode),
			);
			printData(result, config);
		});
	});

const identityStartCommand = new Command('identity-start')
	.description('Open a biometric verification session with the signer’s explicit consent')
	.addOption(accessCodeOption())
	.option('--consent', 'The signer explicitly consents to biometric processing')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			if (!opts.consent) throw new CliError('The signer’s explicit --consent is required.');
			const result = await withSpinner('Starting identity verification', config, () =>
				client.signerDocuments.startIdentityVerification(opts.accessCode, { consent: true }),
			);
			printData(result, config);
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

const verifyCodeCommand = new Command('verify-code')
	.alias('verify-email')
	.description('Verify an email or WhatsApp OTP for a signer')
	.addOption(accessCodeOption())
	.addOption(
		new Option('--code <otp>', 'Verification code')
			.env('ASSINAFY_VERIFICATION_CODE')
			.makeOptionMandatory(),
	)
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const result = await withSpinner('Verifying', config, () =>
				client.signerDocuments.verifyCode({
					signerAccessCode: opts.accessCode,
					verificationCode: opts.code,
				}),
			);
			printSuccess('Verification code accepted', config);
			printData(result, config);
		});
	});

const certificateStartCommand = new Command('certificate-start')
	.option('--document-id <id>', 'Select a document of the same envelope')
	.description('Start an ICP-Brasil A1/A3 signature and return the Web PKI token')
	.addOption(accessCodeOption())
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const result = await withSpinner('Starting certificate signature', config, () =>
				client.signerDocuments.startCertificate(opts.accessCode, opts.documentId),
			);
			printData(result, config);
		});
	});

const certificateCompleteCommand = new Command('certificate-complete')
	.option('--document-id <id>', 'Select a document of the same envelope')
	.description('Complete an ICP-Brasil A1/A3 signature after Web PKI has signed the token')
	.addOption(accessCodeOption())
	.addOption(
		new Option('--certificate-token <token>', 'Operation token returned by certificate-start')
			.env('ASSINAFY_CERTIFICATE_TOKEN')
			.makeOptionMandatory(),
	)
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const result = await withSpinner('Completing certificate signature', config, () =>
				client.signerDocuments.completeCertificate(
					opts.accessCode,
					opts.certificateToken,
					opts.documentId,
				),
			);
			printSuccess('Certificate signature completed', config);
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

const downloadSignatureCommand = addDownloadOptions(
	new Command('download-signature')
		.description("Download the signer's signature or initial image")
		.addOption(accessCodeOption())
		.option('--type <type>', 'signature or initial', 'signature'),
).action(async (opts, command) => {
	await runWithPublicClient(command, async ({ client, config }) => {
		const imageType = requireSignerImageType(opts.type);
		await saveDownload(config, {
			message: 'Downloading signature',
			download: () => client.signerDocuments.downloadSignature(opts.accessCode, imageType),
			output: opts.output,
			defaultName: `signer-${imageType}.png`,
			force: opts.force,
		});
	});
});

const assignmentCommand = new Command('assignment')
	.description('Fetch the assignment as the signer sees it')
	.option('--document-id <id>', 'Select another document of the same envelope')
	.addOption(accessCodeOption())
	.option('--accept-terms', 'Pass has_accepted_terms=true')
	.addOption(
		new Option('--expand <relation>', 'Include the envelope').choices(['envelope'] as const),
	)
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			const result = await withSpinner('Fetching assignment', config, () =>
				client.signerDocuments.getAssignment(opts.accessCode, opts.acceptTerms ? true : undefined, {
					expand: opts.expand,
					document_id: opts.documentId,
				}),
			);
			printData(result, config);
		});
	});

const signCommand = new Command('sign')
	.description('Sign a document as the signer')
	.argument('<documentId>', 'Document ID')
	.argument('<assignmentId>', 'Assignment ID')
	.addOption(accessCodeOption())
	.requiredOption(
		'--entries <json>',
		'JSON array of { itemId, fieldId, pageId, value } entries; use [] for virtual assignments',
	)
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

const themeCommand = new Command('theme')
	.description('Read the signing workspace brand')
	.addOption(accessCodeOption())
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			printData(await client.signerDocuments.getTheme(opts.accessCode), config);
		});
	});
const logoCommand = addDownloadOptions(
	new Command('logo')
		.description('Download the signing workspace logo')
		.addOption(accessCodeOption()),
).action(async (opts, command) => {
	await runWithPublicClient(command, async ({ client, config }) => {
		await saveDownload(config, {
			message: 'Downloading logo',
			download: () => client.signerDocuments.downloadLogo(opts.accessCode),
			output: opts.output,
			defaultName: 'signing-logo',
			force: opts.force,
		});
	});
});
const certifiedCopyCommand = new Command('certified-copy')
	.description('Send a new certified-copy link to the original signing contact')
	.addOption(accessCodeOption())
	.option('--document-id <id>', 'Another document in the same envelope')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			printData(
				await client.signerDocuments.resendCertifiedCopy(opts.accessCode, opts.documentId),
				config,
			);
		});
	});
const downloadTokenOption = () =>
	new Option('--download-token <token>', 'Private certified-copy link token')
		.env('ASSINAFY_DOWNLOAD_TOKEN')
		.makeOptionMandatory();
const downloadCopyCommand = addDownloadOptions(
	new Command('download-copy')
		.description('Download a PDF using a certified-copy link token')
		.addOption(downloadTokenOption()),
)
	.addOption(
		new Option('--artifact <name>', 'PDF artifact')
			.choices(['certificated', 'pades'] as const)
			.default('certificated'),
	)
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			await saveDownload(config, {
				message: 'Downloading certified copy',
				download: () =>
					client.signerDocuments.downloadCertifiedCopy(opts.downloadToken, opts.artifact),
				output: opts.output,
				defaultName: `${opts.artifact}.pdf`,
				force: opts.force,
			});
		});
	});
const resendCopyCommand = new Command('resend-download-link')
	.description('Send a new link using an expired download token')
	.addOption(downloadTokenOption())
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			printData(await client.signerDocuments.resendDownloadLink(opts.downloadToken), config);
		});
	});

export const signerCommand = new Command('signer')
	.addCommand(themeCommand)
	.addCommand(logoCommand)
	.addCommand(certifiedCopyCommand)
	.addCommand(downloadCopyCommand)
	.addCommand(resendCopyCommand)
	.description('Signer-side flows and public artifact downloads')
	.addCommand(documentCommand)
	.addCommand(documentsCommand)
	.addCommand(searchCommand)
	.addCommand(downloadCommand)
	.addCommand(selfCommand)
	.addCommand(identityStatusCommand)
	.addCommand(identityStartCommand)
	.addCommand(acceptTermsCommand)
	.addCommand(verifyCodeCommand)
	.addCommand(certificateStartCommand)
	.addCommand(certificateCompleteCommand)
	.addCommand(confirmDataCommand)
	.addCommand(uploadSignatureCommand)
	.addCommand(downloadSignatureCommand)
	.addCommand(assignmentCommand)
	.addCommand(signCommand)
	.addCommand(declineCommand)
	.addCommand(signMultipleCommand)
	.addCommand(declineMultipleCommand);
