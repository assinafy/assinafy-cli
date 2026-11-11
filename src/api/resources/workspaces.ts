import { ValidationError } from '../errors.js';
import type {
	IAccountTheme,
	IAccountUsage,
	ICreateWorkspacePayload,
	IDocumentStatsParams,
	IDocumentStatsRow,
	IEmptyResult,
	INotificationPolicy,
	IStatusResponse,
	IUpdateNotificationPolicyPayload,
	IUpdateWorkspacePayload,
	IUploadAccountLogoOptions,
	IWorkspaceListItem,
	IWorkspaceListResponse,
	IWorkspaceResponse,
} from '../types.js';
import { NOTIFICATION_PREFERENCE_CODES, PUSH_PREFERENCE_CODES } from '../types.js';
import { appendFilePart, documentStatsParams, validateBooleanMap } from '../utils.js';
import { BaseResource } from './base.js';

export class WorkspaceResource extends BaseResource {
	/** Create a new workspace. */
	async create(payload: ICreateWorkspacePayload): Promise<IWorkspaceResponse> {
		if (!payload.name?.trim()) {
			throw new ValidationError('Workspace name is required');
		}
		validateNotificationSender(payload.notification_sender_type);
		return this.call('Failed to create workspace', () => this.http.post('/accounts', payload));
	}

	/** List workspaces the authenticated user can access. */
	async list(): Promise<IWorkspaceListResponse> {
		return this.callList<IWorkspaceListItem>('Failed to list workspaces', () =>
			this.http.get('/accounts'),
		);
	}

	/** Fetch a single workspace. */
	async get(
		accountId: string,
		params: { expand?: 'signing_features' } = {},
	): Promise<IWorkspaceResponse> {
		const id = this.requireId(accountId, 'Account ID');
		return this.call('Failed to fetch workspace', () =>
			this.http.get(`/accounts/${id}`, { params }),
		);
	}

	/** Plan allowance and balances; unavailable to third-party OAuth applications. */
	async usage(accountId: string): Promise<IAccountUsage> {
		const id = this.requireId(accountId, 'Account ID');
		return this.call('Failed to fetch workspace usage', () =>
			this.http.get(`/accounts/${id}/usage`),
		);
	}

	async getNotificationPolicy(accountId: string): Promise<INotificationPolicy> {
		const id = this.requireId(accountId, 'Account ID');
		return this.call('Failed to fetch notification policy', () =>
			this.http.get(`/accounts/${id}/notification-policy`),
		);
	}

	/** Owner-only partial merge; false disables the alert workspace-wide. */
	async updateNotificationPolicy(
		accountId: string,
		payload: IUpdateNotificationPolicyPayload,
	): Promise<INotificationPolicy> {
		const id = this.requireId(accountId, 'Account ID');
		if (
			!payload ||
			typeof payload !== 'object' ||
			Array.isArray(payload) ||
			!Object.keys(payload).length ||
			Object.keys(payload).some((key) => !['events', 'owners_receive_all'].includes(key))
		)
			throw new ValidationError('Provide events and/or owners_receive_all');
		if (payload.owners_receive_all !== undefined && typeof payload.owners_receive_all !== 'boolean')
			throw new ValidationError('owners_receive_all must be a boolean');
		if (payload.events !== undefined)
			validateBooleanMap(payload.events, [
				...NOTIFICATION_PREFERENCE_CODES,
				...PUSH_PREFERENCE_CODES,
			]);
		if (payload.events === undefined && payload.owners_receive_all === undefined)
			throw new ValidationError('At least one notification policy field is required');
		return this.call('Failed to update notification policy', () =>
			this.http.put(`/accounts/${id}/notification-policy`, payload),
		);
	}

	/** Fetch the workspace's public branding theme. */
	async getTheme(accountId: string): Promise<IAccountTheme> {
		const id = this.requireId(accountId, 'Account ID');
		return this.call('Failed to fetch workspace theme', () =>
			this.http.get(`/accounts/${id}/theme`),
		);
	}

	/** Download the workspace logo image. */
	async downloadLogo(accountId: string): Promise<Buffer> {
		const id = this.requireId(accountId, 'Account ID');
		return this.callBinary('Failed to download workspace logo', () =>
			this.http.get<ArrayBuffer>(`/accounts/${id}/logo`, { responseType: 'arraybuffer' }),
		);
	}

	/** Upload or replace the workspace logo image. */
	async uploadLogo(
		accountId: string,
		logo: Buffer,
		options: IUploadAccountLogoOptions = {},
	): Promise<IStatusResponse> {
		const id = this.requireId(accountId, 'Account ID');
		if (!Buffer.isBuffer(logo) || logo.byteLength === 0) {
			throw new ValidationError('Logo buffer is required');
		}

		const contentType = options.contentType ?? 'image/png';
		const form = new FormData();
		appendFilePart(form, logo, contentType, options.fileName ?? 'logo.png');

		return this.call('Failed to upload workspace logo', () =>
			this.http.post(`/accounts/${id}/logo`, form, {
				headers: { 'Content-Type': 'multipart/form-data' },
			}),
		);
	}

	/** Delete the workspace logo. */
	async deleteLogo(accountId: string): Promise<IStatusResponse> {
		const id = this.requireId(accountId, 'Account ID');
		return this.call('Failed to delete workspace logo', () =>
			this.http.delete(`/accounts/${id}/logo`),
		);
	}

	/** Fetch monthly or daily document-funnel statistics for a workspace. */
	async stats(accountId: string, params: IDocumentStatsParams = {}): Promise<IDocumentStatsRow[]> {
		const id = this.requireId(accountId, 'Account ID');
		return this.call('Failed to fetch workspace statistics', () =>
			this.http.get(`/accounts/${id}/stats`, { params: documentStatsParams(params) }),
		);
	}

	/** Update a workspace. */
	async update(accountId: string, payload: IUpdateWorkspacePayload): Promise<IWorkspaceResponse> {
		const id = this.requireId(accountId, 'Account ID');
		validateNotificationSender(payload.notification_sender_type);
		return this.call('Failed to update workspace', () => this.http.put(`/accounts/${id}`, payload));
	}

	/**
	 * Delete a workspace.
	 *
	 * By default fails with `ApiError` (400) if the workspace has an active
	 * paid subscription; pass `{ force: true }` to cancel it and delete anyway.
	 */
	async delete(accountId: string, options: { force?: boolean } = {}): Promise<IEmptyResult> {
		const id = this.requireId(accountId, 'Account ID');
		return this.call('Failed to delete workspace', () =>
			this.http.delete(`/accounts/${id}`, options.force ? { data: { force: true } } : undefined),
		);
	}
}

function validateNotificationSender(value: string | undefined): void {
	if (value !== undefined && value !== 'User' && value !== 'Account') {
		throw new ValidationError('notification_sender_type must be User or Account');
	}
}
