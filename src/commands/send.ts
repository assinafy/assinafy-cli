import { Command } from '@commander-js/extra-typings';
import type { IUploadAndRequestSignaturesSigner } from '../api';
import { requireAccountId } from '../lib/client';
import { CliError } from '../lib/errors';
import { collect, parseJsonArray, parseJsonObject, splitList } from '../lib/json';
import { printData, printSuccess } from '../lib/output';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue } from '../lib/table';

/**
 * Parse a `--signer` spec into a signer object. Accepted forms:
 *   "Ana Lima <ana@example.com>"      → name + email
 *   "Ana Lima <+5548999990000>"       → name + WhatsApp number
 *   "ana@example.com"                 → email only (name defaults to the email)
 */
export function parseSignerSpec(spec: string): IUploadAndRequestSignaturesSigner {
	const match = spec.match(/^\s*(.*?)\s*<\s*([^>]*)\s*>\s*$/);
	const name = match?.[1]?.trim();
	const contact = (match?.[2] ?? spec).trim();
	if (!contact) {
		throw new CliError(`Invalid --signer "${spec}". Use "Name <email-or-phone>".`);
	}
	const isEmail = contact.includes('@');
	const signer: IUploadAndRequestSignaturesSigner = { name: name || contact };
	if (isEmail) signer.email = contact;
	else signer.whatsapp_phone_number = contact;
	return signer;
}

export function resolveSigners(
	signerSpecs: string[],
	signersJson?: string,
): IUploadAndRequestSignaturesSigner[] {
	if (signersJson) {
		return parseJsonArray(signersJson, '--signers') as IUploadAndRequestSignaturesSigner[];
	}
	if (signerSpecs.length === 0) {
		throw new CliError('At least one --signer "Name <email>" (or --signers <json>) is required.');
	}
	return signerSpecs.map(parseSignerSpec);
}

export const sendCommand = new Command('send')
	.description('Upload a PDF, create signers, and request signatures in one step')
	.argument('<file>', 'Path to the PDF file')
	.option('--signer <spec>', 'Signer as "Name <email-or-phone>" (repeatable)', collect, [])
	.option('--signers <json>', 'JSON array of signer objects (overrides --signer)')
	.option('--message <message>', 'Message shown to signers')
	.option('--expires-at <iso8601>', 'Expiration timestamp')
	.option('--copy-receivers <csv>', 'Comma-separated emails to CC')
	.option('--metadata <json>', 'JSON object of metadata to attach to the document')
	.option('--no-wait', 'Do not wait for the document to finish processing')
	.action(async (file, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const signers = resolveSigners(opts.signer, opts.signers);

			const params: Parameters<typeof client.uploadAndRequestSignatures>[0] = {
				source: { filePath: file },
				signers,
				accountId,
				waitForReady: opts.wait,
			};
			if (opts.message) params.message = opts.message;
			if (opts.expiresAt) params.expiresAt = opts.expiresAt;
			const cc = splitList(opts.copyReceivers);
			if (cc) params.copyReceivers = cc;
			const metadata = parseJsonObject(opts.metadata, '--metadata');
			if (metadata) params.metadata = metadata;

			const result = await withSpinner('Uploading and requesting signatures', config, () =>
				client.uploadAndRequestSignatures(params),
			);

			printSuccess(
				`Document ${result.document.id} sent to ${result.signer_ids.length} signer(s)`,
				config,
			);
			printData(result, config, (r) =>
				renderKeyValue({
					document_id: r.document.id,
					assignment_id: r.assignment.id,
					signers: r.signer_ids,
					status: r.document.status,
				}),
			);
		});
	});
