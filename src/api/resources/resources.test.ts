import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidationError } from '../errors';
import { AssignmentResource, buildAssignmentPayload } from './assignments';
import { DocumentResource } from './documents';
import { FieldsResource } from './fields';
import { SignerDocumentsResource } from './signer-documents';
import { SignerResource } from './signers';
import { TagResource } from './tags';
import { TemplateResource } from './templates';
import { WebhookResource } from './webhooks';
import { WorkspaceResource } from './workspaces';

type CapturedCall = {
	method: string;
	url: string;
	body?: unknown;
	config?: { params?: unknown; headers?: unknown; responseType?: string };
};

function ok(data: unknown, headers: Record<string, string> = {}) {
	return { status: 200, data: { status: 200, data }, headers };
}

function mockHttp(calls: CapturedCall[] = []): AxiosInstance {
	return {
		get: async (url: string, config?: CapturedCall['config']) => {
			calls.push({ method: 'GET', url, config });
			return ok([]);
		},
		post: async (url: string, body?: unknown, config?: CapturedCall['config']) => {
			calls.push({ method: 'POST', url, body, config });
			return ok({ id: 'created' });
		},
		put: async (url: string, body?: unknown, config?: CapturedCall['config']) => {
			calls.push({ method: 'PUT', url, body, config });
			return ok({ id: 'updated' });
		},
		delete: async (url: string, config?: CapturedCall['config']) => {
			calls.push({ method: 'DELETE', url, config });
			return { status: 200, data: { status: 200, data: [] } };
		},
	} as unknown as AxiosInstance;
}

describe('buildAssignmentPayload', () => {
	it('normalises all supported signer reference shapes', () => {
		expect(buildAssignmentPayload({ signer_ids: ['a'] })).toEqual({
			method: 'virtual',
			signers: [{ id: 'a' }],
		});
		expect(
			buildAssignmentPayload({
				signers: [
					{ id: 'a', step: 1 },
					{ signer_id: 'b', verification_method: 'Whatsapp', notification_methods: ['Whatsapp'] },
				],
				message: 'Please sign',
			}),
		).toEqual({
			method: 'virtual',
			signers: [
				{ id: 'a', step: 1 },
				{ id: 'b', verification_method: 'Whatsapp', notification_methods: ['Whatsapp'] },
			],
			message: 'Please sign',
		});
	});

	it('allows cost-estimation signer descriptors without IDs', () => {
		expect(
			buildAssignmentPayload(
				{ signers: [{ verification_method: 'Email' }, {}] },
				{ allowSignersWithoutId: true },
			),
		).toEqual({
			method: 'virtual',
			signers: [{ verification_method: 'Email' }, {}],
		});
	});

	it('rejects empty or invalid signer references', () => {
		expect(() => buildAssignmentPayload({ signers: [] })).toThrow(ValidationError);
		expect(() => buildAssignmentPayload({ signers: [{} as never] })).toThrow(ValidationError);
	});
});

describe('DocumentResource', () => {
	it('lists documents with documented query keys', async () => {
		const calls: CapturedCall[] = [];
		const docs = new DocumentResource(mockHttp(calls), 'acc');
		await docs.list({ status: 'pending_signature', method: 'virtual', tags: 'a,b', per_page: 50 });
		expect(calls[0]).toMatchObject({
			method: 'GET',
			url: '/accounts/acc/documents',
			config: {
				params: { status: 'pending_signature', method: 'virtual', tags: 'a,b', 'per-page': 50 },
			},
		});
	});

	it('covers document tag attach and detach endpoints', async () => {
		const calls: CapturedCall[] = [];
		const docs = new DocumentResource(mockHttp(calls), 'acc');
		await docs.replaceTags('doc1', []);
		await docs.addTags('doc1', ['Legal']);
		await docs.detachTag('doc1', 'tag1');
		expect(calls.map((c) => [c.method, c.url, c.body])).toEqual([
			['PUT', '/accounts/acc/documents/doc1/tags', { tags: [] }],
			['POST', '/accounts/acc/documents/doc1/tags', { tags: ['Legal'] }],
			['DELETE', '/accounts/acc/documents/doc1/tags/tag1', undefined],
		]);
	});

	it('rejects empty tag append arrays and missing download IDs', async () => {
		const docs = new DocumentResource(mockHttp(), 'acc');
		await expect(docs.addTags('doc1', [])).rejects.toThrow(ValidationError);
		await expect(docs.download('')).rejects.toThrow(ValidationError);
	});
});

