import type { InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { AssinafyClient } from '../client';
import type { ICreateEnvelopePayload } from '../envelope-types';
import { ValidationError } from '../errors';
import type { ICreateAssignmentPayload } from '../types';

function capture() {
	const client = new AssinafyClient({ apiKey: 'example-key', accountId: 'account' });
	const requests: Array<{
		url?: string;
		body: unknown;
		headers: InternalAxiosRequestConfig['headers'];
		params: Record<string, unknown>;
		method?: string;
	}> = [];
	client.getAxiosInstance().defaults.adapter = async (config) => {
		requests.push({
			url: config.url,
			params: config.params,
			method: config.method,
			body: config.data ? JSON.parse(config.data) : undefined,
			headers: config.headers,
		});
		return {
			config,
			status: 200,
			statusText: 'OK',
			headers: {},
			data:
				config.responseType === 'arraybuffer'
					? Buffer.from('example-bytes')
					: { status: 200, data: { id: 'example' } },
		};
	};
	return { client, requests };
}

describe('current assignment and signer contracts', () => {
	it('forwards a zero credit ceiling and embedded signer without dropping either', async () => {
		const { client, requests } = capture();
		const payload = {
			method: 'virtual',
			max_total_credits: 0,
			signers: [{ id: 'signer', embedded: true }],
		} as ICreateAssignmentPayload;
		await client.assignments.create('document', payload);
		expect(requests[0]?.body).toEqual(payload);
	});

	it('preserves explicit null and empty contact clears on signer updates', async () => {
		const { client, requests } = capture();
		await client.signers.update('signer', {
			email: null,
			whatsapp_phone_number: null,
			government_id: null,
		});
		expect(requests[0]?.body).toEqual({
			email: null,
			whatsapp_phone_number: null,
			government_id: null,
		});
		await client.signers.update('signer', {
			email: '',
			whatsapp_phone_number: '',
			government_id: '',
		});
		expect(requests[1]?.body).toEqual({ email: '', whatsapp_phone_number: '', government_id: '' });
	});

	it('searches beyond a server-capped page without pagination headers', async () => {
		const { client } = capture();
		const pages: number[] = [];
		client.getAxiosInstance().defaults.adapter = async (config) => {
			pages.push(config.params.page);
			const data =
				config.params.page === 1
					? Array.from({ length: 50 }, (_, i) => ({
							id: String(i),
							email: `other${i}@example.com`,
						}))
					: [{ id: 'target', email: 'signer@example.com' }];
			return { config, status: 200, statusText: 'OK', headers: {}, data: { status: 200, data } };
		};
		expect(await client.signers.findByEmail('signer@example.com')).toMatchObject({ id: 'target' });
		expect(pages).toEqual([1, 2]);
	});
});

const envelope: ICreateEnvelopePayload = {
	name: 'Example contract',
	signers: [
		{ id: 'signer', verification_method: 'Email', notification_methods: ['Email'], embedded: true },
	],
	documents: [{ id: 'document', signer_ids: ['signer'], expires_at: null }],
	message: null,
	max_total_credits: 0,
};

describe('envelope boundaries', () => {
	it('preserves nullable fields, zero ceilings, false flags and idempotency headers', async () => {
		const { client, requests } = capture();
		await client.envelopes.create(envelope, { idempotencyKey: 'example-creation-key' });
		expect(requests[0]?.body).toEqual(envelope);
		expect(requests[0]?.headers.get('Idempotency-Key')).toBe('example-creation-key');
		await client.envelopes.update('envelope', { message: null });
		expect(requests[1]?.body).toEqual({ message: null });
		await client.envelopes.addDocument('envelope', {
			id: 'second',
			signer_ids: ['signer'],
			expires_at: 0,
			max_total_credits: 0,
		});
		expect(requests[2]?.body).toMatchObject({ expires_at: 0, max_total_credits: 0 });
		await client.documents.createFromTemplate(
			'template',
			[{ id: 'signer', role_id: 'role', embedded: false }],
			{ idempotencyKey: 'template-key', max_total_credits: 0 },
		);
		expect(requests[3]?.headers.get('Idempotency-Key')).toBe('template-key');
		expect(requests[3]?.body).toMatchObject({
			max_total_credits: 0,
			signers: [{ embedded: false }],
		});
		expect(requests[3]?.body).not.toHaveProperty('idempotencyKey');
	});

	it.each([-1, NaN, Infinity, null, '0'])(
		'rejects invalid credit ceiling %s before any send',
		async (value) => {
			const { client, requests } = capture();
			await expect(
				client.envelopes.create({ ...envelope, max_total_credits: value as number }),
			).rejects.toBeInstanceOf(ValidationError);
			await expect(
				client.assignments.create('document', {
					method: 'virtual',
					signers: ['signer'],
					max_total_credits: value as number,
				}),
			).rejects.toBeInstanceOf(ValidationError);
			expect(requests).toHaveLength(0);
		},
	);

	it.each(['', ' ', 'key\r\nX-Injected: value'])(
		'rejects an invalid idempotency header',
		async (key) => {
			const { client, requests } = capture();
			await expect(
				client.envelopes.create(envelope, { idempotencyKey: key }),
			).rejects.toBeInstanceOf(ValidationError);
			expect(requests).toHaveLength(0);
		},
	);

	it('rejects inconsistent document/signature assignments before charging', async () => {
		const { client, requests } = capture();
		const invalid: ICreateEnvelopePayload[] = [
			{ ...envelope, documents: [] },
			{ ...envelope, documents: Array(21).fill(envelope.documents[0]) },
			{ ...envelope, documents: [...envelope.documents, ...envelope.documents] },
			{ ...envelope, documents: [{ id: 'document', signer_ids: ['unknown'] }] },
			{ ...envelope, documents: [{ id: 'document', signer_ids: ['signer', 'signer'] }] },
			{ ...envelope, documents: [{ id: 'document', signer_ids: ['signer'], method: 'collect' }] },
			{ ...envelope, signers: [...envelope.signers, { id: 'unused' }] },
			{ ...envelope, signers: [{ id: 'signer', step: 1 } as never] },
			{
				...envelope,
				signers: [{ id: 'signer', verification_method: 'DigitalCertificate', embedded: true }],
			},
			{
				...envelope,
				signers: [
					{ id: 'signer', verification_method: 'Whatsapp', notification_methods: ['Email'] },
				],
			},
		];
		for (const payload of invalid)
			await expect(client.envelopes.create(payload)).rejects.toBeInstanceOf(ValidationError);
		expect(requests).toHaveLength(0);
	});

	it('allows certificate and biometric signers without weakening certificate isolation', async () => {
		const { client, requests } = capture();
		for (const verification_method of ['DigitalCertificate', 'IdDocumentFaceMatchBasic'] as const) {
			await client.envelopes.estimateCost({
				...envelope,
				signers: [{ id: 'signer', verification_method, notification_methods: ['Email'] }],
			});
		}
		await expect(
			client.envelopes.create({
				...envelope,
				signers: [{ id: 'signer', verification_method: 'DigitalCertificate' }, { id: 'second' }],
				documents: [{ id: 'document', signer_ids: ['signer', 'second'] }],
			}),
		).rejects.toThrow(/alone/);
		expect(requests).toHaveLength(2);
	});
});

describe('embedded signing and signer authentication', () => {
	it.each([
		'https://example.com/path',
		'https://example.com/a/..',
		'https://example.com?query',
		'https://user@example.com',
		'https://*.example.com',
		'http://example.com',
		' https://example.com',
		'https://example.com/#fragment',
	])('rejects a non-origin %s', async (origin) => {
		const { client, requests } = capture();
		await expect(client.embed.createOrigin(origin)).rejects.toBeInstanceOf(ValidationError);
		expect(requests).toHaveLength(0);
	});

	it.each([
		'https://app.example.com',
		'https://app.example.com:8443/',
		'http://localhost:3000',
		'http://127.0.0.1:5173',
	])('accepts the supported origin %s', async (origin) => {
		const { client, requests } = capture();
		await client.embed.createOrigin(origin);
		expect(requests[0]?.body).toEqual({ origin });
	});

	it('strips owner credentials for token exchanges and signer-scoped artifact reads', async () => {
		const { client, requests } = capture();
		client.getAxiosInstance().defaults.headers.common.Authorization = 'Bearer example-owner';
		await client.embed.exchangeSession('session-token', 'https://app.example.com');
		await client.documents.getAsSigner('document', 'access-code');
		await client.documents.thumbnail('document', {
			artifact: 'certificated',
			signerAccessCode: 'access-code',
		});
		await client.documents.downloadPage('document', 'page', {
			artifact: 'certificated',
			signerAccessCode: 'access-code',
		});
		await client.documents.download('document', 'original', { signerAccessCode: 'access-code' });
		await client.signerDocuments.downloadCertifiedCopy('download-token');
		for (const request of requests) {
			expect(request.headers.get('X-Api-Key')).toBeUndefined();
			expect(request.headers.get('Authorization')).toBeUndefined();
		}
		expect(requests[0]?.body).toEqual({ parent_origin: 'https://app.example.com' });
		expect(requests[2]?.params).toEqual({
			artifact: 'certificated',
			'signer-access-code': 'access-code',
		});
		await expect(
			client.documents.thumbnail('document', { signerAccessCode: ' ' }),
		).rejects.toThrow();
		expect(requests).toHaveLength(6);
	});

	it('confirms certificate data without calling the gated /sign endpoint', async () => {
		const { client } = capture();
		const paths: string[] = [];
		client.getAxiosInstance().defaults.adapter = async (config) => {
			paths.push(`${config.method} ${config.url}`);
			if (config.url === '/sign') throw new Error('Certificate data has not been confirmed');
			expect(config.headers.get('X-Api-Key')).toBeUndefined();
			return {
				config,
				status: 200,
				statusText: 'OK',
				headers: {},
				data: { status: 200, data: config.method === 'get' ? { id: 'document' } : [] },
			};
		};
		await expect(
			client.signerDocuments.confirmData('document', 'code', { has_accepted_terms: true }),
		).resolves.toEqual([]);
		expect(paths).toEqual([
			'get /documents/document',
			'put /documents/document/signers/confirm-data',
		]);
	});

	it('selects the target envelope document before signing and still rejects mismatched assignments', async () => {
		const { client } = capture();
		let writes = 0;
		client.getAxiosInstance().defaults.adapter = async (config) => {
			if (config.method === 'get') expect(config.params.document_id).toBe('target');
			else writes++;
			return {
				config,
				status: 200,
				statusText: 'OK',
				headers: {},
				data: {
					status: 200,
					data: { id: 'target', assignment: { id: 'assignment', method: 'virtual' } },
				},
			};
		};
		await client.signerDocuments.sign('target', 'assignment', 'code', []);
		await expect(client.signerDocuments.sign('target', 'other', 'code', [])).rejects.toThrow(
			/does not match/,
		);
		expect(writes).toBe(1);
	});
});

describe('notification controls', () => {
	it('forwards explicit false preferences and secret rotation overlap', async () => {
		const { client, requests } = capture();
		await client.users.updatePushPreferences({ SignerViewed: false });
		await client.workspaces.updateNotificationPolicy('account', {
			owners_receive_all: false,
			events: { SignerSigned: false },
		});
		await client.webhooks.rotateEndpointSecret('endpoint', undefined, { keep_previous: true });
		await client.webhooks.rotateEndpointSecret('endpoint', undefined, { keep_previous: false });
		expect(requests.map((r) => r.body)).toEqual([
			{ SignerViewed: false },
			{ owners_receive_all: false, events: { SignerSigned: false } },
			{ keep_previous: true },
			{ keep_previous: false },
		]);
	});

	it('rejects mistyped or empty preferences without silently resetting settings', async () => {
		const { client, requests } = capture();
		for (const body of [{}, { SignerViewed: 'false' }, { Unknown: true }, []]) {
			await expect(client.users.updatePushPreferences(body as never)).rejects.toBeInstanceOf(
				ValidationError,
			);
		}
		for (const body of [{}, { events: {} }, { owners_receive_all: 'false' }, { typo: true }]) {
			await expect(
				client.workspaces.updateNotificationPolicy('account', body as never),
			).rejects.toBeInstanceOf(ValidationError);
		}
		await expect(
			client.webhooks.rotateEndpointSecret('endpoint', undefined, {
				keep_previous: 'true' as never,
			}),
		).rejects.toBeInstanceOf(ValidationError);
		expect(requests).toHaveLength(0);
	});
});

it('selects each envelope document for certificate start and completion without changing the opaque operation token', async () => {
	const { client, requests } = capture();
	await client.signerDocuments.startCertificate('code', 'document');
	await client.signerDocuments.completeCertificate('code', 'opaque+/token=', 'document');
	expect(requests.map((r) => r.body)).toEqual([
		{ 'signer-access-code': 'code', document_id: 'document' },
		{ 'signer-access-code': 'code', document_id: 'document', token: 'opaque+/token=' },
	]);
	await expect(client.signerDocuments.startCertificate('code', ' ')).rejects.toBeInstanceOf(
		ValidationError,
	);
	expect(requests).toHaveLength(2);
});
