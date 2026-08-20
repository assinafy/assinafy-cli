import { ValidationError } from '../errors.js';
import type {
	IAccountTheme,
	ICreateWorkspacePayload,
	IDocumentStatsParams,
	IDocumentStatsRow,
	IEmptyResult,
	IStatusResponse,
	IUpdateWorkspacePayload,
	IUploadAccountLogoOptions,
	IWorkspaceListItem,
	IWorkspaceListResponse,
	IWorkspaceResponse,
} from '../types.js';
import { documentStatsParams } from '../utils.js';
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
	async get(accountId: string): Promise<IWorkspaceResponse> {
		const id = this.requireId(accountId, 'Account ID');
		return this.call('Failed to fetch workspace', () => this.http.get(`/accounts/${id}`));
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
		const view = new Uint8Array(logo.buffer as ArrayBuffer, logo.byteOffset, logo.byteLength);
		const form = new FormData();
		form.append('file', new Blob([view], { type: contentType }), options.fileName ?? 'logo.png');

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
