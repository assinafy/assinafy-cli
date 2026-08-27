import { ValidationError } from '../errors.js';
import type {
	IWebhookDispatch,
	IWebhookDispatchListParams,
	IWebhookEventTypeInfo,
	IWebhookRegisterPayload,
	IWebhookSubscription,
	PaginatedResult,
	WebhookEventType,
} from '../types.js';
import { cleanParams, requireEmail, requireSort } from '../utils.js';
import { BaseResource } from './base.js';

const DEFAULT_EVENTS: WebhookEventType[] = [
	'document_ready',
	'document_prepared',
	'signer_signed_document',
	'signer_rejected_document',
	'document_processing_failed',
];

export class WebhookResource extends BaseResource {
	/** Register (or replace) the webhook subscription for the workspace. */
	async register(
		payload: IWebhookRegisterPayload,
		accountId?: string,
	): Promise<IWebhookSubscription> {
		if (!payload.url) throw new ValidationError('Webhook URL is required');
		let webhookUrl: URL;
		try {
			webhookUrl = new URL(payload.url);
		} catch {
			throw new ValidationError('Webhook URL must be a valid HTTP(S) URL');
		}
		if (webhookUrl.protocol !== 'http:' && webhookUrl.protocol !== 'https:') {
			throw new ValidationError('Webhook URL must be a valid HTTP(S) URL');
		}
		requireEmail(payload.email);
		if (
			payload.events !== undefined &&
			(!Array.isArray(payload.events) ||
				payload.events.some((event) => typeof event !== 'string' || !event))
		) {
			throw new ValidationError('Webhook events must contain non-empty strings');
		}
		if (payload.is_active !== undefined && typeof payload.is_active !== 'boolean') {
			throw new ValidationError('Webhook is_active must be a boolean');
		}

		const id = this.accountId(accountId);
		const body = {
			url: payload.url,
			email: payload.email,
			// Distinguish "omitted" (use the sensible default set) from an
			// explicit empty array (the caller wants zero events).
			events: payload.events ?? DEFAULT_EVENTS,
			is_active: payload.is_active ?? true,
		};

		this.logger.info('Registering webhook', { eventCount: body.events.length });

		return this.call('Failed to register webhook', () =>
			this.http.put(`/accounts/${id}/webhooks/subscriptions`, body),
		);
	}

	/** Fetch the current webhook subscription. Returns `null` if none exists. */
	async get(accountId?: string): Promise<IWebhookSubscription | null> {
		const id = this.accountId(accountId);
		return this.callOptional<IWebhookSubscription>('Failed to fetch webhook subscription', () =>
			this.http.get(`/accounts/${id}/webhooks/subscriptions`),
		);
	}

	/** Inactivate the current webhook subscription without deleting it. */
	async inactivate(accountId?: string): Promise<IWebhookSubscription> {
		const id = this.accountId(accountId);
		this.logger.info('Inactivating webhook subscription');
		return this.call('Failed to inactivate webhook subscription', () =>
			this.http.put(`/accounts/${id}/webhooks/inactivate`),
		);
	}

	/** List currently supported webhook event types. */
	async listEventTypes(): Promise<IWebhookEventTypeInfo[]> {
		return this.call('Failed to list webhook event types', () =>
			this.http.get('/webhooks/event-types'),
		);
	}

	/** List webhook delivery history for the workspace. */
	async listDispatches(
		params: IWebhookDispatchListParams = {},
		accountId?: string,
	): Promise<PaginatedResult<IWebhookDispatch>> {
		const id = this.accountId(accountId);
		if ('search' in params) throw new ValidationError('webhook dispatch search is not supported');
		requireSort(params.sort, ['created_at', '-created_at']);
		return this.callList<IWebhookDispatch>('Failed to list webhook dispatches', () =>
			this.http.get(`/accounts/${id}/webhooks`, {
				params: cleanParams(params as unknown as Record<string, unknown>),
			}),
		);
	}

	/** Retry delivery of a specific webhook dispatch. */
	async retryDispatch(dispatchId: string, accountId?: string): Promise<IWebhookDispatch> {
		const id = this.accountId(accountId);
		const did = this.requireId(dispatchId, 'Dispatch ID');
		return this.call('Failed to retry webhook dispatch', () =>
			this.http.post(`/accounts/${id}/webhooks/${did}/retry`),
		);
	}
}