describe('SignerResource', () => {
	let calls: CapturedCall[];
	let signers: SignerResource;

	beforeEach(() => {
		calls = [];
		signers = new SignerResource(mockHttp(calls), 'acc');
	});

	it('validates signer creation inputs', async () => {
		await expect(signers.create({ full_name: 'No Contact' })).rejects.toThrow(ValidationError);
		await expect(signers.create({ full_name: 'Bad Email', email: 'not-email' })).rejects.toThrow(
			ValidationError,
		);
	});

	it('creates WhatsApp-only signers without an email lookup', async () => {
		await signers.create({ full_name: 'Ana', whatsapp_phone_number: '+5548999990000' });
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({
			method: 'POST',
			url: '/accounts/acc/signers',
			body: { full_name: 'Ana', whatsapp_phone_number: '+5548999990000' },
		});
	});

	it('strips non-digits from CPF before sending', async () => {
		await signers.create({ full_name: 'Ana', email: 'ana@example.com', cpf: '390.533.447-05' });
		expect(calls.at(-1)?.body).toMatchObject({ cpf: '39053344705' });
	});
});

describe('TagResource', () => {
	it('covers list, create, update, and forced delete', async () => {
		const calls: CapturedCall[] = [];
		const tags = new TagResource(mockHttp(calls), 'acc');
		await tags.list({ search: 'contract' });
		await tags.create({ name: 'Contracts', color: 'ff8800' });
		await tags.update('tag1', { color: null });
		await tags.delete('tag1', { force: true });
		expect(calls).toMatchObject([
			{ method: 'GET', url: '/accounts/acc/tags', config: { params: { search: 'contract' } } },
			{ method: 'POST', url: '/accounts/acc/tags', body: { name: 'Contracts', color: 'ff8800' } },
			{ method: 'PUT', url: '/accounts/acc/tags/tag1', body: { color: null } },
			{ method: 'DELETE', url: '/accounts/acc/tags/tag1', config: { params: { force: 'true' } } },
		]);
	});

	it('requires a tag name and tag ID where documented', async () => {
		const tags = new TagResource(mockHttp(), 'acc');
		await expect(tags.create({ name: '' })).rejects.toThrow(ValidationError);
		await expect(tags.delete('')).rejects.toThrow(ValidationError);
	});
});

describe('FieldsResource', () => {
	it('validates create input and signer-code validation params', async () => {
		const calls: CapturedCall[] = [];
		const fields = new FieldsResource(mockHttp(calls), 'acc');
		await expect(fields.create({ type: '', name: 'x' } as never)).rejects.toThrow(
			ValidationError,
		);
		await fields.validate('field1', '400.676.228-36', { signerAccessCode: 'code-1' });
		expect(calls[0]).toMatchObject({
			method: 'POST',
			url: '/accounts/acc/fields/field1/validate',
			body: { value: '400.676.228-36' },
			config: { params: { 'signer-access-code': 'code-1' } },
		});
	});

	it('validates multiple values and lists field types', async () => {
		const calls: CapturedCall[] = [];
		const fields = new FieldsResource(mockHttp(calls), 'acc');
		await expect(fields.validateMultiple([])).rejects.toThrow(ValidationError);
		await fields.validateMultiple([{ field_id: 'f1', value: 'x' }], { signerAccessCode: 'code-1' });
		await fields.listTypes();
		expect(calls.map((c) => [c.method, c.url])).toEqual([
			['POST', '/accounts/acc/fields/validate-multiple'],
			['GET', '/field-types'],
		]);
	});
});

describe('TemplateResource', () => {
	it('covers list and single-template lookup', async () => {
		const calls: CapturedCall[] = [];
		const templates = new TemplateResource(mockHttp(calls), 'acc');
		await templates.list({ search: 'contract', per_page: 10 });
		await templates.get('template1');
		expect(calls).toMatchObject([
			{
				method: 'GET',
				url: '/accounts/acc/templates',
				config: { params: { search: 'contract', 'per-page': 10 } },
			},
			{ method: 'GET', url: '/accounts/acc/templates/template1' },
		]);
	});
});

