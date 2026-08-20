import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, ValidationError } from '../errors';
import { AssignmentResource, buildAssignmentPayload } from './assignments';
import { AuthenticationResource } from './authentication';
import { DocumentResource } from './documents';
import { FieldsResource } from './fields';
import { SignerDocumentsResource } from './signer-documents';
import { SignerResource } from './signers';
import { TagResource } from './tags';
import { TemplateResource } from './templates';
import { UsersResource } from './users';
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

function statusOk() {
	return { status: 200, data: { status: 200, message: '' }, headers: {} };
}

function mockHttp(calls: CapturedCall[] = []): AxiosInstance {
	return {
		get: async (url: string, config?: CapturedCall['config']) => {
			calls.push({ method: 'GET', url, config });
			return ok([]);
		},
		post: async (url: string, body?: unknown, config?: CapturedCall['config']) => {
			calls.push({ method: 'POST', url, body, config });
			if (url === '/verify' || url === '/signature' || url === '/auth/link-social-login') {
				return statusOk();
			}
			if (/\/accounts\/[^/]+\/logo$/.test(url)) return statusOk();
			return ok({ id: 'created' });
		},
		put: async (url: string, body?: unknown, config?: CapturedCall['config']) => {
			calls.push({ method: 'PUT', url, body, config });
			if (url === '/signers/accept-terms') return statusOk();
			return ok({ id: 'updated' });
		},
		patch: async (url: string, body?: unknown, config?: CapturedCall['config']) => {
			calls.push({ method: 'PATCH', url, body, config });
			return ok({ id: 'renamed', ...(body as Record<string, unknown>) });
		},
		delete: async (url: string, config?: CapturedCall['config']) => {
			calls.push({ method: 'DELETE', url, config });
			if (/\/accounts\/[^/]+\/logo$/.test(url)) return statusOk();
			const data = /\/documents\/[^/]+\/tags\//.test(url)
				? { detached: true }
				: /\/tags\/[^/]+$/.test(url)
					? { deleted: true }
					: [];
			return ok(data);
		},
	} as unknown as AxiosInstance;
}

describe('documented delete responses', () => {
	it('returns the unwrapped empty data array instead of discarding it', async () => {
		const http = mockHttp();
		await expect(new DocumentResource(http).delete('doc')).resolves.toEqual([]);
		await expect(new FieldsResource(http, 'acc').delete('field')).resolves.toEqual([]);
		await expect(new SignerResource(http, 'acc').delete('signer')).resolves.toEqual([]);
		await expect(new WorkspaceResource(http).delete('acc')).resolves.toEqual([]);
		await expect(new AuthenticationResource(http).deleteApiKey()).resolves.toEqual([]);
	});
});

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
		expect(() => buildAssignmentPayload({ signers: ['a'], signer_ids: ['b'] })).toThrow(
			'Provide only one',
		);
	});
});

