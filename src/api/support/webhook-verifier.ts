import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IWebhookPayload } from '../types.js';

/** Options for the legacy {@link WebhookVerifier.verify} body-only HMAC. */
export interface WebhookVerifierOptions {
	/** HMAC hash algorithm. Defaults to `sha256`. */
	algorithm?: string;
	/** Digest encoding of the signature value. Defaults to `hex`. */
	encoding?: 'hex' | 'base64';
}

/** Request headers as Node (`IncomingHttpHeaders`), a plain record, or a Fetch `Headers`. */
export type WebhookHeaders = Headers | Record<string, string | string[] | undefined>;

/** Options for {@link WebhookVerifier.verifyDelivery}. */
export interface WebhookDeliveryOptions {
	/** Maximum clock difference accepted for `webhook-timestamp`. Defaults to 300 seconds. */
	toleranceSeconds?: number;
	/** Current time in milliseconds. Defaults to `Date.now()`. */
	now?: number;
}

/** Case-insensitive single-value header lookup; repeated headers are rejected. */
function readHeader(headers: WebhookHeaders, name: string): string | undefined {
	if (typeof (headers as Headers).get === 'function') {
		return (headers as Headers).get(name) ?? undefined;
	}
	for (const [key, value] of Object.entries(headers)) {
		if (key.toLowerCase() !== name) continue;
		if (Array.isArray(value)) return value.length === 1 ? value[0] : undefined;
		return value;
	}
	return undefined;
}

/**
 * Verifies Assinafy webhook deliveries and parses their JSON envelope.
 *
 * Endpoints with `signing_enabled: true` sign each delivery following the
 * Standard Webhooks specification: `webhook-signature` carries one or more
 * space-separated `v1,<base64>` HMAC-SHA256 values over
 * `{webhook-id}.{webhook-timestamp}.{raw body}`, keyed with the base64 part of
 * the endpoint's `whsec_` secret. Use {@link verifyDelivery} with the raw
 * request body and headers; deduplicate accepted deliveries by `webhook-id`.
 */
export class WebhookVerifier {
	private readonly algorithm: string;
	private readonly encoding: 'hex' | 'base64';

	constructor(
		private readonly webhookSecret?: string,
		options: WebhookVerifierOptions = {},
	) {
		this.algorithm = options.algorithm ?? 'sha256';
		this.encoding = options.encoding ?? 'hex';
	}

	/**
	 * Returns `true` when `headers` carry a Standard Webhooks signature that
	 * matches the raw `payload` under this verifier's `whsec_` secret and the
	 * `webhook-timestamp` is within the tolerance window. Pass the body exactly
	 * as received; re-serialized JSON does not verify.
	 */
	verifyDelivery(
		payload: string | Buffer,
		headers: WebhookHeaders,
		options: WebhookDeliveryOptions = {},
	): boolean {
		if (!this.webhookSecret || !headers) return false;
		const id = readHeader(headers, 'webhook-id');
		const timestamp = readHeader(headers, 'webhook-timestamp');
		const signatures = readHeader(headers, 'webhook-signature');
		if (!id || !timestamp || !signatures || !/^\d+$/.test(timestamp)) return false;

		const tolerance = options.toleranceSeconds ?? 300;
		const now = Math.floor((options.now ?? Date.now()) / 1000);
		if (Math.abs(now - Number(timestamp)) > tolerance) return false;

		const secret = this.webhookSecret.startsWith('whsec_')
			? this.webhookSecret.slice('whsec_'.length)
			: this.webhookSecret;
		const key = Buffer.from(secret, 'base64');
		if (key.length === 0) return false;
		const expected = Buffer.from(
			createHmac('sha256', key)
				.update(`${id}.${timestamp}.`)
				.update(typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload)
				.digest('base64'),
		);

		return signatures.split(' ').some((entry) => {
			const [version, value] = entry.split(',', 2);
			if (version !== 'v1' || !value) return false;
			const provided = Buffer.from(value);
			return provided.length === expected.length && timingSafeEqual(provided, expected);
		});
	}

	/**
	 * Returns `true` if `signature` is an HMAC of `payload` keyed with the raw
	 * secret string under the configured algorithm/encoding.
	 *
	 * @deprecated Assinafy signs deliveries with Standard Webhooks headers; use
	 * {@link verifyDelivery}. Retained for existing callers.
	 */
	verify(payload: string | Buffer, signature: string): boolean {
		if (!this.webhookSecret || !signature) return false;
		try {
			const buf = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
			const expected = createHmac(this.algorithm, this.webhookSecret)
				.update(buf)
				.digest(this.encoding);
			const a = Buffer.from(expected, 'utf8');
			const b = Buffer.from(signature.trim(), 'utf8');
			if (a.length !== b.length) return false;
			return timingSafeEqual(a, b);
		} catch {
			return false;
		}
	}

	/** Parse the raw webhook body into a JSON event envelope. */
	extractEvent(payload: string | Buffer): IWebhookPayload | null {
		try {
			const text = typeof payload === 'string' ? payload : payload.toString('utf8');
			const parsed = JSON.parse(text) as IWebhookPayload;
			// Only a JSON object is a valid envelope — reject arrays and primitives.
			return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
		} catch {
			return null;
		}
	}

	/** Extract the event name (`event` or `type`) from an event envelope. */
	getEventType(event: IWebhookPayload | null | undefined): string | null {
		if (!event || typeof event !== 'object') return null;
		const e = event as IWebhookPayload & { type?: unknown };
		if (typeof e.event === 'string') return e.event;
		return typeof e.type === 'string' ? e.type : null;
	}

	/**
	 * Extract the event data from an event envelope.
	 *
	 * The per-event data may live under `payload`, `data`, or `object`; only a
	 * non-array JSON object is returned.
	 */
	getEventData(event: IWebhookPayload | null | undefined): Record<string, unknown> {
		if (!event || typeof event !== 'object') return {};
		const e = event as IWebhookPayload & { object?: Record<string, unknown> };
		for (const candidate of [e.payload, e.data, e.object]) {
			if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
				return candidate;
			}
		}
		return {};
	}
}
