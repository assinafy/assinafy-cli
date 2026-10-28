import type {
	IContract,
	IContractAmendment,
	IContractListParams,
	IRenewContractPayload,
	ISetContractPayload,
	ITerminateContractPayload,
} from '../contract-types.js';
import { ValidationError } from '../errors.js';
import type { PaginatedResult } from '../types.js';
import { cleanParams, requireIso8601, requireSort } from '../utils.js';
import { BaseResource } from './base.js';

const statuses = ['draft', 'active', 'expired', 'terminated'];

/** Workspace contract terms and signed amendment families; documents are uploaded separately. */
export class ContractResource extends BaseResource {
	/** List terms, optionally embedding documents; supports pagination and comma-separated statuses. */
	async list(
		params: IContractListParams = {},
		accountId?: string,
	): Promise<PaginatedResult<IContract>> {
		const id = this.accountId(accountId);
		const status = Array.isArray(params.status) ? params.status.join(',') : params.status;
		if (
			status !== undefined &&
			(typeof status !== 'string' || status.split(',').some((s) => !statuses.includes(s)))
		) {
			throw new ValidationError('status must contain draft, active, expired or terminated');
		}
		for (const field of ['end_date_from', 'end_date_to'] as const) {
			if (params[field] !== undefined) requireDate(params[field], field, 0);
		}
		if (params.ending_within_days !== undefined)
			requireInteger(params.ending_within_days, 'ending_within_days', 0, 3650);
		requireSort(params.sort, ['end_date', '-end_date', 'updated_at', '-updated_at']);
		if (params.expand !== undefined && params.expand !== 'document')
			throw new ValidationError('expand must be document');
		return this.callList('Failed to list contracts', () =>
			this.http.get(`/accounts/${id}/contracts`, { params: cleanParams({ ...params, status }) }),
		);
	}

	/** Read a document's own terms or its amendment link. Missing terms return ApiError 404. */
	async get(documentId: string, accountId?: string): Promise<IContract | IContractAmendment> {
		const id = this.accountId(accountId);
		const did = this.requireId(documentId, 'Document ID');
		return this.call('Failed to get contract', () =>
			this.http.get(`/accounts/${id}/documents/${did}/contract`),
		);
	}

	/** Set only supplied terms, or link/update/unlink a pending amendment. Preserve null clearing. */
	async set(
		documentId: string,
		payload: ISetContractPayload,
		accountId?: string,
	): Promise<IContract | IContractAmendment> {
		const id = this.accountId(accountId);
		const did = this.requireId(documentId, 'Document ID');
		requireBody(payload, true);
		validateTerms(payload);
		return this.call('Failed to set contract terms', () =>
			this.http.put(`/accounts/${id}/documents/${did}/contract`, payload),
		);
	}

	/** Read the root contract and its amendments from any document in that family. */
	async related(documentId: string, accountId?: string): Promise<IContract> {
		const id = this.accountId(accountId);
		const did = this.requireId(documentId, 'Document ID');
		return this.call('Failed to get related contracts', () =>
			this.http.get(`/accounts/${id}/documents/${did}/contract/related`),
		);
	}

	/** Advance from the supplied current term or to a later end date. No automatic retry. */
	async renew(
		documentId: string,
		payload: IRenewContractPayload,
		accountId?: string,
	): Promise<IContract> {
		const id = this.accountId(accountId);
		const did = this.requireId(documentId, 'Document ID');
		requireBody(payload, true);
		if (payload.term === undefined && !payload.end_date)
			throw new ValidationError('Renewal requires term or end_date');
		if (payload.term !== undefined)
			requireInteger(payload.term, 'term', 1, Number.MAX_SAFE_INTEGER);
		validateTerms({ ...payload, end_date: payload.end_date === '' ? null : payload.end_date });
		return this.call('Failed to renew contract', () =>
			this.http.post(`/accounts/${id}/documents/${did}/contract/renew`, payload),
		);
	}

	/** Terminate existing terms; an optional reason is recorded in document activities. */
	async terminate(
		documentId: string,
		payload: ITerminateContractPayload = {},
		accountId?: string,
	): Promise<IContract> {
		const id = this.accountId(accountId);
		const did = this.requireId(documentId, 'Document ID');
		requireBody(payload);
		if (
			payload.reason != null &&
			(typeof payload.reason !== 'string' || [...payload.reason].length > 500)
		)
			throw new ValidationError('reason must be text of at most 500 characters');
		if (payload.updated_at != null) requireIso8601(payload.updated_at, 'updated_at');
		return this.call('Failed to terminate contract', () =>
			this.http.post(`/accounts/${id}/documents/${did}/contract/terminate`, payload),
		);
	}
}

