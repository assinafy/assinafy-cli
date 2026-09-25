import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AssinafyClient } from './client';

type Case = [
	operation: string,
	invoke: (client: AssinafyClient) => Promise<unknown>,
	body?: unknown,
	response?: 'list' | 'array' | 'binary' | 'status' | 'flat' | 'void',
	auth?: 'public' | 'signer',
];
const id = 'example-id';
const code = 'example-access-code';
const email = 'signer@example.com';
const assignment = { method: 'virtual' as const, signers: [{ id }] };
const template = { signers: [{ id, role_id: id }] };
const entries = [{ itemId: id, fieldId: id, pageId: id, value: 'Example' }];
const passwordChange = { email, password: 'example-secret', new_password: 'example-new-secret' };
const refresh = {
	grant_type: 'refresh_token' as const,
	client_id: id,
	refresh_token: 'example-refresh',
};
const webhook = {
	url: 'https://example.com/hook',
	email,
	events: ['document_ready'],
	is_active: true,
};
const image = Buffer.from('example-image');
const cases: Case[] = [
	['GET /v1/accounts/{accountId}', (c) => c.workspaces.get(id)],
	[
		'PUT /v1/accounts/{accountId}',
		(c) => c.workspaces.update(id, { name: 'Example' }),
		{ name: 'Example' },
	],
	[
		'DELETE /v1/accounts/{accountId}',
		(c) => c.workspaces.delete(id, { force: true }),
		{ force: true },
		'array',
	],
	['GET /v1/accounts/{accountId}/theme', (c) => c.workspaces.getTheme(id)],
	['GET /v1/accounts/{accountId}/logo', (c) => c.workspaces.downloadLogo(id), undefined, 'binary'],
	[
		'POST /v1/accounts/{accountId}/logo',
		(c) => c.workspaces.uploadLogo(id, image),
		'multipart',
		'status',
	],
	['DELETE /v1/accounts/{accountId}/logo', (c) => c.workspaces.deleteLogo(id), undefined, 'status'],
	['GET /v1/accounts', (c) => c.workspaces.list(), undefined, 'list'],
	['POST /v1/accounts', (c) => c.workspaces.create({ name: 'Example' }), { name: 'Example' }],
	[
		'GET /v1/documents/{documentId}/activities',
		(c) => c.documents.activities(id),
		undefined,
		'array',
	],
	['GET /v1/assignments', (c) => c.assignments.list(), undefined, 'list'],
	[
		'POST /v1/documents/{documentId}/assignments',
		(c) => c.assignments.create(id, assignment),
		assignment,
	],
	[
		'POST /v1/documents/{documentId}/assignments/estimate-cost',
		(c) => c.assignments.estimateCost(id, assignment),
		assignment,
	],
	[
		'PUT /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/resend',
		(c) => c.assignments.resendNotification(id, id, id),
	],
	[
		'POST /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/estimate-resend-cost',
		(c) => c.assignments.estimateResendCost(id, id, id),
	],
	[
		'PUT /v1/documents/{documentId}/assignments/{assignmentId}/reset-expiration',
		(c) => c.assignments.resetExpiration(id, id, null),
		{ expires_at: null },
	],
	[
		'POST /v1/login',
		(c) => c.auth.login(email, 'example-secret'),
		{ email, password: 'example-secret' },
		undefined,
		'public',
	],
	[
		'PUT /v1/authentication/request-password-reset',
		(c) => c.auth.requestPasswordReset(email),
		{ email },
		undefined,
		'public',
	],
	[
		'PUT /v1/authentication/reset-password',
		(c) => c.auth.resetPassword({ email, new_password: 'example-secret' }),
		{ email, new_password: 'example-secret' },
		undefined,
		'public',
	],
	[
		'PUT /v1/authentication/change-password',
		(c) => c.auth.changePassword(passwordChange),
		passwordChange,
	],
	['GET /v1/accounts/{accountId}/documents', (c) => c.documents.list(), undefined, 'list'],
	[
		'POST /v1/accounts/{accountId}/documents',
		(c) => c.documents.upload({ buffer: Buffer.from('%PDF-1.7\n'), fileName: 'example.pdf' }),
		'multipart',
	],
	[
		'GET /v1/accounts/{accountId}/documents/search',
		(c) => c.documents.search({ search: 'Example' }),
		undefined,
		'list',
	],
	['GET /v1/documents/statuses', (c) => c.documents.statuses(), undefined, 'array'],
	['GET /v1/documents/{documentId}', (c) => c.documents.details(id)],
	['DELETE /v1/documents/{documentId}', (c) => c.documents.delete(id), undefined, 'array'],
	[
		'PATCH /v1/documents/{documentId}',
		(c) => c.documents.rename(id, 'Example'),
		{ name: 'Example' },
	],
	[
		'GET /v1/documents/{documentId}/download/{artifactName}',
		(c) => c.documents.download(id, 'original'),
		undefined,
		'binary',
	],
	[
		'GET /v1/documents/{documentSignatureHash}/verify',
		(c) => c.documents.verify(id),
		undefined,
		undefined,
		'public',
	],
	[
		'GET /v1/accounts/{accountId}/documents/{documentId}/tags',
		(c) => c.documents.listTags(id),
		undefined,
		'array',
	],
	[
		'PUT /v1/accounts/{accountId}/documents/{documentId}/tags',
		(c) => c.documents.replaceTags(id, [id]),
		{ tags: [id] },
		'array',
	],
	[
		'POST /v1/accounts/{accountId}/documents/{documentId}/tags',
		(c) => c.documents.addTags(id, [id]),
		{ tags: [id] },
		'array',
	],
	[
		'DELETE /v1/accounts/{accountId}/documents/{documentId}/tags/{tagId}',
		(c) => c.documents.detachTag(id, id),
	],
	['GET /v1/accounts/{accountId}/fields', (c) => c.fields.list(), undefined, 'array'],
	[
		'POST /v1/accounts/{accountId}/fields',
		(c) => c.fields.create({ name: 'Example', type: 'text' }),
		{ name: 'Example', type: 'text' },
	],
	['GET /v1/accounts/{accountId}/fields/{fieldId}', (c) => c.fields.get(id)],
	[
		'PUT /v1/accounts/{accountId}/fields/{fieldId}',
		(c) => c.fields.update(id, { name: 'Example' }),
		{ name: 'Example' },
	],
	[
		'DELETE /v1/accounts/{accountId}/fields/{fieldId}',
		(c) => c.fields.delete(id),
		undefined,
		'array',
	],
	[
		'POST /v1/accounts/{accountId}/fields/{fieldId}/validate',
		(c) => c.fields.validate(id, 'Example', { signerAccessCode: code }),
		{ value: 'Example' },
		undefined,
		'signer',
	],
	[
		'POST /v1/accounts/{accountId}/fields/validate-multiple',
		(c) =>
			c.fields.validateMultiple([{ field_id: id, value: 'Example' }], { signerAccessCode: code }),
		[{ field_id: id, value: 'Example' }],
		undefined,
		'signer',
	],
	['GET /v1/field-types', (c) => c.fields.listTypes(), undefined, 'array'],
	['GET /v1/users/self/notification-preferences', (c) => c.users.getNotificationPreferences()],
	[
		'PUT /v1/users/self/notification-preferences',
		(c) => c.users.updateNotificationPreferences({ DocumentCompleted: true }),
		{ DocumentCompleted: true },
	],
	['POST /v1/oauth/token', (c) => c.oauth.token(refresh), refresh, 'flat', 'public'],
	[
		'POST /v1/oauth/revoke',
		(c) => c.oauth.revoke({ token: 'example-token', client_id: id }),
		{ token: 'example-token', client_id: id },
		'void',
		'public',
	],
	['GET /v1/oauth/userinfo', (c) => c.oauth.userinfo(), undefined, 'flat'],
	[
		'GET /v1/documents/{documentId}/thumbnail',
		(c) => c.documents.thumbnail(id),
		undefined,
		'binary',
	],
	[
		'GET /v1/documents/{documentId}/pages/{pageId}/download',
		(c) => c.documents.downloadPage(id, id),
		undefined,
		'binary',
	],
	[
		'GET /v1/public/documents/{documentId}',
		(c) => c.documents.getPublic(id),
		undefined,
		undefined,
		'public',
	],
	[
		'PUT /v1/public/documents/{documentId}/send-token',
		(c) => c.documents.sendToken(id, { email }),
		{ email },
		'status',
		'public',
	],
	['GET /v1/accounts/{accountId}/signers', (c) => c.signers.list(), undefined, 'list'],
	[
		'POST /v1/accounts/{accountId}/signers',
		(c) => c.signers.create({ full_name: 'Example User' }),
		{ full_name: 'Example User' },
	],
	['GET /v1/accounts/{accountId}/signers/{signerId}', (c) => c.signers.get(id)],
	[
		'PUT /v1/accounts/{accountId}/signers/{signerId}',
		(c) => c.signers.update(id, { full_name: 'Example User' }),
		{ full_name: 'Example User' },
	],
	[
		'DELETE /v1/accounts/{accountId}/signers/{signerId}',
		(c) => c.signers.delete(id),
		undefined,
		'array',
	],
	['GET /v1/signers/self', (c) => c.signerDocuments.self(code), undefined, undefined, 'signer'],
	[
		'GET /v1/signers/{signerId}/document',
		(c) => c.signerDocuments.getCurrent(id, code),
		undefined,
		undefined,
		'signer',
	],
	['GET /v1/sign', (c) => c.signerDocuments.getAssignment(code), undefined, undefined, 'signer'],
	[
		'POST /v1/documents/{documentId}/assignments/{assignmentId}',
		(c) => c.signerDocuments.sign(id, id, code, entries),
		entries,
		undefined,
		'signer',
	],
	[
		'PUT /v1/documents/{documentId}/assignments/{assignmentId}/reject',
		(c) => c.signerDocuments.decline(id, id, code, 'Example'),
		{ decline_reason: 'Example' },
		'array',
		'signer',
	],
	[
		'PUT /v1/signers/documents/sign-multiple',
		(c) => c.signerDocuments.signMultiple([id], code),
		{ document_ids: [id] },
		'array',
		'signer',
	],
	[
		'PUT /v1/signers/documents/decline-multiple',
		(c) => c.signerDocuments.declineMultiple([id], 'Example', code),
		{ document_ids: [id], decline_reason: 'Example' },
		'array',
		'signer',
	],
	[
		'POST /v1/verify',
		(c) => c.signerDocuments.verifyCode({ signerAccessCode: code, verificationCode: '000000' }),
		{ 'verification-code': '000000' },
		'status',
		'signer',
	],
	[
		'PUT /v1/documents/{documentId}/signers/confirm-data',
		(c) => c.signerDocuments.confirmData(id, code, { full_name: 'Example User' }),
		{ full_name: 'Example User' },
		undefined,
		'signer',
	],
	[
		'PUT /v1/signers/accept-terms',
		(c) => c.signerDocuments.acceptTerms(code),
		undefined,
		'status',
		'signer',
	],
	[
		'POST /v1/signature',
		(c) => c.signerDocuments.uploadSignature(code, image),
		image,
		'status',
		'signer',
	],
	[
		'GET /v1/signature/{signatureType}',
		(c) => c.signerDocuments.downloadSignature(code),
		undefined,
		'binary',
		'signer',
	],
	[
		'GET /v1/signers/{signerId}/documents',
		(c) => c.signerDocuments.list(id, code),
		undefined,
		'list',
		'signer',
	],
	[
		'GET /v1/signers/{signerId}/documents/search',
		(c) => c.signerDocuments.search(id, 'Example', code),
		undefined,
		'list',
		'signer',
	],
	[
		'GET /v1/signers/{signerId}/documents/{documentId}/download/{artifactName}',
		(c) => c.signerDocuments.download(id, id, 'original'),
		undefined,
		'binary',
		'public',
	],
	[
		'POST /v1/authentication/social-login',
		(c) =>
			c.auth.socialLogin({ provider: 'google', token: 'example-token', has_accepted_terms: true }),
		{ provider: 'google', token: 'example-token', has_accepted_terms: true },
		undefined,
		'public',
	],
	[
		'POST /v1/auth/link-social-login',
		(c) => c.auth.linkSocialLogin({ provider: 'google', token: 'example-token' }),
		{ provider: 'google', token: 'example-token' },
		'status',
	],
	['GET /v1/accounts/{accountId}/stats', (c) => c.workspaces.stats(id), undefined, 'array'],
	['GET /v1/users/self/stats', (c) => c.users.stats(), undefined, 'array'],
	['GET /v1/accounts/{accountId}/tags', (c) => c.tags.list(), undefined, 'array'],
	[
		'POST /v1/accounts/{accountId}/tags',
		(c) => c.tags.create({ name: 'Example' }),
		{ name: 'Example' },
	],
	[
		'PUT /v1/accounts/{accountId}/tags/{tagId}',
		(c) => c.tags.update(id, { color: null }),
		{ color: null },
	],
	['DELETE /v1/accounts/{accountId}/tags/{tagId}', (c) => c.tags.delete(id)],
	['GET /v1/accounts/{accountId}/templates', (c) => c.templates.list(), undefined, 'list'],
	[
		'POST /v1/accounts/{accountId}/templates/{templateId}/documents',
		(c) => c.documents.createFromTemplate(id, template.signers),
		template,
	],
	[
		'POST /v1/accounts/{accountId}/templates/{templateId}/documents/estimate-cost',
		(c) => c.documents.estimateCostFromTemplate(id, template.signers),
		template,
	],
	['GET /v1/users/self', (c) => c.users.self()],
	['GET /v1/users/api-keys', (c) => c.auth.getApiKey()],
	[
		'POST /v1/users/api-keys',
		(c) => c.auth.createApiKey('example-secret'),
		{ password: 'example-secret' },
	],
	['DELETE /v1/users/api-keys', (c) => c.auth.deleteApiKey(), undefined, 'array'],
	['GET /v1/accounts/{accountId}/webhooks/subscriptions', (c) => c.webhooks.get()],
	[
		'PUT /v1/accounts/{accountId}/webhooks/subscriptions',
		(c) => c.webhooks.register(webhook),
		webhook,
	],
	['PUT /v1/accounts/{accountId}/webhooks/inactivate', (c) => c.webhooks.inactivate()],
	['GET /v1/webhooks/event-types', (c) => c.webhooks.listEventTypes(), undefined, 'array'],
	['GET /v1/accounts/{accountId}/webhooks', (c) => c.webhooks.listDispatches(), undefined, 'list'],
	['POST /v1/accounts/{accountId}/webhooks/{historyId}/retry', (c) => c.webhooks.retryDispatch(id)],
	[
		'GET /.well-known/oauth-protected-resource',
		(c) => c.oauth.metadata(),
		undefined,
		'flat',
		'public',
	],
	[
		'GET /v1/documents/{documentId}/assignments/{assignmentId}/whatsapp-notifications',
		(c) => c.assignments.listWhatsAppNotifications(id, id),
		undefined,
		'array',
	],
];