describe('DocumentResource', () => {
	it('rejects oversized file paths before reading them into memory', async () => {
		const directory = await fs.mkdtemp(path.join(tmpdir(), 'assinafy-upload-test-'));
		const filePath = path.join(directory, 'oversized.pdf');
		await fs.writeFile(filePath, '%PDF-1.7');
		await fs.truncate(filePath, 25 * 1024 * 1024 + 1);
		const readFile = vi.spyOn(fs, 'readFile');
		try {
			await expect(new DocumentResource(mockHttp()).upload({ filePath })).rejects.toThrow(
				'File size exceeds',
			);
			expect(readFile).not.toHaveBeenCalled();
		} finally {
			readFile.mockRestore();
			await fs.rm(directory, { recursive: true, force: true });
		}
	});

	it('supports both the published and live-compatible public token payloads', async () => {
		const calls: CapturedCall[] = [];
		const docs = new DocumentResource(mockHttp(calls));
		await docs.sendToken('doc1', { email: 'signer@example.com' });
		await docs.sendToken('doc1', '+5548999990000', 'whatsapp');
		expect(calls).toMatchObject([
			{
				method: 'PUT',
				url: '/public/documents/doc1/send-token',
				body: { email: 'signer@example.com' },
			},
			{
				method: 'PUT',
				url: '/public/documents/doc1/send-token',
				body: { recipient: '+5548999990000', channel: 'whatsapp' },
			},
		]);
	});

	it('preserves the published status-only send-token response', async () => {
		const http = {
			...mockHttp(),
			put: async () => ({ status: 200, data: { status: 200, message: '' } }),
		} as unknown as AxiosInstance;
		const docs = new DocumentResource(http);
		await expect(docs.sendToken('doc1', { email: 'signer@example.com' })).resolves.toEqual({
			status: 200,
			message: '',
		});
	});

	it('keeps the document display name separate from the source PDF file name', async () => {
		const calls: CapturedCall[] = [];
		const docs = new DocumentResource(mockHttp(calls), 'acc');
		await docs.upload(
			{ buffer: Buffer.from('%PDF-1.7'), fileName: 'contract.pdf' },
			{ name: 'Contract' },
		);

		const form = calls[0]?.body as FormData;
		expect(form.get('name')).toBe('Contract');
		expect((form.get('file') as Blob & { name: string }).name).toBe('contract.pdf');
	});

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
		expect(await docs.detachTag('doc1', 'tag1')).toEqual({ detached: true });
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
		await expect(docs.download('doc1', '../original' as never)).rejects.toThrow(ValidationError);
	});

	it('fails loud on an unrecognised list response shape instead of returning an empty list', async () => {
		const http = {
			...mockHttp(),
			get: async () => ok({ items: ['unexpected-shape'] }),
		} as unknown as AxiosInstance;
		const docs = new DocumentResource(http, 'acc');
		await expect(docs.list()).rejects.toThrow(ValidationError);
	});

	it('searches documents against the dedicated search endpoint', async () => {
		const calls: CapturedCall[] = [];
		const docs = new DocumentResource(mockHttp(calls), 'acc');
		await docs.search({ search: 'contract', status: 'pending_signature', per_page: 5 });
		expect(calls[0]).toMatchObject({
			method: 'GET',
			url: '/accounts/acc/documents/search',
			config: { params: { search: 'contract', status: 'pending_signature', 'per-page': 5 } },
		});
	});

	it('renames a document via PATCH and rejects a blank name', async () => {
		const calls: CapturedCall[] = [];
		const docs = new DocumentResource(mockHttp(calls), 'acc');
		await docs.rename('doc1', 'New Name.pdf');
		expect(calls[0]).toMatchObject({
			method: 'PATCH',
			url: '/documents/doc1',
			body: { name: 'New Name.pdf' },
		});
		await expect(docs.rename('doc1', '   ')).rejects.toThrow(ValidationError);
	});

	it('waitUntilReady surfaces a 4xx error immediately instead of masking it as a timeout', async () => {
		const http = {
			...mockHttp(),
			get: async () => {
				throw new ApiError('not found', 404);
			},
		} as unknown as AxiosInstance;
		const docs = new DocumentResource(http, 'acc');
		await expect(
			docs.waitUntilReady('doc1', { maxWaitMs: 10_000, pollIntervalMs: 50 }),
		).rejects.toBeInstanceOf(ApiError);
	});

	it('waitUntilReady keeps retrying transient 5xx errors until it times out', async () => {
		const http = {
			...mockHttp(),
			get: async () => {
				throw new ApiError('service unavailable', 503);
			},
		} as unknown as AxiosInstance;
		const docs = new DocumentResource(http, 'acc');
		await expect(
			docs.waitUntilReady('doc1', { maxWaitMs: 40, pollIntervalMs: 10 }),
		).rejects.toThrow(/Timeout/);
	});

	it('caps polling sleep at the deadline and validates timing options', async () => {
		vi.useFakeTimers();
		try {
			const http = {
				...mockHttp(),
				get: async () => ok({ status: 'processing' }),
			} as unknown as AxiosInstance;
			const docs = new DocumentResource(http, 'acc');
			const pending = docs.waitUntilReady('doc1', {
				maxWaitMs: 100,
				pollIntervalMs: 60_000,
			});
			const timedOut = expect(pending).rejects.toThrow(/Timeout/);
			await vi.advanceTimersByTimeAsync(100);
			await timedOut;
			await expect(docs.waitUntilReady('doc1', { maxWaitMs: 0 })).rejects.toThrow(ValidationError);
			await expect(docs.waitUntilReady('doc1', { pollIntervalMs: Number.NaN })).rejects.toThrow(
				ValidationError,
			);
		} finally {
			vi.useRealTimers();
		}
	});

	it('caps each status request at the remaining wait deadline', async () => {
		vi.useFakeTimers();
		try {
			const timeouts: number[] = [];
			const http = {
				...mockHttp(),
				get: async (_url: string, config?: { timeout?: number }) => {
					const timeout = config?.timeout ?? 30_000;
					timeouts.push(timeout);
					await new Promise((_, reject) =>
						setTimeout(() => reject({ isAxiosError: true, message: 'timeout' }), timeout),
					);
				},
			} as unknown as AxiosInstance;
			const pending = new DocumentResource(http, 'acc').waitUntilReady('doc1', {
				maxWaitMs: 100,
				pollIntervalMs: 1_000,
			});
			const timedOut = expect(pending).rejects.toThrow(/Timeout/);
			await vi.advanceTimersByTimeAsync(100);
			await timedOut;
			expect(timeouts).toEqual([100]);
		} finally {
			vi.useRealTimers();
		}
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
		await expect(signers.create({ full_name: 'Bad Email', email: 'not-email' })).rejects.toThrow(
			ValidationError,
		);
	});

	it('creates the documented full-name-only signer', async () => {
		await signers.create({ full_name: 'No Contact' });
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({
			method: 'POST',
			url: '/accounts/acc/signers',
			body: { full_name: 'No Contact' },
		});
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

	it('omits an all-punctuation CPF instead of sending an empty string', async () => {
		await signers.create({ full_name: 'Ana', whatsapp_phone_number: '+5548999990000', cpf: '---' });
		expect(calls.at(-1)?.body).not.toHaveProperty('cpf');
	});

	it('normalises the legacy CPF update alias to the official government_id key', async () => {
		await signers.update('signer1', { cpf: '390.533.447-05' });
		expect(calls.at(-1)).toMatchObject({
			method: 'PUT',
			url: '/accounts/acc/signers/signer1',
			body: { government_id: '39053344705' },
		});
		expect(calls.at(-1)?.body).not.toHaveProperty('cpf');
	});

	it('is idempotent by email: reuses an existing signer without a second POST', async () => {
		const captured: CapturedCall[] = [];
		const logged: unknown[] = [];
		const logger = {
			debug: () => undefined,
			info: (_message: string, context?: Record<string, unknown>) => logged.push(context),
			warn: () => undefined,
			error: () => undefined,
		};
		const http = {
			...mockHttp(captured),
			get: async (url: string, config?: CapturedCall['config']) => {
				captured.push({ method: 'GET', url, config });
				return ok([{ id: 'existing', full_name: 'Ana', email: 'ana@example.com' }]);
			},
		} as unknown as AxiosInstance;
		const resource = new SignerResource(http, 'acc', logger);
		const created = await resource.create({ full_name: 'Ana', email: 'ana@example.com' });
		expect(created.id).toBe('existing');
		expect(captured.some((c) => c.method === 'POST')).toBe(false);
		expect(JSON.stringify(logged)).not.toContain('ana@example.com');
		expect(logged).toContainEqual({ signerId: 'existing' });
	});
});