function requireBody(value: unknown, nonempty = false): void {
	if (
		!value ||
		typeof value !== 'object' ||
		Array.isArray(value) ||
		(Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
	) {
		throw new ValidationError('Contract body must be a JSON object');
	}
	if (nonempty && !Object.values(value).some((v) => v !== undefined))
		throw new ValidationError('At least one contract attribute is required');
}

function requireDate(value: unknown, field: string, minYear = 1000): void {
	if (
		typeof value !== 'string' ||
		!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
		Number(value.slice(0, 4)) < minYear
	)
		throw new ValidationError(`${field} must be a YYYY-MM-DD date from year ${minYear}`);
	requireIso8601(`${value}T00:00:00Z`, field);
}

function requireInteger(value: unknown, field: string, min: number, max: number): void {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
		throw new ValidationError(`${field} must be an integer from ${min} to ${max}`);
}

function validateTerms(payload: ISetContractPayload): void {
	for (const field of ['start_date', 'end_date'] as const)
		if (payload[field] != null) requireDate(payload[field], field);
	if (payload.start_date && payload.end_date && payload.end_date < payload.start_date)
		throw new ValidationError('end_date must not precede start_date');
	if (payload.updated_at != null) requireIso8601(payload.updated_at, 'updated_at');
	if (payload.status !== undefined && !statuses.includes(payload.status))
		throw new ValidationError('Invalid contract status');
	if (
		payload.relation_type !== undefined &&
		!['amendment', 'renewal', 'termination'].includes(payload.relation_type)
	)
		throw new ValidationError('Invalid relation_type');
	if (payload.auto_renew != null && typeof payload.auto_renew !== 'boolean')
		throw new ValidationError('auto_renew must be boolean or null');
	if (payload.renewal_term_months != null)
		requireInteger(payload.renewal_term_months, 'renewal_term_months', 1, 600);
	if (payload.notice_period_days != null)
		requireInteger(payload.notice_period_days, 'notice_period_days', 0, 3650);
	if (
		payload.value != null &&
		(typeof payload.value !== 'number' ||
			!Number.isFinite(payload.value) ||
			payload.value < 0 ||
			payload.value > 9999999999999.99 ||
			Number(payload.value.toFixed(2)) !== payload.value)
	)
		throw new ValidationError(
			'value must be from 0 to 9999999999999.99 with at most two decimal places',
		);
	for (const [field, max] of [
		['counterparty_name', 255],
		['counterparty_taxpayer_id', 20],
		['owner_id', Infinity],
		['parent_document_id', Infinity],
	] as const) {
		const value = payload[field];
		if (value != null && (typeof value !== 'string' || [...value].length > max))
			throw new ValidationError(`${field} must be text of at most ${max} characters`);
	}
	if (
		payload.currency != null &&
		(typeof payload.currency !== 'string' || !/^[a-z]{3}$/i.test(payload.currency))
	)
		throw new ValidationError('currency must be a three-letter code');
	if (payload.metadata != null) {
		requireBody(payload.metadata);
		const entries = Object.entries(payload.metadata);
		if (
			entries.length > 50 ||
			entries.some(
				([key, value]) =>
					!/^[a-z\d_.-]{1,40}$/i.test(key) || typeof value !== 'string' || [...value].length > 500,
			)
		)
			throw new ValidationError(
				'metadata requires at most 50 valid keys with text values of at most 500 characters',
			);
	}
	if (payload.external_references != null) {
		if (!Array.isArray(payload.external_references) || payload.external_references.length > 20)
			throw new ValidationError('external_references must be a list of at most 20 items');
		for (const reference of payload.external_references) {
			requireBody(reference);
			if (
				typeof reference.system !== 'string' ||
				!/^[a-z\d_.-]{1,64}$/i.test(reference.system) ||
				typeof reference.id !== 'string' ||
				!reference.id ||
				[...reference.id].length > 255 ||
				/[\u{10000}-\u{10ffff}]/u.test(reference.id)
			)
				throw new ValidationError('Each external reference requires a valid system and id');
		}
	}
}
