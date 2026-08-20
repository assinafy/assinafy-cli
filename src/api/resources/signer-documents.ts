import { ValidationError } from '../errors.js';
import type {
	DocumentArtifactName,
	IDocumentDetailsResponse,
	IDocumentListItem,
	IDocumentListResponse,
	ISigner,
	ISignerDocumentListParams,
	ISignerSelf,
	ISignFieldEntry,
	IStatusResponse,
} from '../types.js';
import {
	requireDocumentArtifactName,
	requireSignerImageType,
	signerAccessConfig,
} from '../utils.js';
import { BaseResource } from './base.js';

/**
 * Signer-side endpoints. Every call here is authenticated by `signer-access-code`
 * (the one-time link emailed/whatsapped to the signer), not by the workspace
 * API key. Use this resource when building a custom signer UI.
 */
export class SignerDocumentsResource extends BaseResource {
	/** `GET /signers/{signer_id}/document?signer-access-code=…` */
	async getCurrent(signerId: string, signerAccessCode: string): Promise<IDocumentDetailsResponse> {
		const sid = this.requireId(signerId, 'Signer ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to fetch current signer document', () =>
			this.http.get(`/signers/${sid}/document`, signerAccessConfig(code)),
		);
	}

	/** `GET /signers/{signer_id}/documents?signer-access-code=…` */
	async list(
		signerId: string,
		signerAccessCode: string,
		params: ISignerDocumentListParams = {},
	): Promise<IDocumentListResponse> {
		const sid = this.requireId(signerId, 'Signer ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.callList<IDocumentListItem>('Failed to list signer documents', () =>
			this.http.get(
				`/signers/${sid}/documents`,
				signerAccessConfig(code, params as unknown as Record<string, unknown>),
			),
		);
	}

	/** `GET /signers/{signer_id}/documents/search?signer-access-code=…&search=…` */
	async search(
		signerId: string,
		search: string,
		signerAccessCode: string,
	): Promise<IDocumentListResponse> {
		const sid = this.requireId(signerId, 'Signer ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.callList<IDocumentListItem>('Failed to search signer documents', () =>
			this.http.get(`/signers/${sid}/documents/search`, signerAccessConfig(code, { search })),
		);
	}

	/** `GET /signers/{signer_id}/documents/{document_id}/download/{artifact}?signer-access-code=…` */
	async download(
		signerId: string,
		documentId: string,
		artifactName: DocumentArtifactName,
		signerAccessCode: string,
	): Promise<Buffer> {
		const sid = this.requireId(signerId, 'Signer ID');
		const did = this.requireId(documentId, 'Document ID');
		const artifact = requireDocumentArtifactName(artifactName);
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		// Sandbox currently serves this download even for an invalid access code.
		// Gate it through the protected profile route so SDK callers never rely on
		// that upstream authorization defect.
		const signer = await this.self(code);
		if (signer.id !== sid) {
			throw new ValidationError('Signer access code does not match the signer ID');
		}
		return this.callBinary('Failed to download signer document', () =>
			this.http.get<ArrayBuffer>(`/signers/${sid}/documents/${did}/download/${artifact}`, {
				...signerAccessConfig(code),
				responseType: 'arraybuffer',
			}),
		);
	}

