import { ApiError, ValidationError } from '../errors.js';
import type {
	ICreateSignerPayload,
	ICreateSignerResponse,
	IEmptyResult,
	ISigner,
	ISignerListParams,
	ISignerListResponse,
	IUpdateSignerPayload,
} from '../types.js';
import { cleanParams, requireSort } from '../utils.js';
import { BaseResource } from './base.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate the locally knowable fields before creating a signer. */
export function validateCreateSignerPayload(payload: ICreateSignerPayload): void {
	if (!payload.full_name?.trim()) throw new ValidationError('Signer full name is required');
	if (payload.email) assertEmail(payload.email);
}

function assertEmail(email: string): void {
	if (!email || !EMAIL_RE.test(email)) {
		throw new ValidationError('Invalid email address', { email });
	}
}

export class SignerResource extends BaseResource {
	/**
	 * Create a signer in the workspace.
	 *
	 * Only `full_name` is required. When an `email` is supplied the call is
	 * idempotent by email: an existing signer with that address is reused instead
	 * of duplicated.
	 */
	async create(payload: ICreateSignerPayload, accountId?: string): Promise<ICreateSignerResponse> {
		const id = this.accountId(accountId);
		validateCreateSignerPayload(payload);

		if (payload.email) {
			const existing = await this.findByEmail(payload.email, id);
			if (existing) {
				this.logger.info('Using existing signer', { signerId: existing.id });
				return existing;
			}
		}

		this.logger.info('Creating signer', { hasEmail: Boolean(payload.email) });
		try {
			return await this.call('Failed to create signer', () =>
				this.http.post(`/accounts/${id}/signers`, normaliseSignerPayload(payload)),
			);
		} catch (err) {
			if (err instanceof ApiError && err.statusCode === 409 && payload.email) {
				const duplicate = await this.findByEmail(payload.email, id);
				if (duplicate) {
					this.logger.info('Signer already exists, using existing signer', {
						signerId: duplicate.id,
					});
					return duplicate;
				}
			}
			throw err;
		}
	}

	/** Get a signer by ID. */
	async get(signerId: string, accountId?: string): Promise<ISigner> {
		const id = this.accountId(accountId);
		const sid = this.requireId(signerId, 'Signer ID');
		return this.call('Failed to fetch signer', () =>
			this.http.get(`/accounts/${id}/signers/${sid}`),
		);
	}

	/** List signers (`sort` accepts the live-verified `full_name` / `-full_name`). */
	async list(params: ISignerListParams = {}, accountId?: string): Promise<ISignerListResponse> {
		const id = this.accountId(accountId);
		requireSort(params.sort, ['full_name', '-full_name']);
		return this.callList<ISigner>('Failed to list signers', () =>
			this.http.get(`/accounts/${id}/signers`, {
				params: cleanParams(params as unknown as Record<string, unknown>),
			}),
		);
	}

	/** Update a signer. Fails if the signer has active assignments. */
	async update(
		signerId: string,
		payload: IUpdateSignerPayload,
		accountId?: string,
	): Promise<ICreateSignerResponse> {
		const id = this.accountId(accountId);
		const sid = this.requireId(signerId, 'Signer ID');
		return this.call('Failed to update signer', () =>
			this.http.put(`/accounts/${id}/signers/${sid}`, normaliseSignerPayload(payload, true)),
		);
	}

	/** Delete a signer. */
	async delete(signerId: string, accountId?: string): Promise<IEmptyResult> {
		const id = this.accountId(accountId);
		const sid = this.requireId(signerId, 'Signer ID');
		return this.call('Failed to delete signer', () =>
			this.http.delete(`/accounts/${id}/signers/${sid}`),
		);
	}

	/** Find a signer by email via the API's `search` parameter. Returns `null` if none match. */
	async findByEmail(email: string, accountId?: string): Promise<ISigner | null> {
		assertEmail(email);
		try {
			const { data } = await this.list({ search: email, per_page: 100 }, accountId);
			const lower = email.toLowerCase();
			return data.find((s) => (s.email ?? '').toLowerCase() === lower) ?? null;
		} catch (err) {
			if (err instanceof ApiError && err.statusCode === 404) {
				return null;
			}
			throw err;
		}
	}
}

function normaliseSignerPayload(
	payload: ICreateSignerPayload | IUpdateSignerPayload,
	useGovernmentId = false,
): Record<string, unknown> {
	const normalised: Record<string, unknown> = {
		full_name: payload.full_name,
		email: payload.email,
		whatsapp_phone_number: payload.whatsapp_phone_number ?? payload.phone,
	};

	const governmentId =
		'government_id' in payload ? (payload.government_id ?? payload.cpf) : payload.cpf;
	if (governmentId) {
		// Strip formatting; only forward a CPF when digits actually remain so a
		// value like "---" doesn't get sent as an empty string.
		const digits = governmentId.replace(/\D/g, '');
		if (digits) normalised[useGovernmentId ? 'government_id' : 'cpf'] = digits;
	}

	if ('metadata' in payload && payload.metadata !== undefined) {
		normalised.metadata = payload.metadata;
	}

	return cleanParams(normalised);
}
