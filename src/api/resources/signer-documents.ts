import { ValidationError } from '../errors.js';
import type {
	DocumentArtifactName,
	IAccountTheme,
	ICertificateCompleteResponse,
	ICertificateStartResponse,
	ICertifiedCopyResponse,
	IDocumentListItem,
	IDocumentListResponse,
	IEmptyResult,
	IIdentityVerificationSession,
	IIdentityVerificationState,
	ISigner,
	ISignerDocumentDetailsResponse,
	ISignerDocumentListParams,
	ISignerSelf,
	ISignerTermsAcceptance,
	ISignFieldEntry,
	ISigningDocument,
	IStartIdentityVerificationPayload,
	IStatusResponse,
	IVerifySignerCodePayload,
} from '../types.js';
import {
	cleanParams,
	publicRequestConfig,
	requireDocumentArtifactName,
	requireSignerImageType,
	signerAccessConfig,
} from '../utils.js';
import { BaseResource } from './base.js';

/**
 * Signer-side endpoints use `signer-access-code` from the private signing link.
 * Explicit `listAsOwner`/`searchAsOwner` use workspace credentials, and artifact
 * downloads strip owner headers; the current API requires a signer code for originals.
 */
export class SignerDocumentsResource extends BaseResource {
	/** `GET /signers/{signer_id}/document?signer-access-code=…` */
	async getCurrent(
		signerId: string,
		signerAccessCode: string,
		params: { expand?: 'envelope' } = {},
	): Promise<ISigningDocument> {
		const sid = this.requireId(signerId, 'Signer ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to fetch current signer document', () =>
			this.http.get(`/signers/${sid}/document`, signerAccessConfig(code, params)),
		);
	}

