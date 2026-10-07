import { ValidationError } from '../errors.js';
import type {
	IEmptyResult,
	IWebhookDispatch,
	IWebhookDispatchListParams,
	IWebhookEndpoint,
	IWebhookEndpointCreatePayload,
	IWebhookEndpointSecret,
	IWebhookEndpointUpdatePayload,
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

/** Validate the webhook fields that are present; omitted fields are left to the caller. */
function validateWebhookFields(payload: IWebhookEndpointUpdatePayload): void {
	if (payload.url !== undefined) {
		let webhookUrl: URL;
		try {
			webhookUrl = new URL(payload.url);
		} catch {
			throw new ValidationError('Webhook URL must be a valid HTTP(S) URL');
		}
		if (webhookUrl.protocol !== 'http:' && webhookUrl.protocol !== 'https:') {
			throw new ValidationError('Webhook URL must be a valid HTTP(S) URL');
		}
	}
	if (payload.email !== undefined) requireEmail(payload.email);
	if (
		payload.events !== undefined &&
		(!Array.isArray(payload.events) ||
			payload.events.some((event) => typeof event !== 'string' || !event))
	) {
		throw new ValidationError('Webhook events must contain non-empty strings');
	}
	if (payload.name !== undefined && typeof payload.name !== 'string') {
		throw new ValidationError('Webhook name must be a string');
	}
	for (const key of ['is_active', 'signing_enabled'] as const) {
		if (payload[key] !== undefined && typeof payload[key] !== 'boolean') {
			throw new ValidationError(`Webhook ${key} must be a boolean`);
		}
	}
}

export class WebhookResource extends BaseResource {
	/**
	 * `PUT /accounts/{accountId}/webhooks/subscriptions` — create or replace the
	 * account's oldest webhook endpoint. Use the endpoint methods for accounts
	 * with several endpoints or for signed deliveries.
	 */
	async register(
		payload: IWebhookRegisterPayload,
		accountId?: string,
	): Promise<IWebhookSubscription> {
		if (!payload.url) throw new ValidationError('Webhook URL is required');
		validateWebhookFields({ ...payload, email: payload.email ?? '' });

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

	/** Fetch the account's oldest webhook endpoint. Returns `null` if none exists. */
	async get(accountId?: string): Promise<IWebhookSubscription | null> {
		const id = this.accountId(accountId);
		return this.callOptional<IWebhookSubscription>('Failed to fetch webhook subscription', () =>
			this.http.get(`/accounts/${id}/webhooks/subscriptions`),
		);
	}

	/** Inactivate the account's oldest webhook endpoint without deleting it. */
	async inactivate(accountId?: string): Promise<IWebhookSubscription> {
		const id = this.accountId(accountId);
		this.logger.info('Inactivating webhook subscription');
		return this.call('Failed to inactivate webhook subscription', () =>
			this.http.put(`/accounts/${id}/webhooks/inactivate`),
		);
	}

	/** `GET /accounts/{accountId}/webhooks/endpoints` — list webhook endpoints, oldest first. */
	async listEndpoints(accountId?: string): Promise<IWebhookEndpoint[]> {
		const id = this.accountId(accountId);
		return this.call('Failed to list webhook endpoints', () =>
			this.http.get(`/accounts/${id}/webhooks/endpoints`),
		);
	}

	/**
	 * `POST /accounts/{accountId}/webhooks/endpoints` — register another
	 * endpoint. Accounts allow 1 endpoint, or up to 3 on paid plans (`403` past
	 * the limit); URLs must be unique per workspace. Omitted `events` uses the
	 * same default set as {@link register}.
	 */
	async createEndpoint(
		payload: IWebhookEndpointCreatePayload,
		accountId?: string,
	): Promise<IWebhookEndpoint> {
		if (!payload.url) throw new ValidationError('Webhook URL is required');
		validateWebhookFields({ ...payload, email: payload.email ?? '' });
		const id = this.accountId(accountId);
		const body = { ...payload, events: payload.events ?? DEFAULT_EVENTS };
		this.logger.info('Creating webhook endpoint', { eventCount: body.events.length });
		return this.call('Failed to create webhook endpoint', () =>
			this.http.post(`/accounts/${id}/webhooks/endpoints`, body),
		);
	}

	/** `GET /accounts/{accountId}/webhooks/endpoints/{endpointId}` — fetch one endpoint. */
	async getEndpoint(endpointId: string, accountId?: string): Promise<IWebhookEndpoint> {
		const id = this.accountId(accountId);
		const eid = this.requireId(endpointId, 'Endpoint ID');
		return this.call('Failed to fetch webhook endpoint', () =>
			this.http.get(`/accounts/${id}/webhooks/endpoints/${eid}`),
		);
	}

	/**
	 * `PUT /accounts/{accountId}/webhooks/endpoints/{endpointId}` — update only
	 * the fields sent. Enabling signing creates a secret when none exists;
	 * disabling it discards the secret.
	 */
	async updateEndpoint(
		endpointId: string,
		payload: IWebhookEndpointUpdatePayload,
		accountId?: string,
	): Promise<IWebhookEndpoint> {
		const id = this.accountId(accountId);
		const eid = this.requireId(endpointId, 'Endpoint ID');
		if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
			throw new ValidationError('At least one webhook endpoint field is required');
		}
		validateWebhookFields(payload);
		return this.call('Failed to update webhook endpoint', () =>
			this.http.put(`/accounts/${id}/webhooks/endpoints/${eid}`, payload),
		);
	}

	/** `DELETE /accounts/{accountId}/webhooks/endpoints/{endpointId}` — delete an endpoint and free its slot. */
	async deleteEndpoint(endpointId: string, accountId?: string): Promise<IEmptyResult> {
		const id = this.accountId(accountId);
		const eid = this.requireId(endpointId, 'Endpoint ID');
		return this.call('Failed to delete webhook endpoint', () =>
			this.http.delete(`/accounts/${id}/webhooks/endpoints/${eid}`),
		);
	}

	/**
	 * `GET …/endpoints/{endpointId}/secret` — the `whsec_` signing secret.
	 * Returns `400` when signing is disabled. Not available to OAuth applications.
	 */
	async getEndpointSecret(endpointId: string, accountId?: string): Promise<IWebhookEndpointSecret> {
		const id = this.accountId(accountId);
		const eid = this.requireId(endpointId, 'Endpoint ID');
		return this.call('Failed to fetch webhook endpoint secret', () =>
			this.http.get(`/accounts/${id}/webhooks/endpoints/${eid}/secret`),
		);
	}

	/**
	 * `POST …/endpoints/{endpointId}/secret/rotate` — replace the signing secret.
	 * The old secret stops working immediately. Not available to OAuth applications.
	 */
	async rotateEndpointSecret(
		endpointId: string,
		accountId?: string,
	): Promise<IWebhookEndpointSecret> {
		const id = this.accountId(accountId);
		const eid = this.requireId(endpointId, 'Endpoint ID');
		this.logger.info('Rotating webhook endpoint secret');
		return this.call('Failed to rotate webhook endpoint secret', () =>
			this.http.post(`/accounts/${id}/webhooks/endpoints/${eid}/secret/rotate`),
		);
	}

	/** List currently supported webhook event types. */
	async listEventTypes(): Promise<IWebhookEventTypeInfo[]> {
		return this.call('Failed to list webhook event types', () =>
			this.http.get('/webhooks/event-types'),
		);
	}

	/** List webhook delivery history for the workspace, optionally for one endpoint. */
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

	/** Retry delivery of a specific webhook dispatch to that entry's endpoint. */
	async retryDispatch(dispatchId: string, accountId?: string): Promise<IWebhookDispatch> {
		const id = this.accountId(accountId);
		const did = this.requireId(dispatchId, 'Dispatch ID');
		return this.call('Failed to retry webhook dispatch', () =>
			this.http.post(`/accounts/${id}/webhooks/${did}/retry`),
		);
	}
}
