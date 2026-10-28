import type { AxiosAdapter } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AssinafyClient } from '../client';
import { ValidationError } from '../errors';
import type {
	IAssignment,
	IAssignmentItem,
	IAssignmentSigner,
	IDocumentDetailsResponse,
	IResendCostEstimate,
	IWebhookDispatch,
	IWebhookEndpointCreateResponse,
	IWhatsAppNotification,
	IWorkspaceResponse,
} from '../types';
import { buildAssignmentPayload } from './assignments';

function clientWithResponse(data: unknown) {
	const client = new AssinafyClient({ apiKey: 'example-owner', accountId: 'account' });
	const adapter = vi.fn<AxiosAdapter>(async (config) => ({
		config,
		status: 200,
		statusText: 'OK',
		headers: {},
		data: { status: 200, data },
	}));
	client.getAxiosInstance().defaults.adapter = adapter;
	return { client, adapter };
}

describe('published template signer forms', () => {
	it('forwards inline email signers and lets an explicit ID take precedence', async () => {
		const { client, adapter } = clientWithResponse({ id: 'document' });
		const signers = [
			{
				role_id: 'role',
				email: 'signer@example.com',
				name: 'Example Signer',
				whatsapp_phone_number: '+5500000000000',
			},
		];
		await client.documents.createFromTemplate('template', signers);
		expect(JSON.parse(adapter.mock.calls[0]![0].data)).toEqual({ signers });
		await client.documents.createFromTemplate('template', [
			{ role_id: 'role', id: 'signer', email: 'ignored' },
		]);
		expect(adapter).toHaveBeenCalledTimes(2);
	});
	it.each([
		{ role_id: 'role' },
		{ role_id: 'role', email: 'invalid' },
		{ role_id: 'role', email: 'signer@example.com', name: ' ' },
	])('rejects invalid inline signer %j before transport', async (signer) => {
		const { client, adapter } = clientWithResponse({});
		await expect(client.documents.createFromTemplate('template', [signer])).rejects.toThrow(
			ValidationError,
		);
		expect(adapter).not.toHaveBeenCalled();
	});

	it('does not count copy receivers in the signer step sequence', async () => {
		const { client, adapter } = clientWithResponse({ id: 'document' });
		const signers = [
			{ role_id: 'signer-role', id: 'signer', step: 1 },
			{ role_id: 'copy-role', id: 'copy' },
		];
		await client.documents.createFromTemplate('template', signers);
		expect(JSON.parse(adapter.mock.calls[0]![0].data)).toEqual({ signers });
	});
	it.each([{ verification_method: 'Email', notification_methods: ['Whatsapp'] }, { step: 0 }])(
		'forwards controls ignored for a copy receiver: %j',
		async (controls) => {
			const { client, adapter } = clientWithResponse({ id: 'document' });
			const signers = [{ role_id: 'copy-role', id: 'copy', ...controls }];
			await client.documents.createFromTemplate('template', signers);
			await client.documents.estimateCostFromTemplate('template', signers);
			expect(adapter).toHaveBeenCalledTimes(2);
			for (const [config] of adapter.mock.calls)
				expect(JSON.parse(config.data)).toEqual({ signers });
		},
	);

	it('allows certificate signers when only editor fields are placed', async () => {
		const { client, adapter } = clientWithResponse({
			roles: [
				{ id: 'editor', assignment_type: 'Editor' },
				{ id: 'signer-role', assignment_type: 'Signer' },
			],
			pages: [{ fields: [{ role_id: 'editor', field_id: 'text' }] }],
		});
		const signer = {
			role_id: 'signer-role',
			id: 'signer',
			verification_method: 'DigitalCertificate',
		};
		await client.documents.createFromTemplate('template', [signer]);
		await client.documents.estimateCostFromTemplate('template', [signer]);
		expect(adapter.mock.calls.map(([config]) => config.method)).toEqual([
			'get',
			'post',
			'get',
			'post',
		]);
	});
	it('ignores certificate controls on a copy receiver when signer fields are placed', async () => {
		const { client, adapter } = clientWithResponse({
			roles: [
				{ id: 'copy', assignment_type: 'CopyReceiver' },
				{ id: 'signer-role', assignment_type: 'Signer' },
			],
			pages: [{ fields: [{ role_id: 'signer-role', field_id: 'text' }] }],
		});
		await client.documents.createFromTemplate('template', [
			{ role_id: 'signer-role', id: 'signer' },
			{ role_id: 'copy', id: 'copy-signer', verification_method: 'DigitalCertificate' },
		]);
		expect(adapter.mock.calls.map(([config]) => config.method)).toEqual(['get', 'post']);
	});
});

