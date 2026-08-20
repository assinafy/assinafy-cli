#!/usr/bin/env node

import { randomUUID } from 'node:crypto';

const REQUIRED_ENV = [
	'ASSINAFY_API_KEY',
	'ASSINAFY_ACCOUNT_ID',
	'ASSINAFY_TEST_EMAIL',
	'ASSINAFY_TEST_EMAIL_ALT',
];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);

if (missing.length > 0) {
	console.log(
		JSON.stringify(
			{
				status: 'SKIPPED',
				reason: 'sandbox credentials are not configured',
				missing,
			},
			null,
			2,
		),
	);
	process.exit(0);
}

const baseUrl = process.env.ASSINAFY_SANDBOX_BASE_URL ?? 'https://sandbox.assinafy.com.br/v1';
let parsedBaseUrl;
try {
	parsedBaseUrl = new URL(baseUrl);
} catch {
	console.error('Refusing to run: ASSINAFY_SANDBOX_BASE_URL is not a valid URL.');
	process.exit(2);
}
if (parsedBaseUrl.protocol !== 'https:' || parsedBaseUrl.hostname !== 'sandbox.assinafy.com.br') {
	console.error('Refusing to run: ASSINAFY_SANDBOX_BASE_URL must target the Assinafy sandbox.');
	process.exit(2);
}

const { ApiError, AssinafyClient } = await import('../dist/api.js');
const accountId = process.env.ASSINAFY_ACCOUNT_ID;
const apiKey = process.env.ASSINAFY_API_KEY;
const email = process.env.ASSINAFY_TEST_EMAIL;
const alternateEmail = process.env.ASSINAFY_TEST_EMAIL_ALT;
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const rows = [];
let unexpectedFailures = 0;

function add(operation, status, code, note) {
	const row = { operation, status };
	if (code !== undefined) row.http_status = code;
	if (note) row.note = note;
	rows.push(row);
}

function statusCode(error) {
	return error instanceof ApiError ? error.statusCode : undefined;
}

async function run(operation, action, options = {}) {
	const expectedStatuses = options.expectedStatuses ?? [];
	try {
		const value = await action();
		if (expectedStatuses.length > 0 && !options.allowSuccess) {
			add(operation, 'UNEXPECTED_SUCCESS', undefined, options.note);
			unexpectedFailures++;
			return { ok: false, value };
		}
		add(operation, 'PASS', undefined, options.successNote);
		return { ok: true, value };
	} catch (error) {
		const code = statusCode(error);
		if (code !== undefined && expectedStatuses.includes(code)) {
			add(operation, options.expectedStatus ?? 'EXPECTED_NEGATIVE', code, options.note);
			return { ok: false, expected: true };
		}
		add(operation, 'FAIL', code, code === undefined ? 'client or transport failure' : undefined);
		unexpectedFailures++;
		return { ok: false };
	}
}

function skip(operation, status, note) {
	add(operation, status, undefined, note);
}

function firstPageId(document) {
	if (!Array.isArray(document?.pages)) return undefined;
	const page = document.pages.find((candidate) => candidate && typeof candidate === 'object');
	return typeof page?.id === 'string' ? page.id : undefined;
}