describe('WebhookResource', () => {
	it('registers default event subscriptions and lists dispatches with pagination meta', async () => {
		const calls: CapturedCall[] = [];
		const http = {
			...mockHttp(calls),
			get: async (url: string, config?: CapturedCall['config']) => {
				calls.push({ method: 'GET', url, config });
				return ok([], {
					'x-pagination-current-page': '1',
					'x-pagination-per-page': '20',
					'x-pagination-total-count': '2',
					'x-pagination-page-count': '1',
				});
			},
		} as unknown as AxiosInstance;
		const webhooks = new WebhookResource(http, 'acc');
		await webhooks.register({ url: 'https://example.com/hook', email: 'ops@example.com' });
		const dispatches = await webhooks.listDispatches({ delivered: false, per_page: 20 });
		expect(calls[0]?.body).toMatchObject({
			events: [
				'document_ready',
				'document_prepared',
				'signer_signed_document',
				'signer_rejected_document',
				'document_processing_failed',
			],
			is_active: true,
		});
		expect(calls[1]).toMatchObject({
			method: 'GET',
			url: '/accounts/acc/webhooks',
			config: { params: { delivered: false, 'per-page': 20 } },
		});
		expect(dispatches.meta).toEqual({ current_page: 1, per_page: 20, total: 2, last_page: 1 });
	});

	it('requires dispatch IDs for retries', async () => {
		const webhooks = new WebhookResource(mockHttp(), 'acc');
		await expect(webhooks.retryDispatch('')).rejects.toThrow(ValidationError);
	});
});

describe('SignerDocumentsResource', () => {
	it('passes signer-access-code for signer document list and signature upload', async () => {
		const calls: CapturedCall[] = [];
		const signerDocs = new SignerDocumentsResource(mockHttp(calls));
		await signerDocs.list('signer1', 'code-1', { search: 'contract' });
		await signerDocs.uploadSignature('code-1', Buffer.from([1, 2, 3]));
		expect(calls).toMatchObject([
			{
				method: 'GET',
				url: '/signers/signer1/documents',
				config: { params: { 'signer-access-code': 'code-1', search: 'contract' } },
			},
			{
				method: 'POST',
				url: '/signature',
				config: {
					params: { 'signer-access-code': 'code-1', type: 'signature' },
					headers: { 'Content-Type': 'image/png' },
				},
			},
		]);
	});

	it('validates signer-side bulk/sign/decline inputs', async () => {
		const signerDocs = new SignerDocumentsResource(mockHttp());
		await expect(signerDocs.getCurrent('', 'code')).rejects.toThrow(ValidationError);
		await expect(signerDocs.signMultiple([], 'code')).rejects.toThrow(ValidationError);
		await expect(signerDocs.sign('doc', 'assignment', 'code', [])).rejects.toThrow(ValidationError);
		await expect(signerDocs.decline('doc', 'assignment', 'code', '')).rejects.toThrow(
			ValidationError,
		);
	});
});

describe('AssignmentResource', () => {
	it('posts normalised assignment payloads and estimation payloads', async () => {
		const calls: CapturedCall[] = [];
		const assignments = new AssignmentResource(mockHttp(calls), 'acc');
		await assignments.create('doc1', { signers: ['signer1'] });
		await assignments.estimateCost('doc1', { signers: [{ verification_method: 'Whatsapp' }] });
		expect(calls).toMatchObject([
			{
				method: 'POST',
				url: '/documents/doc1/assignments',
				body: { method: 'virtual', signers: [{ id: 'signer1' }] },
			},
			{
				method: 'POST',
				url: '/documents/doc1/assignments/estimate-cost',
				body: { method: 'virtual', signers: [{ verification_method: 'Whatsapp' }] },
			},
		]);
	});

	it('validates required IDs for resend operations', async () => {
		const withAccount = new AssignmentResource(mockHttp(), 'acc');
		await expect(withAccount.resendNotification('', 'assignment', 'signer')).rejects.toThrow(
			ValidationError,
		);
		await expect(withAccount.resendNotification('doc', '', 'signer')).rejects.toThrow(
			ValidationError,
		);
		await expect(withAccount.resendNotification('doc', 'assignment', '')).rejects.toThrow(
			ValidationError,
		);
	});
});

describe('WorkspaceResource', () => {
	it('validates workspace IDs for get/update/delete', async () => {
		const workspaces = new WorkspaceResource(mockHttp());
		await expect(workspaces.get('')).rejects.toThrow(ValidationError);
		await expect(workspaces.update('', { name: 'Updated' })).rejects.toThrow(ValidationError);
		await expect(workspaces.delete('')).rejects.toThrow(ValidationError);
	});
});
