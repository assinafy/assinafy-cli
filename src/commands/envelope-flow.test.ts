import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Command } from '@commander-js/extra-typings';
import { expect, it, vi } from 'vitest';
import { AssinafyClient } from '../api';
import * as cliClient from '../lib/client';
import { embedCommand } from './embed';
import { envelopesCommand } from './envelopes';
import { signerCommand } from './signer';
import { usersCommand } from './users';
import { webhooksCommand } from './webhooks';
import { workspacesCommand } from './workspaces';

it('runs envelope, embedded signing, delivery and notification CLI flows over local HTTP', async () => {
	const directory = mkdtempSync(path.join(tmpdir(), 'assinafy-envelope-flow-'));
	type Exchange = {
		method: string;
		path: string;
		body?: unknown;
		response?: unknown;
		public?: boolean;
		code?: boolean;
		idempotencyKey?: string;
	};
	const queue: Exchange[] = [];
	const failures: unknown[] = [];
	const server = createServer(async (request, response) => {
		try {
			const next = queue.shift();
			expect(next, `Unexpected request ${request.method} ${request.url}`).toBeDefined();
			if (!next) throw new Error('Unexpected request');
			const url = new URL(request.url!, 'http://localhost');
			expect(request.method).toBe(next.method);
			expect(url.pathname).toBe(`/v1${next.path}`);
			expect(request.headers['x-api-key']).toBe(next.public ? undefined : 'example-owner');
			expect(request.headers.authorization).toBeUndefined();
			expect(request.headers['idempotency-key']).toBe(next.idempotencyKey);
			if (next.code) expect(url.searchParams.get('signer-access-code')).toBe('example-code');
			if (next.path === '/sign') expect(url.searchParams.get('document_id')).toBe('document');
			const chunks: Buffer[] = [];
			for await (const chunk of request) chunks.push(Buffer.from(chunk));
			const body = Buffer.concat(chunks).toString();
			expect(body ? JSON.parse(body) : undefined).toEqual(next.body);
			if (Buffer.isBuffer(next.response)) {
				response.setHeader('Content-Type', 'application/octet-stream');
				response.end(next.response);
			} else {
				response.setHeader('Content-Type', 'application/json');
				response.end(JSON.stringify({ status: 200, message: '', data: next.response ?? [] }));
			}
		} catch (error) {
			failures.push(error);
			response.writeHead(500).end();
		}
	});
	try {
		await new Promise<void>((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolve);
		});
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('No server address');
		vi.stubEnv('ASSINAFY_CONFIG_DIR', directory);
		vi.stubEnv('ASSINAFY_API_KEY', 'example-owner');
		vi.stubEnv('ASSINAFY_ACCOUNT_ID', 'account');
		vi.stubEnv('ASSINAFY_SIGNER_ACCESS_CODE', 'example-code');
		vi.stubEnv('ASSINAFY_EMBED_SESSION_TOKEN', 'session-token');
		vi.stubEnv('ASSINAFY_DOWNLOAD_TOKEN', 'download-token');
		vi.spyOn(cliClient, 'createClient').mockImplementation(
			(_config, options) =>
				new AssinafyClient({
					baseUrl: `http://127.0.0.1:${address.port}/v1`,
					allowInsecureHttp: true,
					apiKey: options?.omitCredentials ? undefined : 'example-owner',
					allowUnauthenticated: true,
					accountId: 'account',
				}),
		);
		let stdout = '';
		let stderr = '';
		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			stdout += String(chunk);
			return true;
		});
		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr += String(chunk);
			return true;
		});
		const program = new Command()
			.exitOverride()
			.option('--json')
			.option('-q, --quiet')
			.addCommand(envelopesCommand)
			.addCommand(embedCommand)
			.addCommand(signerCommand)
			.addCommand(workspacesCommand)
			.addCommand(usersCommand)
			.addCommand(webhooksCommand);
		async function run(args: string[], exchanges: Exchange[], failure = false) {
			queue.push(...exchanges);
			stdout = '';
			stderr = '';
			process.exitCode = 0;
			await program.parseAsync(['--json', '-q', ...args], { from: 'user' });
			expect(failures).toEqual([]);
			expect(queue).toHaveLength(0);
			expect(process.exitCode, stderr).toBe(failure ? 1 : 0);
			return stdout ? JSON.parse(stdout) : undefined;
		}
		const payload = {
			name: 'Example',
			max_total_credits: 0,
			signers: [{ id: 'signer', embedded: true }],
			documents: [{ id: 'document', signer_ids: ['signer'] }],
		};
		await run(
			['envelopes', 'estimate-cost', '--data', JSON.stringify(payload)],
			[
				{
					method: 'POST',
					path: '/accounts/account/envelopes/estimate-cost',
					body: payload,
					response: { total_credits: 0, has_sufficient_resources: true },
				},
			],
		);
		expect(
			await run(
				[
					'envelopes',
					'create',
					'--data',
					JSON.stringify(payload),
					'--idempotency-key',
					'operation-key',
				],
				[
					{
						method: 'POST',
						path: '/accounts/account/envelopes',
						body: payload,
						idempotencyKey: 'operation-key',
						response: { id: 'envelope' },
					},
				],
			),
		).toEqual({ id: 'envelope' });
		const added = { id: 'second', signer_ids: ['signer'], max_total_credits: 0 };
		await run(
			['envelopes', 'add-document', 'envelope', '--data', JSON.stringify(added)],
			[{ method: 'POST', path: '/accounts/account/envelopes/envelope/documents', body: added }],
		);
		await run(['envelopes', 'remove-document', 'envelope', 'second'], [], true);
		await run(
			['envelopes', 'remove-document', 'envelope', 'second', '--yes'],
			[{ method: 'DELETE', path: '/accounts/account/envelopes/envelope/documents/second' }],
		);
		await run(
			['embed', 'origins', 'create', '--origin', 'https://app.example.com'],
			[
				{
					method: 'POST',
					path: '/accounts/account/embed-origins',
					body: { origin: 'https://app.example.com' },
				},
			],
		);
		await run(
			['embed', 'session', 'document', 'assignment', 'signer'],
			[
				{
					method: 'POST',
					path: '/documents/document/assignments/assignment/signers/signer/embed-sessions',
					response: {
						url: 'https://example.com/embed/session-token',
						expires_at: '2026-11-11T12:05:00Z',
					},
				},
			],
		);
		await run(
			['embed', 'exchange', '--parent-origin', 'https://app.example.com'],
			[
				{
					method: 'POST',
					path: '/embed/sessions/session-token/exchange',
					public: true,
					body: { parent_origin: 'https://app.example.com' },
					response: {
						signer_access_code: 'example-code',
						document_id: 'document',
						signer_id: 'signer',
					},
				},
			],
		);
		await run(
			['signer', 'confirm-data', 'document', '--email', 'signer@example.com', '--accept-terms'],
			[
				{
					method: 'GET',
					path: '/documents/document',
					public: true,
					code: true,
					response: { id: 'document' },
				},
				{
					method: 'PUT',
					path: '/documents/document/signers/confirm-data',
					public: true,
					code: true,
					body: { email: 'signer@example.com', has_accepted_terms: true },
				},
			],
		);
		await run(
			['signer', 'sign', 'document', 'assignment', '--entries', '[]'],
			[
				{
					method: 'GET',
					path: '/sign',
					public: true,
					code: true,
					response: { id: 'document', assignment: { id: 'assignment', method: 'virtual' } },
				},
				{
					method: 'POST',
					path: '/documents/document/assignments/assignment',
					public: true,
					code: true,
					body: [],
				},
			],
		);
		await run(
			['signer', 'certified-copy', '--document-id', 'document'],
			[
				{
					method: 'POST',
					path: '/sign/certified-copy',
					public: true,
					code: true,
					body: { document_id: 'document' },
					response: {
						available: true,
						notification_method: 'Email',
						resends_left: null,
						sent_to: 's***@example.com',
					},
				},
			],
		);
		const pdf = Buffer.from('%PDF-1.7\nexample');
		const output = path.join(directory, 'signed.pdf');
		await run(
			['signer', 'download-copy', '--output', output],
			[{ method: 'GET', path: '/signers/downloads/download-token', public: true, response: pdf }],
		);
		expect(readFileSync(output)).toEqual(pdf);
		if (process.platform !== 'win32') expect(statSync(output).mode & 0o777).toBe(0o600);
		await run(
			[
				'workspaces',
				'notification-policy',
				'update',
				'account',
				'--data',
				'{"owners_receive_all":false}',
			],
			[
				{
					method: 'PUT',
					path: '/accounts/account/notification-policy',
					body: { owners_receive_all: false },
				},
			],
		);
		await run(
			['users', 'push-preferences', 'update', '--set', '{"SignerViewed":false}'],
			[{ method: 'PUT', path: '/users/self/push-preferences', body: { SignerViewed: false } }],
		);
		await run(
			['webhooks', 'endpoints', 'test', 'endpoint'],
			[{ method: 'POST', path: '/accounts/account/webhooks/endpoints/endpoint/test' }],
		);
		await run(
			['webhooks', 'endpoints', 'rotate-secret', 'endpoint', '--keep-previous', '--yes'],
			[
				{
					method: 'POST',
					path: '/accounts/account/webhooks/endpoints/endpoint/secret/rotate',
					body: { keep_previous: true },
					response: {
						secret: 'example-secret',
						previous_secret_expires_at: '2026-11-12T12:00:00Z',
					},
				},
			],
		);
		await run(
			['envelopes', 'cancel', 'envelope', '--yes'],
			[{ method: 'PUT', path: '/accounts/account/envelopes/envelope/cancel' }],
		);
		await run(
			['envelopes', 'delete', 'envelope', '--yes'],
			[{ method: 'DELETE', path: '/accounts/account/envelopes/envelope' }],
		);
	} finally {
		server.closeAllConnections();
		await new Promise<void>((resolve) => server.close(() => resolve()));
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(directory, { recursive: true, force: true });
		process.exitCode = 0;
	}
});