	/** `GET /signers/{signer_id}/documents?signer-access-code=…` */
	async list(
		signerId: string,
		signerAccessCode: string,
		params: ISignerDocumentListParams = {},
	): Promise<IDocumentListResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.listDocuments(signerId, signerAccessConfig(code, { ...params }));
	}

	/**
	 * `GET /signers/{signer_id}/documents` with the client's owner credentials
	 * (API key or token) instead of a signer access code. The signer must belong
	 * to that workspace.
	 */
	async listAsOwner(
		signerId: string,
		params: ISignerDocumentListParams = {},
	): Promise<IDocumentListResponse> {
		return this.listDocuments(signerId, { params: cleanParams({ ...params }) });
	}

	/** `GET /signers/{signer_id}/documents/search?search=…&signer-access-code=…` */
	async search(
		signerId: string,
		search: string,
		signerAccessCode: string,
		params: Omit<ISignerDocumentListParams, 'search'> = {},
	): Promise<IDocumentListResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.searchDocuments(signerId, signerAccessConfig(code, { ...params, search }));
	}

	/**
	 * `GET /signers/{signer_id}/documents/search?search=…` with the client's owner
	 * credentials instead of a signer access code. The signer must belong to that
	 * workspace.
	 */
	async searchAsOwner(
		signerId: string,
		search: string,
		params: Omit<ISignerDocumentListParams, 'search'> = {},
	): Promise<IDocumentListResponse> {
		return this.searchDocuments(signerId, { params: cleanParams({ ...params, search }) });
	}

	private listDocuments(signerId: string, config: Parameters<typeof this.http.get>[1]) {
		const sid = this.requireId(signerId, 'Signer ID');
		return this.callList<IDocumentListItem>('Failed to list signer documents', () =>
			this.http.get(`/signers/${sid}/documents`, config),
		);
	}

	private searchDocuments(signerId: string, config: Parameters<typeof this.http.get>[1]) {
		const sid = this.requireId(signerId, 'Signer ID');
		return this.callList<IDocumentListItem>('Failed to search signer documents', () =>
			this.http.get(`/signers/${sid}/documents/search`, config),
		);
	}

	/**
	 * `GET /signers/{signer_id}/documents/{document_id}/download/{artifact}`.
	 * The current API permits only originals with a signer code. Other forms are
	 * retained for compatibility; use downloadCertifiedCopy for completed PDFs.
	 */
	async download(
		signerId: string,
		documentId: string,
		artifactName: DocumentArtifactName,
		signerAccessCode?: string,
	): Promise<Buffer> {
		const sid = this.requireId(signerId, 'Signer ID');
		const did = this.requireId(documentId, 'Document ID');
		const artifact = requireDocumentArtifactName(artifactName);
		let config = publicRequestConfig();
		if (signerAccessCode !== undefined) {
			const code = this.requireId(signerAccessCode, 'signer-access-code');
			const signer = await this.self(code);
			if (signer.id !== sid) {
				throw new ValidationError('Signer access code does not match the signer ID');
			}
			config = signerAccessConfig(code);
		}
		return this.callBinary('Failed to download signer document', () =>
			this.http.get<ArrayBuffer>(`/signers/${sid}/documents/${did}/download/${artifact}`, {
				...config,
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
		validateDeclineReason(declineReason);
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

	/** `GET /signers/identity-verification` — session status, capture URL and restart eligibility. */
	async getIdentityVerification(signerAccessCode: string): Promise<IIdentityVerificationState> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to fetch identity verification', () =>
			this.http.get('/signers/identity-verification', signerAccessConfig(code)),
		);
	}

	/** `POST /signers/identity-verification` — open a hosted session after the signer's explicit consent. */
	async startIdentityVerification(
		signerAccessCode: string,
		payload: IStartIdentityVerificationPayload,
	): Promise<IIdentityVerificationSession> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		if (payload?.consent !== true) {
			throw new ValidationError('Explicit biometric-processing consent is required');
		}
		return this.call('Failed to start identity verification', () =>
			this.http.post('/signers/identity-verification', { consent: true }, signerAccessConfig(code)),
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
	async acceptTerms(signerAccessCode: string): Promise<ISignerTermsAcceptance | IStatusResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to accept terms', () =>
			this.http.put('/signers/accept-terms', undefined, signerAccessConfig(code)),
		);
	}

	/** `POST /verify` — verify an email or WhatsApp OTP for a signer. */
	async verifyCode(payload: IVerifySignerCodePayload): Promise<IEmptyResult | IStatusResponse> {
		const code = this.requireId(payload.signerAccessCode, 'signer-access-code');
		const otp = this.requireId(payload.verificationCode, 'verification-code');
		return this.call('Failed to verify signer code', () =>
			this.http.post('/verify', { 'verification-code': otp }, signerAccessConfig(code)),
		);
	}

	/** Compatibility alias for {@link verifyCode}; accepts email and WhatsApp OTPs. */
	async verifyEmail(payload: IVerifySignerCodePayload): Promise<IEmptyResult | IStatusResponse> {
		return this.verifyCode(payload);
	}

	/**
	 * `POST /signers/certificate/start` — start an ICP-Brasil A1/A3 signature.
	 * Returns `{ token }` for the signer's Web PKI client. This production route
	 * is used by Assinafy's signing frontend but is absent from OpenAPI paths.
	 */
	async startCertificate(
		signerAccessCode: string,
		documentId?: string,
	): Promise<ICertificateStartResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to start certificate signature', () =>
			this.http.post(
				'/signers/certificate/start',
				{
					'signer-access-code': code,
					...(documentId === undefined
						? {}
						: { document_id: this.requireId(documentId, 'Document ID') }),
				},
				signerAccessConfig(code),
			),
		);
	}

	/**
	 * `POST /signers/certificate/complete` — finish an ICP-Brasil A1/A3 signature.
	 * Pass the same token returned by {@link startCertificate}, after Web PKI
	 * successfully signs it. Returns `{ signerName }`; private keys stay local.
	 * This production route is absent from OpenAPI paths.
	 */
	async completeCertificate(
		signerAccessCode: string,
		token: string,
		documentId?: string,
	): Promise<ICertificateCompleteResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		if (typeof token !== 'string' || !token.trim()) {
			throw new ValidationError('Certificate token is required');
		}
		return this.call('Failed to complete certificate signature', () =>
			this.http.post(
				'/signers/certificate/complete',
				{
					'signer-access-code': code,
					token,
					...(documentId === undefined
						? {}
						: { document_id: this.requireId(documentId, 'Document ID') }),
				},
				signerAccessConfig(code),
			),
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
	): Promise<ISigner | IEmptyResult> {
		const did = this.requireId(documentId, 'Document ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		// Build the JSON body explicitly (only defined fields). Don't route it
		// through cleanParams — that's a query-string helper and would rename a
		// body key like `per_page`.
		const body: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(payload)) {
			if (value !== undefined) body[key] = value;
		}
		await this.requireDocumentAccess(did, code);
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
	): Promise<IEmptyResult | IStatusResponse> {
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
		params: { expand?: 'envelope'; document_id?: string } = {},
	): Promise<ISigningDocument> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		if (params.document_id !== undefined) this.requireId(params.document_id, 'Document ID');
		return this.call('Failed to fetch signer assignment', () =>
			this.http.get(
				'/sign',
				signerAccessConfig(code, { ...params, has_accepted_terms: hasAcceptedTerms }),
			),
		);
	}

	/**
	 * `POST /documents/{documentId}/assignments/{assignmentId}?signer-access-code=…` — sign.
	 * Virtual assignments accept `[]` after the signer confirms their data.
	 */
	async sign(
		documentId: string,
		assignmentId: string,
		signerAccessCode: string,
		entries: ISignFieldEntry[],
	): Promise<Record<string, unknown>> {
		const did = this.requireId(documentId, 'Document ID');
		const aid = this.requireId(assignmentId, 'Assignment ID');
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		if (!Array.isArray(entries)) {
			throw new ValidationError('entries must be an array');
		}
		const document = await this.requireDocumentAccess(did, code, aid);
		if (document.assignment?.method === 'collect' && entries.length === 0) {
			throw new ValidationError('entries must be non-empty for collect assignments');
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
		validateDeclineReason(declineReason);
		await this.requireDocumentAccess(did, code, aid);
		return this.call('Failed to decline assignment', () =>
			this.http.put(
				`/documents/${did}/assignments/${aid}/reject`,
				{ decline_reason: declineReason },
				signerAccessConfig(code),
			),
		);
	}

	private async requireDocumentAccess(
		documentId: string,
		signerAccessCode: string,
		assignmentId?: string,
	): Promise<ISignerDocumentDetailsResponse | ISigningDocument> {
		// /sign is gated on confirmation for certificate signers; document reads are not.
		const document =
			assignmentId === undefined
				? await this.call<ISignerDocumentDetailsResponse>('Failed to fetch signer document', () =>
						this.http.get(`/documents/${documentId}`, signerAccessConfig(signerAccessCode)),
					)
				: await this.getAssignment(signerAccessCode, undefined, { document_id: documentId });
		if (
			document.id !== documentId ||
			(assignmentId !== undefined && document.assignment?.id !== assignmentId)
		) {
			throw new ValidationError('Signer access code does not match the document or assignment');
		}
		return document;
	}

	async getTheme(signerAccessCode: string): Promise<IAccountTheme> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.call('Failed to fetch signing theme', () =>
			this.http.get('/sign/theme', signerAccessConfig(code)),
		);
	}

	async downloadLogo(signerAccessCode: string): Promise<Buffer> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		return this.callBinary('Failed to download signing logo', () =>
			this.http.get<ArrayBuffer>('/sign/logo', {
				...signerAccessConfig(code),
				responseType: 'arraybuffer',
			}),
		);
	}

	/** Sends a time-limited download link to the original signing contact. */
	async resendCertifiedCopy(
		signerAccessCode: string,
		documentId?: string,
	): Promise<ICertifiedCopyResponse> {
		const code = this.requireId(signerAccessCode, 'signer-access-code');
		const body =
			documentId === undefined
				? undefined
				: { document_id: this.requireId(documentId, 'Document ID') };
		return this.call('Failed to send certified copy', () =>
			this.http.post('/sign/certified-copy', body, signerAccessConfig(code)),
		);
	}

	/** Expired tokens return an ApiError (302); redirects remain disabled. */
	async downloadCertifiedCopy(
		token: string,
		artifact: 'certificated' | 'pades' = 'certificated',
	): Promise<Buffer> {
		const value = this.requireId(token, 'Download token');
		if (!['certificated', 'pades'].includes(artifact))
			throw new ValidationError('artifact must be certificated or pades');
		const config = { ...publicRequestConfig(), responseType: 'arraybuffer' as const };
		return this.callBinary('Failed to download certified copy', () =>
			artifact === 'pades'
				? this.http.get<ArrayBuffer>(`/signers/downloads/${value}/pades`, config)
				: this.http.get<ArrayBuffer>(`/signers/downloads/${value}`, config),
		);
	}

	async resendDownloadLink(token: string): Promise<ICertifiedCopyResponse> {
		const value = this.requireId(token, 'Download token');
		return this.call('Failed to resend download link', () =>
			this.http.post(`/signers/downloads/${value}/resend`, undefined, publicRequestConfig()),
		);
	}
}

function validateDeclineReason(value: string): void {
	if (typeof value !== 'string' || !value.trim()) {
		throw new ValidationError('declineReason is required');
	}
	if ([...value].length > 2000) {
		throw new ValidationError('declineReason must contain at most 2000 characters');
	}
}