function createPdf() {
	const stream = 'BT\n/F1 12 Tf\n72 720 Td\n(Sandbox SDK smoke test) Tj\nET\n';
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
		`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
	];
	let body = '%PDF-1.4\n';
	const offsets = [0];
	for (const [index, object] of objects.entries()) {
		offsets.push(Buffer.byteLength(body));
		body += `${index + 1} 0 obj\n${object}\nendobj\n`;
	}
	const xref = Buffer.byteLength(body);
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	body += offsets
		.slice(1)
		.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
		.join('');
	body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return Buffer.from(body);
}

const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
	'base64',
);
const pdf = createPdf();
const owner = AssinafyClient.create(apiKey, accountId, { baseUrl, timeout: 45_000 });
const publicClient = new AssinafyClient({ baseUrl, allowUnauthenticated: true, timeout: 45_000 });

let temporaryAccountId;
let temporaryClient;
let logoUploaded = false;
let webhookActive = false;
let fullNameSignerId;
let emailSignerId;
let tagId;
let tagName;
let fieldId;
let documentId;
let helperDocumentId;
const helperSignerIds = new Set();

try {
	await run('client.create', async () => owner);
	await run('client.fromConfig', async () =>
		AssinafyClient.fromConfig({ apiKey, accountId, baseUrl, timeout: 45_000 }),
	);
	await run('client.getAxiosInstance', async () => owner.getAxiosInstance());
	skip(
		'webhookVerifier.verify',
		'SKIP_UPSTREAM_CONTRACT',
		'Assinafy does not publish a webhook signature or replay-protection contract',
	);

	await run('workspaces.list', () => owner.workspaces.list());
	await run('workspaces.get', () => owner.workspaces.get(accountId));
	await run('workspaces.getTheme', () => owner.workspaces.getTheme(accountId));
	await run('workspaces.downloadLogo', () => owner.workspaces.downloadLogo(accountId), {
		expectedStatuses: [404],
		allowSuccess: true,
		expectedStatus: 'PASS_NOT_CONFIGURED',
		note: 'the primary workspace has no logo',
	});
	await run('workspaces.stats', () => owner.workspaces.stats(accountId), {
		expectedStatuses: [404],
		allowSuccess: true,
		expectedStatus: 'SANDBOX_DRIFT',
		note: 'published in production OpenAPI but absent from sandbox deployment',
	});

	await run('users.self', () => owner.users.self());
	await run('users.stats', () => owner.users.stats(), {
		expectedStatuses: [404],
		allowSuccess: true,
		expectedStatus: 'SANDBOX_DRIFT',
		note: 'published in production OpenAPI but absent from sandbox deployment',
	});
	const preferences = await run(
		'users.getNotificationPreferences',
		() => owner.users.getNotificationPreferences(),
		{
			expectedStatuses: [404],
			allowSuccess: true,
			expectedStatus: 'SANDBOX_DRIFT',
			note: 'published in production OpenAPI but absent from sandbox deployment',
		},
	);
	if (preferences.ok && preferences.value && typeof preferences.value === 'object') {
		const unchanged = Object.entries(preferences.value).find(
			([, value]) => typeof value === 'boolean',
		);
		if (unchanged) {
			await run('users.updateNotificationPreferences', () =>
				owner.users.updateNotificationPreferences({ [unchanged[0]]: unchanged[1] }),
			);
		} else {
			skip(
				'users.updateNotificationPreferences',
				'SKIP_CONTRACT_MISMATCH',
				'notification preference response had no boolean preference',
			);
		}
	} else {
		skip(
			'users.updateNotificationPreferences',
			'SANDBOX_DRIFT',
			'its prerequisite GET endpoint is absent from the sandbox deployment',
		);
	}

	await run('auth.getApiKey', () => owner.auth.getApiKey());
	await run(
		'auth.login.invalidCredentials',
		() => publicClient.auth.login('assinafy-sdk-smoke@invalid.example', `invalid-${suffix}`),
		{ expectedStatuses: [400, 401, 403, 404, 422] },
	);
	await run(
		'auth.socialLogin.invalidProviderToken',
		() =>
			publicClient.auth.socialLogin({
				provider: 'google',
				token: `invalid-${suffix}`,
				has_accepted_terms: false,
			}),
		{ expectedStatuses: [400, 401, 403, 404, 422] },
	);
	await run(
		'auth.linkSocialLogin.invalidProviderToken',
		() => owner.auth.linkSocialLogin({ provider: 'google', token: `invalid-${suffix}` }),
		{ expectedStatuses: [400, 401, 403, 404, 409, 422] },
	);
	for (const operation of [
		'auth.createApiKey',
		'auth.deleteApiKey',
		'auth.changePassword',
		'auth.requestPasswordReset',
		'auth.resetPassword',
	]) {
		skip(
			operation,
			'SKIP_SAFETY',
			'credential mutation or password email is intentionally prohibited',
		);
	}

	await run('documents.statuses', () => owner.documents.statuses());
	await run('documents.verify.unknownHash', () => owner.documents.verify('0'.repeat(64)));
	await run('webhooks.listEventTypes', () => owner.webhooks.listEventTypes());
	const fieldTypes = await run('fields.listTypes', () => owner.fields.listTypes());

	const templates = await run('templates.list', () => owner.templates.list({ per_page: 1 }));
	const template =
		templates.ok && Array.isArray(templates.value?.data) ? templates.value.data[0] : undefined;
	if (template?.id) {
		const templateDetails = await run('templates.get', () => owner.templates.get(template.id));
		const templatePageId = templateDetails.ok ? firstPageId(templateDetails.value) : undefined;
		if (templatePageId) {
			await run('templates.downloadPage', () =>
				owner.templates.downloadPage(template.id, templatePageId),
			);
		} else {
			skip('templates.downloadPage', 'SKIP_PRECONDITION', 'the available template has no page');
		}
		const roles = Array.isArray(template.roles)
			? template.roles.map((role) => ({
					role_id: role.id,
					verification_method: 'Email',
					notification_methods: [],
				}))
			: [];
		if (roles.length > 0) {
			await run('documents.estimateCostFromTemplate', () =>
				owner.documents.estimateCostFromTemplate(template.id, roles),
			);
		} else {
			skip(
				'documents.estimateCostFromTemplate',
				'SKIP_PRECONDITION',
				'the available template has no signer roles',
			);
		}
	} else {
		for (const operation of [
			'templates.get',
			'templates.downloadPage',
			'documents.estimateCostFromTemplate',
		]) {
			skip(operation, 'SKIP_PRECONDITION', 'the workspace has no template');
		}
	}
	skip(
		'documents.createFromTemplate',
		'SKIP_SAFETY',
		'no disposable template exists and creation can consume the primary workspace allowance',
	);

	const createdAccount = await run('workspaces.create', () =>
		owner.workspaces.create({ name: `SDK sandbox smoke ${suffix}` }),
	);
	if (!createdAccount.ok || !createdAccount.value?.id) {
		skip('temporaryWorkspace.flow', 'BLOCKED', 'temporary workspace creation failed');
	} else if (createdAccount.value.id === accountId) {
		add(
			'temporaryWorkspace.identityGuard',
			'FAIL',
			undefined,
			'API returned the primary account ID',
		);
		unexpectedFailures++;
	} else {
		temporaryAccountId = createdAccount.value.id;
		temporaryClient = AssinafyClient.create(apiKey, temporaryAccountId, {
			baseUrl,
			timeout: 45_000,
		});

		await run('workspaces.update', () =>
			owner.workspaces.update(temporaryAccountId, { name: `SDK sandbox verified ${suffix}` }),
		);
		await run('workspaces.get.temporary', () => owner.workspaces.get(temporaryAccountId));
		await run('workspaces.getTheme.temporary', () => owner.workspaces.getTheme(temporaryAccountId));
		const logoUpload = await run('workspaces.uploadLogo', () =>
			owner.workspaces.uploadLogo(temporaryAccountId, png),
		);
		logoUploaded = logoUpload.ok;
		if (logoUploaded) {
			await run('workspaces.downloadLogo.temporary', () =>
				owner.workspaces.downloadLogo(temporaryAccountId),
			);
			const logoDelete = await run('workspaces.deleteLogo', () =>
				owner.workspaces.deleteLogo(temporaryAccountId),
			);
			if (logoDelete.ok) logoUploaded = false;
		}
		await run('workspaces.stats.temporary', () => owner.workspaces.stats(temporaryAccountId), {
			expectedStatuses: [404],
			allowSuccess: true,
			expectedStatus: 'SANDBOX_DRIFT',
			note: 'published in production OpenAPI but absent from sandbox deployment',
		});

		const webhook = await run('webhooks.register', () =>
			temporaryClient.webhooks.register({
				url: `https://example.invalid/assinafy-sandbox-smoke/${suffix}`,
				email: alternateEmail,
				events: [],
				is_active: true,
			}),
		);
		webhookActive = webhook.ok;
		await run('webhooks.get', () => temporaryClient.webhooks.get());
		await run('webhooks.listDispatches', () =>
			temporaryClient.webhooks.listDispatches({ per_page: 1 }),
		);

		await run('signers.list', () => temporaryClient.signers.list({ per_page: 1 }));
		const fullNameSigner = await run('signers.create.fullNameOnly', () =>
			temporaryClient.signers.create({ full_name: `SDK Full Name Only ${suffix}` }),
		);
		if (fullNameSigner.ok) {
			fullNameSignerId = fullNameSigner.value.id;
			await run('signers.get', () => temporaryClient.signers.get(fullNameSignerId));
			await run('signers.update', () =>
				temporaryClient.signers.update(fullNameSignerId, {
					full_name: `SDK Full Name Updated ${suffix}`,
				}),
			);
		}
		const emailSigner = await run('signers.create.email', () =>
			temporaryClient.signers.create({ full_name: `SDK Email Signer ${suffix}`, email }),
		);
		if (emailSigner.ok) {
			emailSignerId = emailSigner.value.id;
			await run('signers.findByEmail', () => temporaryClient.signers.findByEmail(email));
		}

		const createdTag = await run('tags.create', () =>
			temporaryClient.tags.create({ name: `sdk-smoke-${suffix}`, color: '2072b9' }),
		);
		if (createdTag.ok) {
			tagId = createdTag.value.id;
			tagName = `${createdTag.value.name}-updated`;
			await run('tags.update', () =>
				temporaryClient.tags.update(tagId, { name: tagName, color: null }),
			);
		}
		await run('tags.list', () => temporaryClient.tags.list());
		await run('tags.list.search', () => temporaryClient.tags.list({ search: suffix }));

		const fieldType =
			fieldTypes.ok && Array.isArray(fieldTypes.value)
				? (fieldTypes.value.find((entry) => entry.type === 'text')?.type ??
					fieldTypes.value[0]?.type ??
					'text')
				: 'text';
		const createdField = await run('fields.create', () =>
			temporaryClient.fields.create({
				name: `SDK smoke field ${suffix}`,
				type: fieldType,
				is_required: false,
			}),
		);
		if (createdField.ok) {
			fieldId = createdField.value.id;
			await run('fields.get', () => temporaryClient.fields.get(fieldId));
			await run('fields.update', () =>
				temporaryClient.fields.update(fieldId, {
					name: `SDK smoke field verified ${suffix}`,
					regex: null,
				}),
			);
			await run('fields.validate', () => temporaryClient.fields.validate(fieldId, 'sandbox'));
			await run('fields.validateMultiple', () =>
				temporaryClient.fields.validateMultiple([{ field_id: fieldId, value: 'sandbox' }]),
			);
		}
		await run('fields.list', () =>
			temporaryClient.fields.list({ include_inactive: true, include_standard: true }),
		);

		const fileName = `sandbox-smoke-${suffix}.pdf`;
		const uploadedDocument = await run('documents.upload', () =>
			temporaryClient.documents.upload(
				{ buffer: pdf, fileName },
				{ name: `SDK Sandbox Smoke ${suffix}`, metadata: { purpose: 'sdk-sandbox-smoke' } },
			),
		);
		if (uploadedDocument.ok) {
			documentId = uploadedDocument.value.id;
			await run('documents.waitUntilReady', () =>
				temporaryClient.documents.waitUntilReady(documentId, {
					maxWaitMs: 90_000,
					pollIntervalMs: 1_000,
				}),
			);
			await run('documents.list', () => temporaryClient.documents.list({ per_page: 5 }));
			await run('documents.search', () =>
				temporaryClient.documents.search({ search: suffix, per_page: 5 }),
			);
			let details = await run('documents.details', () =>
				temporaryClient.documents.details(documentId),
			);
			await run('documents.get', () => temporaryClient.documents.get(documentId));
			await run('documents.rename', () =>
				temporaryClient.documents.rename(documentId, `SDK Sandbox Renamed ${suffix}`),
			);
			await run('documents.download.original', () =>
				temporaryClient.documents.download(documentId, 'original'),
			);
			await run('documents.thumbnail', () => temporaryClient.documents.thumbnail(documentId));
			if (!details.ok) {
				details = await run('documents.details.forPage', () =>
					temporaryClient.documents.details(documentId),
				);
			}
			const pageId = details.ok ? firstPageId(details.value) : undefined;
			if (pageId) {
				await run('documents.downloadPage', () =>
					temporaryClient.documents.downloadPage(documentId, pageId),
				);
			} else {
				skip('documents.downloadPage', 'SKIP_PRECONDITION', 'processed document has no page ID');
			}
			await run('documents.activities', () => temporaryClient.documents.activities(documentId));
			await run('documents.isFullySigned', () =>
				temporaryClient.documents.isFullySigned(documentId),
			);
			await run('documents.getSigningProgress', () =>
				temporaryClient.documents.getSigningProgress(documentId),
			);

			if (tagId && tagName) {
				await run('documents.replaceTags', () =>
					temporaryClient.documents.replaceTags(documentId, [tagName]),
				);
				await run('documents.listTags', () => temporaryClient.documents.listTags(documentId));
				await run('documents.addTags', () =>
					temporaryClient.documents.addTags(documentId, [tagName]),
				);
				await run('documents.detachTag', () =>
					temporaryClient.documents.detachTag(documentId, tagId),
				);
				await run('documents.replaceTags.empty', () =>
					temporaryClient.documents.replaceTags(documentId, []),
				);
			}

			await run('assignments.list', () => temporaryClient.assignments.list({ per_page: 5 }));
			if (emailSignerId) {
				const assignmentPayload = {
					method: 'virtual',
					signers: [
						{
							id: emailSignerId,
							verification_method: 'Email',
							notification_methods: [],
							step: 1,
						},
					],
				};
				await run('assignments.estimateCost', () =>
					temporaryClient.assignments.estimateCost(documentId, assignmentPayload),
				);
				const assignment = await run('assignments.create', () =>
					temporaryClient.assignments.create(documentId, assignmentPayload),
				);
				if (assignment.ok) {
					const assignmentId = assignment.value.id;
					skip(
						'assignments.resetExpiration',
						'SKIP_EMAIL_SAFETY',
						'resetting expiration emits an owner notification',
					);
					await run('assignments.estimateResendCost', () =>
						temporaryClient.assignments.estimateResendCost(documentId, assignmentId, emailSignerId),
					);
					skip(
						'assignments.resendNotification',
						'SKIP_EMAIL_SAFETY',
						'would send a duplicate signing invitation',
					);
					await run('assignments.listWhatsAppNotifications', () =>
						temporaryClient.assignments.listWhatsAppNotifications(documentId, assignmentId),
					);
					await run('documents.getPublic', () => publicClient.documents.getPublic(documentId));
					await run('documents.sendToken.oneEmail', () =>
						publicClient.documents.sendToken(documentId, email, 'email'),
					);
					const invalidCode = `invalid-${suffix}`;
					const signerNegative = { expectedStatuses: [400, 401, 403, 404, 422] };
					await run(
						'signerDocuments.getCurrent.invalidAccessCode',
						() => publicClient.signerDocuments.getCurrent(emailSignerId, invalidCode),
						signerNegative,
					);
					await run(
						'signerDocuments.list.invalidAccessCode',
						() => publicClient.signerDocuments.list(emailSignerId, invalidCode),
						signerNegative,
					);
					await run(
						'signerDocuments.search.invalidAccessCode',
						() => publicClient.signerDocuments.search(emailSignerId, suffix, invalidCode),
						signerNegative,
					);
					await run(
						'signerDocuments.download.invalidAccessCode',
						() =>
							publicClient.signerDocuments.download(
								emailSignerId,
								documentId,
								'original',
								invalidCode,
							),
						signerNegative,
					);
					await run(
						'rawApi.signerArtifactDownload.invalidAccessCode',
						async () => {
							const url = new URL(
								`${baseUrl.replace(/\/$/, '')}/signers/${encodeURIComponent(emailSignerId)}/documents/${encodeURIComponent(documentId)}/download/original`,
							);
							url.searchParams.set('signer-access-code', invalidCode);
							const response = await fetch(url, { redirect: 'error' });
							if (!response.ok) {
								throw new ApiError('Raw signer artifact request was rejected', response.status);
							}
							return response.arrayBuffer();
						},
						signerNegative,
					);
					await run(
						'signerDocuments.signMultiple.invalidAccessCode',
						() => publicClient.signerDocuments.signMultiple([documentId], invalidCode),
						signerNegative,
					);
					await run(
						'signerDocuments.declineMultiple.invalidAccessCode',
						() =>
							publicClient.signerDocuments.declineMultiple(
								[documentId],
								'sandbox negative test',
								invalidCode,
							),
						signerNegative,
					);
					await run(
						'signerDocuments.self.invalidAccessCode',
						() => publicClient.signerDocuments.self(invalidCode),
						signerNegative,
					);
					await run(
						'signerDocuments.acceptTerms.invalidAccessCode',
						() => publicClient.signerDocuments.acceptTerms(invalidCode),
						signerNegative,
					);
					await run(
						'signerDocuments.verifyEmail.invalidAccessCode',
						() =>
							publicClient.signerDocuments.verifyEmail({
								signerAccessCode: invalidCode,
								verificationCode: '000000',
							}),
						signerNegative,
					);
					await run(
						'signerDocuments.confirmData.invalidAccessCode',
						() =>
							publicClient.signerDocuments.confirmData(documentId, invalidCode, {
								full_name: `Invalid ${suffix}`,
							}),
						signerNegative,
					);
					await run(
						'signerDocuments.uploadSignature.invalidAccessCode',
						() => publicClient.signerDocuments.uploadSignature(invalidCode, png),
						signerNegative,
					);
					await run(
						'signerDocuments.downloadSignature.invalidAccessCode',
						() => publicClient.signerDocuments.downloadSignature(invalidCode),
						signerNegative,
					);
					await run(
						'signerDocuments.getAssignment.invalidAccessCode',
						() => publicClient.signerDocuments.getAssignment(invalidCode),
						signerNegative,
					);
					await run(
						'signerDocuments.sign.invalidAccessCode',
						() =>
							publicClient.signerDocuments.sign(documentId, assignmentId, invalidCode, [
								{ itemId: 'invalid', fieldId: 'invalid', pageId: 'invalid', value: 'invalid' },
							]),
						signerNegative,
					);
					await run(
						'signerDocuments.decline.invalidAccessCode',
						() =>
							publicClient.signerDocuments.decline(
								documentId,
								assignmentId,
								invalidCode,
								'sandbox negative test',
							),
						signerNegative,
					);
				} else {
					for (const operation of [
						'assignments.estimateResendCost',
						'assignments.listWhatsAppNotifications',
						'documents.getPublic',
						'documents.sendToken',
						'signerDocuments.flow',
					]) {
						skip(operation, 'BLOCKED', 'assignment creation failed');
					}
				}
			} else {
				skip('assignments.create', 'BLOCKED', 'email signer creation failed');
			}

			for (const artifact of ['certificated', 'certificate-page', 'pades', 'bundle']) {
				await run(
					`documents.download.${artifact}`,
					() => temporaryClient.documents.download(documentId, artifact),
					{
						expectedStatuses: [400, 404, 409, 422],
						allowSuccess: true,
						expectedStatus: 'EXPECTED_UNAVAILABLE',
						note: 'artifact is unavailable until the document is signed or certified',
					},
				);
			}
		}

		const helperName = `helper-${suffix}`;
		const helper = await run('client.uploadAndRequestSignatures', () =>
			temporaryClient.uploadAndRequestSignatures({
				source: { buffer: pdf, fileName: `${helperName}.pdf` },
				signers: [
					{
						name: `SDK Helper Signer ${suffix}`,
						email: alternateEmail,
						verification_method: 'Email',
						notification_methods: [],
						step: 1,
					},
				],
			}),
		);
		if (helper.ok) {
			helperDocumentId = helper.value.document.id;
			for (const id of helper.value.signer_ids) helperSignerIds.add(id);
		} else {
			const partialDocuments = await run('cleanup.discoverHelperDocuments', () =>
				temporaryClient.documents.search({ search: helperName, per_page: 20 }),
			);
			if (partialDocuments.ok) {
				for (const document of partialDocuments.value.data) {
					await run('cleanup.partialHelperDocument', () =>
						temporaryClient.documents.delete(document.id),
					);
				}
			}
			const partialSigner = await run('cleanup.discoverHelperSigner', () =>
				temporaryClient.signers.findByEmail(alternateEmail),
			);
			if (
				partialSigner.ok &&
				partialSigner.value?.id &&
				partialSigner.value.full_name === `SDK Helper Signer ${suffix}`
			) {
				helperSignerIds.add(partialSigner.value.id);
			}
		}

		const dispatches = await run('webhooks.listDispatches.afterMutations', () =>
			temporaryClient.webhooks.listDispatches({ per_page: 1 }),
		);
		if (dispatches.ok && dispatches.value.data.length > 0) {
			await run('webhooks.retryDispatch', () =>
				temporaryClient.webhooks.retryDispatch(dispatches.value.data[0].id),
			);
		} else {
			skip('webhooks.retryDispatch', 'SKIP_PRECONDITION', 'no disposable webhook dispatch exists');
		}

		if (webhookActive) {
			const inactivated = await run('webhooks.inactivate', () =>
				temporaryClient.webhooks.inactivate(),
			);
			if (inactivated.ok) webhookActive = false;
			await run('webhooks.get.inactive', () => temporaryClient.webhooks.get());
		}

		if (helperDocumentId) {
			const deleted = await run('documents.delete.helper', () =>
				temporaryClient.documents.delete(helperDocumentId),
			);
			if (deleted.ok) helperDocumentId = undefined;
		}
		if (documentId) {
			const deleted = await run('documents.delete', () =>
				temporaryClient.documents.delete(documentId),
			);
			if (deleted.ok) documentId = undefined;
		}
		if (fieldId) {
			const deleted = await run('fields.delete', () => temporaryClient.fields.delete(fieldId));
			if (deleted.ok) fieldId = undefined;
		}
		if (tagId) {
			const deleted = await run('tags.delete', () => temporaryClient.tags.delete(tagId));
			if (deleted.ok) tagId = undefined;
		}
		for (const id of [...helperSignerIds]) {
			const deleted = await run('signers.delete.helper', () => temporaryClient.signers.delete(id));
			if (deleted.ok) helperSignerIds.delete(id);
		}
		if (emailSignerId) {
			const deleted = await run('signers.delete.email', () =>
				temporaryClient.signers.delete(emailSignerId),
			);
			if (deleted.ok) emailSignerId = undefined;
		}
		if (fullNameSignerId) {
			const deleted = await run('signers.delete.fullNameOnly', () =>
				temporaryClient.signers.delete(fullNameSignerId),
			);
			if (deleted.ok) fullNameSignerId = undefined;
		}

		if (temporaryAccountId) {
			const deletedAccountId = temporaryAccountId;
			const deleted = await run('workspaces.delete', () =>
				owner.workspaces.delete(deletedAccountId),
			);
			if (deleted.ok) {
				const absent = await run(
					'cleanup.verifyWorkspaceAbsent',
					() => owner.workspaces.get(deletedAccountId),
					{ expectedStatuses: [404], expectedStatus: 'PASS_ABSENT' },
				);
				if (absent.expected) temporaryAccountId = undefined;
			}
		}
	}
} catch {
	add('sandboxSmoke.runner', 'FAIL', undefined, 'unexpected runner failure');
	unexpectedFailures++;
} finally {
	if (temporaryClient) {
		for (const [operation, id] of [
			['cleanup.documents.delete.helper', helperDocumentId],
			['cleanup.documents.delete', documentId],
		]) {
			if (id) {
				await run(operation, () => temporaryClient.documents.delete(id), {
					expectedStatuses: [404],
					allowSuccess: true,
					expectedStatus: 'PASS_ALREADY_ABSENT',
				});
			}
		}
		if (webhookActive) {
			await run('cleanup.webhooks.inactivate', () => temporaryClient.webhooks.inactivate(), {
				expectedStatuses: [404],
				allowSuccess: true,
				expectedStatus: 'PASS_ALREADY_ABSENT',
			});
		}
		if (fieldId) {
			await run('cleanup.fields.delete', () => temporaryClient.fields.delete(fieldId), {
				expectedStatuses: [404],
				allowSuccess: true,
				expectedStatus: 'PASS_ALREADY_ABSENT',
			});
		}
		if (tagId) {
			await run('cleanup.tags.delete', () => temporaryClient.tags.delete(tagId, { force: true }), {
				expectedStatuses: [404],
				allowSuccess: true,
				expectedStatus: 'PASS_ALREADY_ABSENT',
			});
		}
		for (const [operation, id] of [
			...[...helperSignerIds].map((id) => ['cleanup.signers.delete.helper', id]),
			['cleanup.signers.delete.email', emailSignerId],
			['cleanup.signers.delete.fullNameOnly', fullNameSignerId],
		]) {
			if (id) {
				await run(operation, () => temporaryClient.signers.delete(id), {
					expectedStatuses: [404],
					allowSuccess: true,
					expectedStatus: 'PASS_ALREADY_ABSENT',
				});
			}
		}
	}
	if (temporaryAccountId && temporaryAccountId !== accountId) {
		if (logoUploaded) {
			await run(
				'cleanup.workspaces.deleteLogo',
				() => owner.workspaces.deleteLogo(temporaryAccountId),
				{
					expectedStatuses: [404],
					allowSuccess: true,
					expectedStatus: 'PASS_ALREADY_ABSENT',
				},
			);
		}
		const deletedAccountId = temporaryAccountId;
		const deleted = await run(
			'cleanup.workspaces.delete',
			() => owner.workspaces.delete(deletedAccountId, { force: true }),
			{
				expectedStatuses: [404],
				allowSuccess: true,
				expectedStatus: 'PASS_ALREADY_ABSENT',
			},
		);
		if (deleted.ok || deleted.expected) {
			await run(
				'cleanup.verifyWorkspaceAbsent.finally',
				() => owner.workspaces.get(deletedAccountId),
				{ expectedStatuses: [404], expectedStatus: 'PASS_ABSENT' },
			);
		}
	}
}

const counts = Object.fromEntries(
	Object.entries(Object.groupBy(rows, (row) => row.status)).map(([status, entries]) => [
		status,
		entries.length,
	]),
);
const cleanupFailures = rows.filter(
	(row) => row.operation.startsWith('cleanup.') && row.status === 'FAIL',
).length;
console.log(
	JSON.stringify(
		{
			status: unexpectedFailures === 0 && cleanupFailures === 0 ? 'PASS' : 'FAIL',
			target: 'Assinafy sandbox',
			counts,
			cleanup: cleanupFailures === 0 ? 'complete' : 'failed',
			operations: rows,
		},
		null,
		2,
	),
);

if (unexpectedFailures > 0 || cleanupFailures > 0) process.exitCode = 1;