describe('TagResource', () => {
	it('covers list, create, update, and forced delete', async () => {
		const calls: CapturedCall[] = [];
		const tags = new TagResource(mockHttp(calls), 'acc');
		await tags.list({ search: 'contract' });
		await tags.create({ name: 'Contracts', color: 'ff8800' });
		await tags.update('tag1', { color: null });
		expect(await tags.delete('tag1', { force: true })).toEqual({ deleted: true });
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
		await expect(fields.create({ type: '', name: 'x' } as never)).rejects.toThrow(ValidationError);
		await fields.validate('field1', '400.676.228-36', { signerAccessCode: 'code-1' });
		expect(calls[0]).toMatchObject({
			method: 'POST',
			url: '/accounts/acc/fields/field1/validate',
			body: { value: '400.676.228-36' },
			config: {
				params: { 'signer-access-code': 'code-1' },
				headers: { Authorization: undefined, 'X-Api-Key': undefined },
			},
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
	it('downloads a template page as a Buffer from the 4-segment path', async () => {
		const calls: CapturedCall[] = [];
		const bytes = new Uint8Array([1, 2, 3, 4]);
		const http = {
			...mockHttp(),
			get: async (url: string, config?: CapturedCall['config']) => {
				calls.push({ method: 'GET', url, config });
				return { status: 200, data: bytes.buffer, headers: {} };
			},
		} as unknown as AxiosInstance;
		const templates = new TemplateResource(http, 'acc');
		const buffer = await templates.downloadPage('t1', 'p1');
		expect(calls[0]).toMatchObject({
			method: 'GET',
			url: '/accounts/acc/templates/t1/pages/p1/download',
			config: { responseType: 'arraybuffer' },
		});
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect([...buffer]).toEqual([1, 2, 3, 4]);
	});

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

	it('rejects sort values the live endpoint ignores', async () => {
		const templates = new TemplateResource(mockHttp(), 'acc');
		await expect(templates.list({ sort: 'created_at' as never })).rejects.toThrow(ValidationError);
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

	it('respects an explicit empty events array instead of substituting the defaults', async () => {
		const calls: CapturedCall[] = [];
		const logged: unknown[] = [];
		const webhooks = new WebhookResource(mockHttp(calls), 'acc', {
			debug: () => undefined,
			info: (_message, context) => logged.push(context),
			warn: () => undefined,
			error: () => undefined,
		});
		await webhooks.register({
			url: 'https://user:secret@example.com/hook?token=callback-secret',
			email: 'ops@example.com',
			events: [],
		});
		expect(calls[0]?.body).toMatchObject({ events: [] });
		expect(JSON.stringify(logged)).not.toContain('callback-secret');
		expect(JSON.stringify(logged)).not.toContain('https://');
		expect(logged).toContainEqual({ eventCount: 0 });
	});

	it('requires dispatch IDs for retries', async () => {
		const webhooks = new WebhookResource(mockHttp(), 'acc');
		await expect(webhooks.retryDispatch('')).rejects.toThrow(ValidationError);
	});

	it('rejects ignored dispatch search and unsupported sort values', async () => {
		const webhooks = new WebhookResource(mockHttp(), 'acc');
		await expect(webhooks.listDispatches({ search: 'ignored' } as never)).rejects.toThrow(
			ValidationError,
		);
		await expect(webhooks.listDispatches({ sort: 'event' as never })).rejects.toThrow(
			ValidationError,
		);
	});
});

describe('SignerDocumentsResource', () => {
	it('preflights signer artifact downloads through a protected identity route', async () => {
		const calls: CapturedCall[] = [];
		const bytes = new Uint8Array([1, 2, 3]);
		const http = {
			...mockHttp(),
			get: async (url: string, config?: CapturedCall['config']) => {
				calls.push({ method: 'GET', url, config });
				if (url === '/signers/self') {
					return ok({ id: 'signer1' });
				}
				return { status: 200, data: bytes.buffer, headers: {} };
			},
		} as unknown as AxiosInstance;
		const signerDocs = new SignerDocumentsResource(http);
		await expect(signerDocs.download('signer1', 'doc1', 'original', 'code-1')).resolves.toEqual(
			Buffer.from(bytes),
		);
		expect(calls).toMatchObject([
			{
				method: 'GET',
				url: '/signers/self',
				config: { params: { 'signer-access-code': 'code-1' } },
			},
			{
				method: 'GET',
				url: '/signers/signer1/documents/doc1/download/original',
				config: {
					responseType: 'arraybuffer',
					params: { 'signer-access-code': 'code-1' },
				},
			},
		]);
	});

	it('rejects a signer artifact download when the access code belongs to another signer', async () => {
		const http = {
			...mockHttp(),
			get: async () => ok({ id: 'other-signer' }),
		} as unknown as AxiosInstance;
		await expect(
			new SignerDocumentsResource(http).download('signer1', 'doc1', 'original', 'code-1'),
		).rejects.toThrow(/does not match/);
	});

	it('rejects signer artifact and image path traversal before requesting it', async () => {
		const calls: CapturedCall[] = [];
		const signerDocs = new SignerDocumentsResource(mockHttp(calls));
		await expect(
			signerDocs.download('signer1', 'doc1', '../original' as never, 'code-1'),
		).rejects.toThrow(ValidationError);
		await expect(signerDocs.downloadSignature('code-1', '../signature' as never)).rejects.toThrow(
			ValidationError,
		);
		await expect(
			signerDocs.uploadSignature('code-1', Buffer.from('png'), {
				imageType: '../signature' as never,
			}),
		).rejects.toThrow(ValidationError);
		expect(calls).toHaveLength(0);
	});

	it('passes signer-access-code for signer document list and signature upload', async () => {
		const calls: CapturedCall[] = [];
		const signerDocs = new SignerDocumentsResource(mockHttp(calls));
		await signerDocs.list('signer1', 'code-1', { search: 'contract' });
		await expect(signerDocs.uploadSignature('code-1', Buffer.from([1, 2, 3]))).resolves.toEqual({
			status: 200,
			message: '',
		});
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

	it('sends the access code as a query param for accept-terms (not the body)', async () => {
		const calls: CapturedCall[] = [];
		const signerDocs = new SignerDocumentsResource(mockHttp(calls));
		await expect(signerDocs.acceptTerms('code-1')).resolves.toEqual({ status: 200, message: '' });
		expect(calls[0]).toMatchObject({
			method: 'PUT',
			url: '/signers/accept-terms',
			body: undefined,
			config: { params: { 'signer-access-code': 'code-1' } },
		});
	});

	it('sends documented confirm-data body fields and the reuse signature flag', async () => {
		const calls: CapturedCall[] = [];
		const signerDocs = new SignerDocumentsResource(mockHttp(calls));
		await signerDocs.confirmData('doc1', 'code-1', {
			full_name: 'Ana Lima',
			government_id: '39053344705',
		});
		await signerDocs.uploadSignature('code-1', Buffer.from([1]), { reuse: true });
		expect(calls[0]).toMatchObject({
			method: 'PUT',
			url: '/documents/doc1/signers/confirm-data',
			body: { full_name: 'Ana Lima', government_id: '39053344705' },
			config: { params: { 'signer-access-code': 'code-1' } },
		});
		expect(calls[1]?.config?.params).toMatchObject({
			'signer-access-code': 'code-1',
			type: 'signature',
			reuse: true,
		});
	});

	it('searches signer documents with the access code and query', async () => {
		const calls: CapturedCall[] = [];
		const signerDocs = new SignerDocumentsResource(mockHttp(calls));
		await signerDocs.search('signer1', 'contract', 'code-1');
		expect(calls[0]).toMatchObject({
			method: 'GET',
			url: '/signers/signer1/documents/search',
			config: { params: { 'signer-access-code': 'code-1', search: 'contract' } },
		});
	});

	it('sends signer access code in the query when verifying an OTP', async () => {
		const calls: CapturedCall[] = [];
		const signerDocs = new SignerDocumentsResource(mockHttp(calls));
		await expect(
			signerDocs.verifyEmail({ signerAccessCode: 'code-1', verificationCode: '123456' }),
		).resolves.toEqual({ status: 200, message: '' });
		expect(calls[0]).toMatchObject({
			method: 'POST',
			url: '/verify',
			body: { 'verification-code': '123456' },
			config: { params: { 'signer-access-code': 'code-1' } },
		});
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

	it('lists account assignments via the camelCase accountId query param', async () => {
		const calls: CapturedCall[] = [];
		const assignments = new AssignmentResource(mockHttp(calls), 'acc');
		await assignments.list({ per_page: 10 });
		expect(calls[0]).toMatchObject({
			method: 'GET',
			url: '/assignments',
			config: { params: { accountId: 'acc', 'per-page': 10 } },
		});
		await assignments.list({ accountId: 'untrusted' });
		expect(calls[1]?.config?.params).toMatchObject({ accountId: 'acc' });
	});

	it('accepts only valid assignment expirations and preserves an explicit clear', async () => {
		const calls: CapturedCall[] = [];
		const assignments = new AssignmentResource(mockHttp(calls), 'acc');
		await assignments.resetExpiration('doc1', 'assignment1', null);
		expect(calls[0]).toMatchObject({
			method: 'PUT',
			body: { expires_at: null },
		});
		await expect(assignments.resetExpiration('doc1', 'assignment1', 'tomorrow')).rejects.toThrow(
			/ISO 8601/,
		);
		expect(() =>
			buildAssignmentPayload({ signers: ['signer1'], expires_at: '2026-99-99T99:99:99Z' }),
		).toThrow(/ISO 8601/);
		expect(calls).toHaveLength(1);
	});

	it('rejects ignored assignment search, unsupported sort, and unsafe IDs', async () => {
		const calls: CapturedCall[] = [];
		const assignments = new AssignmentResource(mockHttp(calls), 'acc');
		await expect(assignments.list({ search: 'ignored' } as never)).rejects.toThrow(ValidationError);
		await expect(assignments.list({ sort: 'name' as never })).rejects.toThrow(ValidationError);
		await expect(
			assignments.create('../accounts/victim', { signers: ['signer1'] }),
		).rejects.toThrow(ValidationError);
		await expect(new AssignmentResource(mockHttp(calls), '../victim').list()).rejects.toThrow(
			ValidationError,
		);
		expect(calls).toHaveLength(0);
	});

	it('estimates cost for a collect assignment with no signers', async () => {
		const calls: CapturedCall[] = [];
		const assignments = new AssignmentResource(mockHttp(calls), 'acc');
		await assignments.estimateCost('doc1', { method: 'collect' });
		expect(calls[0]).toMatchObject({
			method: 'POST',
			url: '/documents/doc1/assignments/estimate-cost',
			body: { method: 'collect', signers: [] },
		});
	});
});

describe('WorkspaceResource', () => {
	it('covers theme, logo upload/delete, and daily statistics', async () => {
		const calls: CapturedCall[] = [];
		const workspaces = new WorkspaceResource(mockHttp(calls));
		await workspaces.getTheme('acc');
		await expect(
			workspaces.uploadLogo('acc', Buffer.from([1, 2, 3]), {
				fileName: 'brand.webp',
				contentType: 'image/webp',
			}),
		).resolves.toEqual({ status: 200, message: '' });
		await expect(workspaces.deleteLogo('acc')).resolves.toEqual({ status: 200, message: '' });
		await workspaces.stats('acc', { granularity: 'daily', month: '2026-08' });

		expect(calls[0]).toMatchObject({ method: 'GET', url: '/accounts/acc/theme' });
		expect(calls[1]).toMatchObject({
			method: 'POST',
			url: '/accounts/acc/logo',
			config: { headers: { 'Content-Type': 'multipart/form-data' } },
		});
		const logoForm = calls[1]?.body;
		expect(logoForm).toBeInstanceOf(FormData);
		const logo = (logoForm as FormData).get('file') as Blob & { name: string };
		expect(logo.name).toBe('brand.webp');
		expect(logo.type).toBe('image/webp');
		expect(calls[2]).toMatchObject({ method: 'DELETE', url: '/accounts/acc/logo' });
		expect(calls[3]).toMatchObject({
			method: 'GET',
			url: '/accounts/acc/stats',
			config: { params: { granularity: 'daily', month: '2026-08' } },
		});
	});

	it('downloads a logo as a Buffer', async () => {
		const calls: CapturedCall[] = [];
		const bytes = new Uint8Array([1, 2, 3]);
		const http = {
			...mockHttp(),
			get: async (url: string, config?: CapturedCall['config']) => {
				calls.push({ method: 'GET', url, config });
				return { status: 200, data: bytes.buffer, headers: {} };
			},
		} as unknown as AxiosInstance;
		const workspaces = new WorkspaceResource(http);
		await expect(workspaces.downloadLogo('acc')).resolves.toEqual(Buffer.from(bytes));
		expect(calls[0]).toMatchObject({
			method: 'GET',
			url: '/accounts/acc/logo',
			config: { responseType: 'arraybuffer' },
		});
	});

	it('preserves the nullable logo returned by an unbranded workspace theme', async () => {
		const theme = {
			account_name: 'Workspace',
			primary_color: '2072b9',
			secondary_color: 'ffffff',
			logo: null,
		};
		const http = { ...mockHttp(), get: async () => ok(theme) } as unknown as AxiosInstance;
		await expect(new WorkspaceResource(http).getTheme('acc')).resolves.toEqual(theme);
	});

	it('validates logo data and daily statistics month', async () => {
		const workspaces = new WorkspaceResource(mockHttp());
		await expect(workspaces.uploadLogo('acc', Buffer.alloc(0))).rejects.toThrow(ValidationError);
		await expect(workspaces.stats('acc', { granularity: 'daily' })).rejects.toThrow(
			ValidationError,
		);
		await expect(
			workspaces.stats('acc', { granularity: 'daily', month: '2026-13' }),
		).rejects.toThrow(ValidationError);
	});

	it('validates workspace IDs for get/update/delete', async () => {
		const workspaces = new WorkspaceResource(mockHttp());
		await expect(
			workspaces.create({ name: 'Workspace', notification_sender_type: 'Invalid' as 'User' }),
		).rejects.toThrow(ValidationError);
		await expect(workspaces.get('')).rejects.toThrow(ValidationError);
		await expect(workspaces.update('', { name: 'Updated' })).rejects.toThrow(ValidationError);
		await expect(workspaces.delete('')).rejects.toThrow(ValidationError);
	});

	it('requires a name on create', async () => {
		const workspaces = new WorkspaceResource(mockHttp());
		await expect(workspaces.create({ name: '' })).rejects.toThrow(ValidationError);
	});
});

describe('AuthenticationResource', () => {
	it('links a Google identity to the authenticated user', async () => {
		const calls: CapturedCall[] = [];
		const auth = new AuthenticationResource(mockHttp(calls));
		await expect(
			auth.linkSocialLogin({ provider: 'google', token: 'provider-token' }),
		).resolves.toEqual({ status: 200, message: '' });
		expect(calls[0]).toMatchObject({
			method: 'POST',
			url: '/auth/link-social-login',
			body: { provider: 'google', token: 'provider-token' },
		});
		await expect(
			auth.linkSocialLogin({ provider: 'github' as 'google', token: 'provider-token' }),
		).rejects.toThrow(ValidationError);
	});

	it('returns the masked API key when one exists', async () => {
		const http = {
			...mockHttp(),
			get: async () => ok({ api_key: 'sk_live_****abcd' }),
		} as unknown as AxiosInstance;
		const auth = new AuthenticationResource(http);
		await expect(auth.getApiKey()).resolves.toEqual({ api_key: 'sk_live_****abcd' });
	});

	it('resolves to null (not throw) when no key has been generated (404)', async () => {
		const http = {
			...mockHttp(),
			get: async () => {
				throw new ApiError('not found', 404);
			},
		} as unknown as AxiosInstance;
		const auth = new AuthenticationResource(http);
		await expect(auth.getApiKey()).resolves.toBeNull();
	});
});

describe('UsersResource', () => {
	it('covers self, stats, and notification-preference endpoints', async () => {
		const calls: CapturedCall[] = [];
		const users = new UsersResource(mockHttp(calls));
		await users.self();
		await users.stats({ granularity: 'monthly' });
		await users.getNotificationPreferences();
		await users.updateNotificationPreferences({ DocumentCompleted: false });

		expect(calls).toMatchObject([
			{ method: 'GET', url: '/users/self' },
			{ method: 'GET', url: '/users/self/stats', config: { params: { granularity: 'monthly' } } },
			{ method: 'GET', url: '/users/self/notification-preferences' },
			{
				method: 'PUT',
				url: '/users/self/notification-preferences',
				body: { DocumentCompleted: false },
			},
		]);
	});

	it('preserves the sandbox login-style self response', async () => {
		const liveShape = {
			user: { id: 'user1', name: 'Ana', email: 'ana@example.com' },
			accounts: [],
		};
		const http = { ...mockHttp(), get: async () => ok(liveShape) } as unknown as AxiosInstance;
		await expect(new UsersResource(http).self()).resolves.toEqual(liveShape);
	});

	it('rejects empty, unknown, and non-boolean notification preference updates', async () => {
		const users = new UsersResource(mockHttp());
		await expect(users.updateNotificationPreferences({})).rejects.toThrow(ValidationError);
		await expect(users.updateNotificationPreferences({ Unknown: true } as never)).rejects.toThrow(
			ValidationError,
		);
		await expect(
			users.updateNotificationPreferences({ DocumentCompleted: 'yes' } as never),
		).rejects.toThrow(ValidationError);
	});
});
