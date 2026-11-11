import type {
	ICreateEnvelopePayload,
	IDocumentEnvelope,
	IEnvelopeActivity,
	IEnvelopeCancellation,
	IEnvelopeDocumentPayload,
	IEnvelopeListParams,
	IEnvelopeResendResponse,
	IUpdateEnvelopePayload,
} from '../envelope-types.js';
import { ValidationError } from '../errors.js';
import type {
	DocumentArtifactName,
	IDocumentActivityListParams,
	IEmptyResult,
	IEstimateCostResponse,
	PaginatedResult,
} from '../types.js';
import {
	cleanParams,
	idempotencyHeaders,
	requireDocumentArtifactName,
	requireSort,
	validateCreditCeiling,
	validateDigitalCertificateMethod,
	validateSignerOptions,
} from '../utils.js';
import { BaseResource } from './base.js';

/** Workspace envelopes keep separate document assignments and charge one document allowance. */
export class EnvelopeResource extends BaseResource {
	async list(
		params: IEnvelopeListParams = {},
		accountId?: string,
	): Promise<PaginatedResult<IDocumentEnvelope>> {
		const id = this.accountId(accountId);
		if (params.status !== undefined && !['open', 'closed'].includes(params.status))
			throw new ValidationError('status must be open or closed');
		return this.callList('Failed to list envelopes', () =>
			this.http.get(`/accounts/${id}/envelopes`, { params: cleanParams({ ...params }) }),
		);
	}

	/** Creates assignments and sends invitations; persist the result before checking delivery. */
	async create(
		payload: ICreateEnvelopePayload,
		options: { accountId?: string; idempotencyKey?: string } = {},
	): Promise<IDocumentEnvelope> {
		const id = this.accountId(options.accountId);
		validateCreate(payload);
		const headers = idempotencyHeaders(options.idempotencyKey);
		return this.call('Failed to create envelope', () =>
			this.http.post(`/accounts/${id}/envelopes`, payload, { headers }),
		);
	}

	async estimateCost(
		payload: ICreateEnvelopePayload,
		accountId?: string,
	): Promise<IEstimateCostResponse> {
		const id = this.accountId(accountId);
		validateCreate(payload);
		return this.call('Failed to estimate envelope cost', () =>
			this.http.post(`/accounts/${id}/envelopes/estimate-cost`, payload),
		);
	}

	async get(envelopeId: string, accountId?: string): Promise<IDocumentEnvelope> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		return this.call('Failed to fetch envelope', () =>
			this.http.get(`/accounts/${id}/envelopes/${eid}`),
		);
	}

	/** Renames, changes the message (null clears), or reorders every current document. */
	async update(
		envelopeId: string,
		payload: IUpdateEnvelopePayload,
		accountId?: string,
	): Promise<IDocumentEnvelope> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		if (
			!payload ||
			!['name', 'message', 'document_ids'].some(
				(key) => payload[key as keyof IUpdateEnvelopePayload] !== undefined,
			)
		)
			throw new ValidationError('At least one envelope field is required');
		if (payload.name !== undefined) validateName(payload.name);
		validateMessage(payload.message);
		if (payload.document_ids !== undefined) validateIds(payload.document_ids, 'document_ids');
		return this.call('Failed to update envelope', () =>
			this.http.patch(`/accounts/${id}/envelopes/${eid}`, payload),
		);
	}

	/** Requires a closed envelope; its documents are retained by the server. */
	async delete(envelopeId: string, accountId?: string): Promise<IEmptyResult> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		return this.call('Failed to delete envelope', () =>
			this.http.delete(`/accounts/${id}/envelopes/${eid}`),
		);
	}

	async activities(
		envelopeId: string,
		params: IDocumentActivityListParams = {},
		accountId?: string,
	): Promise<PaginatedResult<IEnvelopeActivity>> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		requireSort(params.sort, ['id', '-id']);
		return this.callList('Failed to fetch envelope activities', () =>
			this.http.get(`/accounts/${id}/envelopes/${eid}/activities`, {
				params: cleanParams({ ...params }),
			}),
		);
	}

	/** ZIP containing the requested artifact of each eligible document. */
	async download(
		envelopeId: string,
		artifactName: DocumentArtifactName = 'certificated',
		accountId?: string,
	): Promise<Buffer> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		const artifact = requireDocumentArtifactName(artifactName);
		return this.callBinary('Failed to download envelope', () =>
			this.http.get<ArrayBuffer>(`/accounts/${id}/envelopes/${eid}/download/${artifact}`, {
				responseType: 'arraybuffer',
			}),
		);
	}

	/** Cancels only cancellable documents and notifies their recipients. */
	async cancel(envelopeId: string, accountId?: string): Promise<IEnvelopeCancellation[]> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		return this.call('Failed to cancel envelope', () =>
			this.http.put(`/accounts/${id}/envelopes/${eid}/cancel`),
		);
	}

	async resendNotification(
		envelopeId: string,
		signerId: string,
		accountId?: string,
	): Promise<IEnvelopeResendResponse> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		const sid = this.requireId(signerId, 'Signer ID');
		return this.call('Failed to resend envelope notification', () =>
			this.http.put(`/accounts/${id}/envelopes/${eid}/signers/${sid}/resend`),
		);
	}

	/** Adds a processed document for existing envelope signers and sends updated invitations. */
	async addDocument(
		envelopeId: string,
		payload: IEnvelopeDocumentPayload & { max_total_credits?: number },
		accountId?: string,
	): Promise<IDocumentEnvelope> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		validateDocument(payload);
		validateCreditCeiling(payload.max_total_credits);
		return this.call('Failed to add envelope document', () =>
			this.http.post(`/accounts/${id}/envelopes/${eid}/documents`, payload),
		);
	}

	/** Cancels an open document, notifies its recipients, and removes it from the envelope. */
	async removeDocument(
		envelopeId: string,
		documentId: string,
		accountId?: string,
	): Promise<IDocumentEnvelope> {
		const id = this.accountId(accountId);
		const eid = this.requireId(envelopeId, 'Envelope ID');
		const did = this.requireId(documentId, 'Document ID');
		return this.call('Failed to remove envelope document', () =>
			this.http.delete(`/accounts/${id}/envelopes/${eid}/documents/${did}`),
		);
	}
}