	/** `PUT /signers/documents/sign-multiple?signer-access-code=…` */
	async signMultiple(documentIds: string[], signerAccessCode: string): Promise<unknown[]> {
		if (!Array.isArray(documentIds) || documentIds.length === 0) {
			throw new ValidationError('documentIds must be a non-empty array');
		}
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to sign multiple documents', () =>
			this.http.put(
				'/signers/documents/sign-multiple',
				{ document_ids: documentIds },
				signerAccessConfig(code),
			),
		);
	}

	/** `PUT /signers/documents/decline-multiple?signer-access-code=…` */
	async declineMultiple(
		documentIds: string[],
		declineReason: string,
		signerAccessCode: string,
	): Promise<unknown[]> {
		if (!Array.isArray(documentIds) || documentIds.length === 0) {
			throw new ValidationError('documentIds must be a non-empty array');
		}
		if (!declineReason) throw new ValidationError('declineReason is required');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to decline multiple documents', () =>
			this.http.put(
				'/signers/documents/decline-multiple',
				{ document_ids: documentIds, decline_reason: declineReason },
				signerAccessConfig(code),
			),
		);
	}

	/** `GET /signers/self?signer-access-code=…` — fetch the signer's own profile. */
	async self(signerAccessCode: string): Promise<ISignerSelf> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to fetch signer profile', () =>
			this.http.get('/signers/self', signerAccessConfig(code)),
		);
	}

	/**
	 * `PUT /signers/accept-terms?signer-access-code=…` — accept the platform
	 * terms as the signer.
	 *
	 * The access code travels as the `signer-access-code` query parameter, like
	 * every other signer-side endpoint (the spec under-documents this one, but
	 * the query-param convention is uniform across the Signing API).
	 */
	async acceptTerms(signerAccessCode: string): Promise<IStatusResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to accept terms', () =>
			this.http.put('/signers/accept-terms', undefined, signerAccessConfig(code)),
		);
	}

	/** `POST /verify` — verify the email OTP for a signer. */
	async verifyEmail(payload: {
		signerAccessCode: string;
		verificationCode: string;
	}): Promise<IStatusResponse> {
		const code = this.requireId(payload.signerAccessCode, 'signer-access-code');
		const otp = this.requireId(payload.verificationCode, 'verification-code');
		return this.call('Failed to verify signer email', () =>
			this.http.post('/verify', { 'verification-code': otp }, signerAccessConfig(code)),
		);
	}

	/**
	 * `PUT /documents/{documentId}/signers/confirm-data?signer-access-code=…`
	 *
	 * The documented body fields are `full_name`, `email` and `government_id`;
	 * `whatsapp_phone_number` / `has_accepted_terms` are also accepted for the
	 * WhatsApp confirmation flow.
	 */
	async confirmData(
		documentId: string,
		signerAccessCode: string,
		payload: {
			full_name?: string;
			email?: string;
			government_id?: string;
			whatsapp_phone_number?: string;
			has_accepted_terms?: boolean;
		},
	): Promise<ISigner> {
		const did = this.requireId(documentId, 'Document ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		// Build the JSON body explicitly (only defined fields). Don't route it
		// through cleanParams — that's a query-string helper and would rename a
		// body key like `per_page`.
		const body: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(payload)) {
			if (value !== undefined) body[key] = value;
		}
		return this.call('Failed to confirm signer data', () =>
			this.http.put(`/documents/${did}/signers/confirm-data`, body, signerAccessConfig(code)),
		);
	}

	/**
	 * `POST /signature?signer-access-code=…&type=…` — upload the signer's
	 * signature or initial image. `imageType` defaults to `signature`.
	 */
	async uploadSignature(
		signerAccessCode: string,
		image: Buffer,
		options: { imageType?: 'signature' | 'initial'; contentType?: string; reuse?: boolean } = {},
	): Promise<IStatusResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		const imageType = requireSignerImageType(options.imageType ?? 'signature');
		if (!Buffer.isBuffer(image) || image.byteLength === 0) {
			throw new ValidationError('image buffer is required');
		}
		return this.call('Failed to upload signer signature', () =>
			this.http.post(
				'/signature',
				image,
				signerAccessConfig(
					code,
					{
						type: imageType,
						// Documented query flag controlling the signer's is_signature_reusable state.
						reuse: options.reuse,
					},
					{ 'Content-Type': options.contentType ?? 'image/png' },
				),
			),
		);
	}

	/** `GET /signature/{type}?signer-access-code=…` — download the signer's signature/initial. */
	async downloadSignature(
		signerAccessCode: string,
		imageType: 'signature' | 'initial' = 'signature',
	): Promise<Buffer> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		const type = requireSignerImageType(imageType);
		return this.callBinary('Failed to download signer signature', () =>
			this.http.get<ArrayBuffer>(`/signature/${type}`, {
				...signerAccessConfig(code),
				responseType: 'arraybuffer',
			}),
		);
	}

	/** `GET /sign?signer-access-code=…` — fetch the assignment as the signer sees it. */
	async getAssignment(
		signerAccessCode: string,
		hasAcceptedTerms?: boolean,
	): Promise<IDocumentDetailsResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to fetch signer assignment', () =>
			this.http.get('/sign', signerAccessConfig(code, { has_accepted_terms: hasAcceptedTerms })),
		);
	}

	/** `POST /documents/{documentId}/assignments/{assignmentId}?signer-access-code=…` — sign. */
	async sign(
		documentId: string,
		assignmentId: string,
		signerAccessCode: string,
		entries: ISignFieldEntry[],
	): Promise<Record<string, unknown>> {
		const did = this.requireId(documentId, 'Document ID');
		const aid = this.requireId(assignmentId, 'Assignment ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		if (!Array.isArray(entries) || entries.length === 0) {
			throw new ValidationError('entries must be a non-empty array');
		}
		return this.call('Failed to sign document', () =>
			this.http.post(`/documents/${did}/assignments/${aid}`, entries, signerAccessConfig(code)),
		);
	}

	/**
	 * `PUT /documents/{documentId}/assignments/{assignmentId}/reject?signer-access-code=…`
	 * — signer-side decline using the access code from the signing link.
	 */
	async decline(
		documentId: string,
		assignmentId: string,
		signerAccessCode: string,
		declineReason: string,
	): Promise<unknown[]> {
		const did = this.requireId(documentId, 'Document ID');
		const aid = this.requireId(assignmentId, 'Assignment ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		if (!declineReason) throw new ValidationError('declineReason is required');
		return this.call('Failed to decline assignment', () =>
			this.http.put(
				`/documents/${did}/assignments/${aid}/reject`,
				{ decline_reason: declineReason },
				signerAccessConfig(code),
			),
		);
	}
}
