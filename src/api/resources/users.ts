import {
	type IDocumentStatsParams,
	type IDocumentStatsRow,
	type INotificationPreferences,
	type IPushPreferences,
	type IUpdateNotificationPreferencesPayload,
	type IUserSelfResponse,
	NOTIFICATION_PREFERENCE_CODES,
	PUSH_PREFERENCE_CODES,
} from '../types.js';
import { documentStatsParams, validateBooleanMap } from '../utils.js';
import { BaseResource } from './base.js';

/** Authenticated user profile, statistics, and notification preferences. */
export class UsersResource extends BaseResource {
	/** Fetch the authenticated user's profile. */
	async self(): Promise<IUserSelfResponse> {
		return this.call('Failed to fetch authenticated user', () => this.http.get('/users/self'));
	}

	/** Fetch monthly or daily document-funnel statistics across the user's accounts. */
	async stats(params: IDocumentStatsParams = {}): Promise<IDocumentStatsRow[]> {
		return this.call('Failed to fetch user statistics', () =>
			this.http.get('/users/self/stats', { params: documentStatsParams(params) }),
		);
	}

	/** Fetch all owner-facing email notification preferences. */
	async getNotificationPreferences(): Promise<INotificationPreferences> {
		return this.call('Failed to fetch notification preferences', () =>
			this.http.get('/users/self/notification-preferences'),
		);
	}

	/** Merge one or more owner-facing email notification preferences. */
	async updateNotificationPreferences(
		payload: IUpdateNotificationPreferencesPayload,
	): Promise<INotificationPreferences> {
		validateBooleanMap(payload, NOTIFICATION_PREFERENCE_CODES);

		return this.call('Failed to update notification preferences', () =>
			this.http.put('/users/self/notification-preferences', payload),
		);
	}

	async getPushPreferences(): Promise<IPushPreferences> {
		return this.call('Failed to fetch push preferences', () =>
			this.http.get('/users/self/push-preferences'),
		);
	}

	async updatePushPreferences(payload: Partial<IPushPreferences>): Promise<IPushPreferences> {
		validateBooleanMap(payload, PUSH_PREFERENCE_CODES);
		return this.call('Failed to update push preferences', () =>
			this.http.put('/users/self/push-preferences', payload),
		);
	}
}