describe('document expiry formats', () => {
	it.each([
		'2028-02-29',
		'2028-02-29T23:59:59',
		'2028-02-29T23:59:59.123',
		'2028-02-29T23:59:59-03:00',
	])('forwards %s unchanged in assignment and template calls', async (expires_at) => {
		const { client, adapter } = clientWithResponse({ id: 'document' });
		expect(buildAssignmentPayload({ signers: ['signer'], expires_at })).toMatchObject({
			expires_at,
		});
		await client.assignments.resetExpiration('document', 'assignment', expires_at);
		await client.documents.createFromTemplate('template', [{ role_id: 'role', id: 'signer' }], {
			expires_at,
		});
		for (const [config] of adapter.mock.calls)
			expect(JSON.parse(config.data)).toMatchObject({ expires_at });
	});
	it.each(['2027-02-29', '2028-02-30T23:59:59', '2028-02-29T24:00:00', 'tomorrow'])(
		'rejects impossible expiration %s before a request',
		async (expires_at) => {
			const { client, adapter } = clientWithResponse({});
			await expect(
				client.assignments.resetExpiration('document', 'assignment', expires_at),
			).rejects.toThrow(ValidationError);
			expect(adapter).not.toHaveBeenCalled();
		},
	);
});

it('validates derived workflow notification defaults before uploading', async () => {
	const { client, adapter } = clientWithResponse({ id: 'document' });
	await expect(
		client.uploadAndRequestSignatures({
			source: { buffer: Buffer.from('%PDF-1.7'), fileName: 'example.pdf' },
			waitForReady: false,
			signers: [{ name: 'Example Signer', phone: '+5500000000000', verification_method: 'Email' }],
		}),
	).rejects.toBeInstanceOf(ValidationError);
	expect(adapter).not.toHaveBeenCalled();
});

it('allows retrieving older activity pages without changing the array result', async () => {
	const activities = [{ id: 42, event: 'document_uploaded' }];
	const { client, adapter } = clientWithResponse(activities);
	const result = await client.documents.activities('document', {
		page: 2,
		per_page: 5,
		sort: 'id',
	});
	expect(result).toEqual(activities);
	expect(adapter.mock.calls[0]![0].params).toEqual({ page: 2, 'per-page': 5, sort: 'id' });
});

it('requests the assignment expansion promised by the rename result', async () => {
	const { client, adapter } = clientWithResponse({ id: 'document', assignment: null });
	await client.documents.rename('document', 'New name');
	expect(adapter.mock.calls[0]![0].params).toEqual({ expand: 'assignment' });
});

it('exposes webhook enablement secrets and delivery diagnostics without discarding fields', async () => {
	const endpoint = {
		id: 'endpoint',
		name: null,
		url: 'https://example.com/webhook',
		email: 'ops@example.com',
		events: [],
		is_active: true,
		is_held: false,
		held_since: null,
		signing_enabled: true,
		created_at: '2026-10-01T00:00:00Z',
		updated_at: '2026-10-01T00:00:00Z',
		secret: 'example-secret',
	} satisfies IWebhookEndpointCreateResponse;
	const { client } = clientWithResponse(endpoint);
	const updated = await client.webhooks.updateEndpoint('endpoint', { signing_enabled: true });
	expect(updated.secret).toBe(endpoint.secret);
	expect(updated.is_held).toBe(false);
	const dispatch = {
		id: 'dispatch',
		event: 'document_ready',
		activity_id: 1,
		endpoint: endpoint.url,
		payload: null,
		delivered: false,
		webhook_id: 'delivery',
		attempt: 2,
		kind: 'scheduled',
		will_retry: true,
		http_status: 500,
		response_body: null,
		error: null,
		created_at: endpoint.created_at,
	} satisfies IWebhookDispatch;
	const { client: history } = clientWithResponse([dispatch]);
	expect((await history.webhooks.listDispatches()).data[0]).toEqual(dispatch);
});

it('preserves nullable and additional published response fields in public types', () => {
	const response = {
		assignment: {
			document_id: null,
			sender_email: null,
			created_at: '2026-10-01T00:00:00Z',
		} satisfies Pick<IAssignment, 'document_id' | 'sender_email' | 'created_at'>,
		item: { field: null, value: null, display_settings: false } satisfies Pick<
			IAssignmentItem,
			'field' | 'value' | 'display_settings'
		>,
		signer: { notification_history: null } satisfies Pick<
			IAssignmentSigner,
			'notification_history'
		>,
		document: { verification_code: null, verification_url: null } satisfies Pick<
			IDocumentDetailsResponse,
			'verification_code' | 'verification_url'
		>,
		workspace: { limits: { webhook_endpoints: 3 } } satisfies Pick<IWorkspaceResponse, 'limits'>,
		whatsapp: { sent_at: '2026-10-01T00:00:00Z' } satisfies Pick<IWhatsAppNotification, 'sent_at'>,
		estimate: {
			total: 0,
			breakdown: [],
			credit_balance: null,
			has_sufficient_credits: true,
		} satisfies IResendCostEstimate,
	};
	expect(response.estimate.credit_balance).toBeNull();
});
