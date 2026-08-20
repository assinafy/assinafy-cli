import { ValidationError } from '../errors.js';
import {
	type IDocumentStatsParams,
	type IDocumentStatsRow,
	type INotificationPreferences,
	type IUpdateNotificationPreferencesPayload,
	type IUserSelfResponse,
	NOTIFICATION_PREFERENCE_CODES,
} from '../types.js';
import { documentStatsParams } from '../utils.js';
import { BaseResource } from './base.js';

const NOTIFICATION_PREFERENCES = new Set<string>(NOTIFICATION_PREFERENCE_CODES);

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
		if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
			throw new ValidationError('Notification preferences must be an object');
		}
		const entries = Object.entries(payload);
		if (entries.length === 0) {
			throw new ValidationError('At least one notification preference is required');
		}
		for (const [key, value] of entries) {
			if (!NOTIFICATION_PREFERENCES.has(key)) {
				throw new ValidationError(`Unknown notification preference: ${key}`);
			}
			if (typeof value !== 'boolean') {
				throw new ValidationError(`${key} must be a boolean`);
			}
		}

		return this.call('Failed to update notification preferences', () =>
			this.http.put('/users/self/notification-preferences', payload),
		);
	}
}
