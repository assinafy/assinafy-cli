import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IWebhookPayload } from '../types';

/** Tunables for {@link WebhookVerifier} so the scheme can match the platform. */
export interface WebhookVerifierOptions {
    /** HMAC hash algorithm. Defaults to `sha256`. */
    algorithm?: string;
    /** Digest encoding of the signature value. Defaults to `hex`. */
    encoding?: 'hex' | 'base64';
}

/**
 * Best-effort verifier for Assinafy webhook payload signatures.
 *
 * NOTE: the public API reference does not document a webhook signing scheme.
 * This helper implements the common convention — an HMAC of the raw body using
 * the workspace webhook secret, compared against a hex digest sent in a
 * signature header — and lets you override the algorithm/encoding to match
 * whatever the platform actually sends. Confirm the exact header name and
 * encoding against a real delivered webhook before relying on it, and treat a
 * failed {@link WebhookVerifier.verify} as "unverified", not proof of forgery.
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

    /** Returns `true` if `signature` is a valid HMAC of `payload` under the configured scheme. */
    verify(payload: string | Buffer, signature: string): boolean {
        if (!this.webhookSecret || !signature) return false;

        const buf = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
        const expected = createHmac(this.algorithm, this.webhookSecret).update(buf).digest(this.encoding);
        const provided = signature.trim();

        const a = Buffer.from(expected, 'utf8');
        const b = Buffer.from(provided, 'utf8');
        if (a.length !== b.length) return false;
        try {
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
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    }

    /** Extract the event name (`event` or `type`) from an event envelope. */
    getEventType(event: IWebhookPayload | null | undefined): string | null {
        if (!event || typeof event !== 'object') return null;
        const e = event as IWebhookPayload & { type?: string };
        return e.event ?? e.type ?? null;
    }

    /** Extract the event data (`data` or `object`) from an event envelope. */
    getEventData(event: IWebhookPayload | null | undefined): Record<string, unknown> {
        if (!event || typeof event !== 'object') return {};
        const e = event as IWebhookPayload & { object?: Record<string, unknown> };
        return (e.data as Record<string, unknown> | undefined) ?? e.object ?? {};
    }
}