function validateName(value: string): void {
	if (typeof value !== 'string' || !value.trim() || [...value].length > 255 || value.includes('<'))
		throw new ValidationError('name must contain 1–255 characters without <');
}

function validateMessage(value: string | null | undefined): void {
	if (value != null && typeof value !== 'string')
		throw new ValidationError('message must be text or null');
}

function validateIds(values: string[], name: string): void {
	if (
		!Array.isArray(values) ||
		!values.length ||
		values.some((id) => typeof id !== 'string' || !id.trim()) ||
		new Set(values).size !== values.length
	)
		throw new ValidationError(`${name} must contain distinct nonblank IDs`);
}

function validateDocument(payload: IEnvelopeDocumentPayload): void {
	if (!payload || typeof payload.id !== 'string' || !payload.id.trim())
		throw new ValidationError('Document ID is required');
	validateIds(payload.signer_ids, 'signer_ids');
	if (payload.method !== undefined && !['virtual', 'collect'].includes(payload.method))
		throw new ValidationError('method must be virtual or collect');
	if (payload.method === 'collect' && (!Array.isArray(payload.entries) || !payload.entries.length))
		throw new ValidationError('entries are required for collect documents');
	if (
		payload.expires_at != null &&
		typeof payload.expires_at !== 'string' &&
		(typeof payload.expires_at !== 'number' || !Number.isFinite(payload.expires_at))
	)
		throw new ValidationError('expires_at must be a date string, Unix time or null');
	if (
		payload.copy_receiver_ids !== undefined &&
		(!Array.isArray(payload.copy_receiver_ids) ||
			payload.copy_receiver_ids.some((id) => typeof id !== 'string' || !id.trim()))
	)
		throw new ValidationError('copy_receiver_ids must contain nonblank IDs');
}

function validateCreate(payload: ICreateEnvelopePayload): void {
	if (!payload) throw new ValidationError('Envelope payload is required');
	validateName(payload.name);
	validateMessage(payload.message);
	validateCreditCeiling(payload.max_total_credits);
	if (
		!Array.isArray(payload.signers) ||
		!payload.signers.length ||
		payload.signers.length > 20 ||
		payload.signers.some((s) => !s || typeof s !== 'object')
	)
		throw new ValidationError('signers must contain 1–20 signers');
	validateIds(
		payload.signers.map((s) => s.id),
		'signers',
	);
	for (const signer of payload.signers) {
		if ('step' in signer) throw new ValidationError('Envelope signers do not accept step');
		validateSignerOptions(signer);
	}
	if (
		!Array.isArray(payload.documents) ||
		!payload.documents.length ||
		payload.documents.length > 20
	)
		throw new ValidationError('documents must contain 1–20 documents');
	for (const document of payload.documents) {
		validateDocument(document);
		const signers = document.signer_ids.map((id) => payload.signers.find((s) => s.id === id));
		if (signers.some((s) => !s))
			throw new ValidationError('Every document signer must be listed in signers');
		const assigned = signers.filter((s) => s !== undefined);
		validateDigitalCertificateMethod(document.method ?? 'virtual', assigned);
		if (assigned.length > 1 && assigned.some((s) => s.verification_method === 'DigitalCertificate'))
			throw new ValidationError(
				'A DigitalCertificate signer must be alone on each envelope document',
			);
	}
	validateIds(
		payload.documents.map((d) => d.id),
		'documents',
	);
	if (payload.signers.some((s) => !payload.documents.some((d) => d.signer_ids.includes(s.id))))
		throw new ValidationError('Every signer must belong to at least one document');
}