const manifest = JSON.parse(
	readFileSync(new URL('../../docs/api-operations.json', import.meta.url), 'utf8'),
) as {
	operations: { method: string; path: string }[];
};

it('has a transport case for every published operation', () => {
	expect(cases.map(([operation]) => operation).sort()).toEqual(
		manifest.operations.map(({ method, path }) => `${method} ${path}`).sort(),
	);
});

describe('published HTTP contracts', () => {
	for (const [operation, invoke, body, kind, auth] of cases) {
		it(operation, async () => {
			const client = new AssinafyClient({
				token: 'example-owner-token',
				accountId: id,
				baseUrl: 'https://api.example.com/v1',
			});
			const [method, templatePath] = operation.split(' ') as [string, string];
			const expectedPath = templatePath.replace(/\{([^}]+)\}/g, (_match, key) =>
				key === 'artifactName' ? 'original' : key === 'signatureType' ? 'signature' : id,
			);
			const preflightsSignerDocument =
				auth === 'signer' && /^(POST|PUT) \/v1\/documents\//.test(operation);
			const payload =
				kind === 'list' || kind === 'array'
					? [{ id }]
					: kind === 'binary'
						? Buffer.from('example-bytes')
						: kind === 'status'
							? { status: 200, message: '' }
							: operation === 'POST /v1/oauth/token'
								? { id, refresh_token: 'example-next-refresh' } // refresh must rotate
								: { id };
			let requests = 0;
			client.getAxiosInstance().defaults.adapter = async (config) => {
				requests++;
				const url = new URL(client.getAxiosInstance().getUri(config));
				expect(url.origin).toBe('https://api.example.com');
				expect(config.headers.get('X-Api-Key')).toBeUndefined();
				expect(config.headers.get('Authorization')).toBe(
					auth ? undefined : 'Bearer example-owner-token',
				);
				if (auth === 'signer') expect(url.searchParams.get('signer-access-code')).toBe(code);
				if (preflightsSignerDocument && requests === 1) {
					expect(url.pathname).toBe('/v1/sign');
					expect(config.method).toBe('get');
					expect(config.data).toBeUndefined();
					return {
						config,
						data: { status: 200, data: { id, assignment: { id } } },
						status: 200,
						statusText: 'OK',
						headers: {},
					};
				}
				expect(url.pathname).toBe(expectedPath);
				expect(config.method?.toUpperCase()).toBe(method);
				if (body === 'multipart') {
					expect(config.data).toBeInstanceOf(FormData);
					expect([...config.data.values()].some((value) => value instanceof Blob)).toBe(true);
				} else {
					const sent =
						typeof config.data !== 'string'
							? config.data
							: config.headers.get('Content-Type') === 'application/x-www-form-urlencoded'
								? Object.fromEntries(new URLSearchParams(config.data))
								: JSON.parse(config.data);
					expect(sent).toEqual(body);
				}
				if (kind === 'binary') expect(config.responseType).toBe('arraybuffer');
				const raw = ['binary', 'status', 'flat', 'void'].includes(kind ?? '')
					? payload
					: { status: 200, data: payload };
				return {
					config,
					data: raw,
					status: 200,
					statusText: 'OK',
					headers:
						kind === 'list'
							? {
									'x-pagination-current-page': '1',
									'x-pagination-total-count': '1',
									'x-pagination-page-count': '1',
								}
							: {},
				};
			};
			const result = await invoke(client);
			expect(requests).toBe(preflightsSignerDocument ? 2 : 1);
			expect(result).toEqual(
				kind === 'void'
					? undefined
					: kind === 'list'
						? { data: payload, meta: { current_page: 1, total: 1, last_page: 1 } }
						: payload,
			);
		});
	}
});
