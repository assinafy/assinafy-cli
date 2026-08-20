import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { WebhookVerifier } from './webhook-verifier';

function sign(
	secret: string,
	payload: string,
	encoding: 'hex' | 'base64' = 'hex',
	algorithm = 'sha256',
): string {
	return createHmac(algorithm, secret).update(Buffer.from(payload, 'utf8')).digest(encoding);
}

const SECRET = 'whsec_test';
const BODY = JSON.stringify({ event: 'document_ready', data: { id: 'doc1' } });

describe('WebhookVerifier.verify', () => {
	it('accepts a valid hex signature over string and buffer payloads (and trims)', () => {
		const v = new WebhookVerifier(SECRET);
		const sig = sign(SECRET, BODY);
		expect(v.verify(BODY, sig)).toBe(true);
		expect(v.verify(Buffer.from(BODY, 'utf8'), sig)).toBe(true);
		expect(v.verify(BODY, `  ${sig}  `)).toBe(true);
	});

	it('accepts a valid base64 signature when configured', () => {
		const v = new WebhookVerifier(SECRET, { encoding: 'base64' });
		expect(v.verify(BODY, sign(SECRET, BODY, 'base64'))).toBe(true);
	});

	it('rejects wrong signature, wrong secret, and empty signature', () => {
		const v = new WebhookVerifier(SECRET);
		expect(v.verify(BODY, sign(SECRET, `${BODY}tampered`))).toBe(false);
		expect(v.verify(BODY, sign('other-secret', BODY))).toBe(false);
		expect(v.verify(BODY, '')).toBe(false);
	});

	it('returns false when no secret is configured', () => {
		expect(new WebhookVerifier(undefined).verify(BODY, sign(SECRET, BODY))).toBe(false);
	});

	it('rejects a differently-sized signature without throwing (length short-circuit)', () => {
		const v = new WebhookVerifier(SECRET);
		expect(v.verify(BODY, 'short')).toBe(false);
	});
});

describe('WebhookVerifier envelope parsing', () => {
	const v = new WebhookVerifier('s');

	it('parses a JSON object envelope but rejects arrays, primitives, and garbage', () => {
		expect(v.extractEvent('{"event":"x"}')).toEqual({ event: 'x' });
		expect(v.extractEvent('[1,2,3]')).toBeNull();
		expect(v.extractEvent('"a string"')).toBeNull();
		expect(v.extractEvent('not json')).toBeNull();
	});

	it('reads the event name from `event` then `type`', () => {
		expect(v.getEventType({ event: 'a' })).toBe('a');
		expect(v.getEventType({ type: 'b' } as never)).toBe('b');
		expect(v.getEventType(null)).toBeNull();
	});

	it('reads event data from `payload`, then `data`, then `object`', () => {
		expect(v.getEventData({ payload: { p: 0 }, data: { a: 1 } } as never)).toEqual({ p: 0 });
		expect(v.getEventData({ data: { a: 1 } } as never)).toEqual({ a: 1 });
		expect(v.getEventData({ object: { b: 2 } } as never)).toEqual({ b: 2 });
		expect(v.getEventData(null)).toEqual({});
	});

	it('skips primitive and array event-data candidates', () => {
		expect(v.getEventData({ payload: 'invalid', data: { a: 1 } } as never)).toEqual({ a: 1 });
		expect(v.getEventData({ payload: [], data: null, object: { b: 2 } } as never)).toEqual({
			b: 2,
		});
		expect(v.getEventData({ payload: 'invalid', data: [], object: null } as never)).toEqual({});
	});

	it('extracts per-event data from a representative webhook dispatch envelope', () => {
		const envelope = {
			id: 15715,
			event: 'signature_requested',
			object: { type: 'Document' },
			origin: null,
			message: null,
			payload: {
				signer_email: 'signer@example.com',
				signer_full_name: 'Example Signer',
				notification_method: 'email',
				signer_whatsapp_phone_number: null,
			},
			subject: { id: 'user1', type: 'User' },
			account_id: 'acc1',
			created_at: '2026-07-20T19:37:08Z',
		};
		expect(v.getEventType(envelope as never)).toBe('signature_requested');
		expect(v.getEventData(envelope as never)).toEqual({
			signer_email: 'signer@example.com',
			signer_full_name: 'Example Signer',
			notification_method: 'email',
			signer_whatsapp_phone_number: null,
		});
	});
});
