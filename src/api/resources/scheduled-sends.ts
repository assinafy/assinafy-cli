import type { IScheduledSend, IScheduledSendListParams, PaginatedResult } from '../types.js';
import { cleanParams } from '../utils.js';
import { BaseResource } from './base.js';

/** Follow requests queued by assignments.schedule or envelopes.schedule (staging). */
export class ScheduledSendResource extends BaseResource {
	async list(
		params: IScheduledSendListParams = {},
		accountId?: string,
	): Promise<PaginatedResult<IScheduledSend>> {
		const id = this.accountId(accountId);
		return this.callList('Failed to list scheduled sends', () =>
			this.http.get(`/accounts/${id}/scheduled-sends`, { params: cleanParams({ ...params }) }),
		);
	}

	/** Cancel only a pending request; nothing is sent or charged. */
	async cancel(scheduledSendId: string, accountId?: string): Promise<IScheduledSend> {
		const id = this.accountId(accountId);
		const sid = this.requireId(scheduledSendId, 'Scheduled send ID');
		return this.call('Failed to cancel scheduled send', () =>
			this.http.put(`/accounts/${id}/scheduled-sends/${sid}/cancel`),
		);
	}

	/** Execute a pending request now, sending invitations and charging its current cost. */
	async send(scheduledSendId: string, accountId?: string): Promise<IScheduledSend> {
		const id = this.accountId(accountId);
		const sid = this.requireId(scheduledSendId, 'Scheduled send ID');
		return this.call('Failed to send scheduled request', () =>
			this.http.put(`/accounts/${id}/scheduled-sends/${sid}/send`),
		);
	}
}
