import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Command } from '@commander-js/extra-typings';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ApiError, type IDocumentUploadResponse, OAuthResource } from '../api';
import { DocumentResource } from '../api/resources/documents';
import { SignerDocumentsResource } from '../api/resources/signer-documents';
import { readConfigFile } from '../lib/config';
import * as browserOAuth from '../lib/oauth-browser';
import { configCommand } from './config';
import { documentsCommand } from './documents';
import { oauthCommand } from './oauth';
import { signerCommand } from './signer';

let directory: string;
let stdout: string;
let stderr: string;
const uploaded: IDocumentUploadResponse = {
	id: 'example-document',
	account_id: 'example-account',
	template_id: null,
	name: 'example.pdf',
	status: 'uploaded',
	artifacts: { original: 'https://example.com/original.pdf' },
	pages: [],
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	is_closed: false,
	decline_reason: null,
	declined_by: null,
};
const tokens = {
	access_token: 'example-access',
	token_type: 'Bearer',
	expires_in: 3600,
	scope: 'documents:read',
	refresh_token: 'example-next-refresh',
};

it('replaces a saved owner key when switching the profile to OAuth', async () => {
	for (const args of [
		['--api-key', 'example-key'],
		['--token', 'example-oauth-token'],
	]) {
		const program = new Command()
			.option('--json')
			.option('--api-key <key>')
			.option('--token <token>')
			.addCommand(configCommand);
		await program.parseAsync(['--json', ...args, 'config', 'set'], { from: 'user' });
	}
	expect(readConfigFile().profiles?.default).toEqual({ token: 'example-oauth-token' });
});

beforeEach(() => {
	directory = mkdtempSync(path.join(tmpdir(), 'assinafy-command-'));
	vi.stubEnv('ASSINAFY_CONFIG_DIR', directory);
	vi.stubEnv('ASSINAFY_API_KEY', 'example-owner');
	vi.stubEnv('ASSINAFY_TOKEN', undefined);
	vi.stubEnv('ASSINAFY_ACCOUNT_ID', 'example-account');
	vi.stubEnv('ASSINAFY_BASE_URL', 'https://api.example.com/v1');
	vi.stubEnv('ASSINAFY_OAUTH_CLIENT_ID', undefined);
	vi.stubEnv('ASSINAFY_OAUTH_CLIENT_SECRET', undefined);
	stdout = '';
	stderr = '';
	vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
		stdout += String(chunk);
		return true;
	});
	vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
		stderr += String(chunk);
		return true;
	});
	process.exitCode = 0;
});
afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
	rmSync(directory, { recursive: true, force: true });
	process.exitCode = 0;
});

it.each(['verify-code', 'verify-email'])(
	'verifies signer OTPs through %s without owner credentials',
	async (name) => {
		vi.stubEnv('ASSINAFY_API_KEY', undefined);
		vi.stubEnv('ASSINAFY_SIGNER_ACCESS_CODE', 'example-code');
		vi.stubEnv('ASSINAFY_VERIFICATION_CODE', '012345');
		const verify = vi.spyOn(SignerDocumentsResource.prototype, 'verifyCode').mockResolvedValue([]);
		const program = new Command().option('--json').addCommand(signerCommand);
		await program.parseAsync(['--json', 'signer', name], { from: 'user' });
		expect(verify).toHaveBeenCalledWith({
			signerAccessCode: 'example-code',
			verificationCode: '012345',
		});
		expect(JSON.parse(stdout)).toEqual([]);
		expect(stderr).toBe('');
	},
);

it('passes certificate operation tokens through the CLI without owner credentials', async () => {
	vi.stubEnv('ASSINAFY_API_KEY', undefined);
	vi.stubEnv('ASSINAFY_SIGNER_ACCESS_CODE', 'example-code');
	const start = vi
		.spyOn(SignerDocumentsResource.prototype, 'startCertificate')
		.mockResolvedValue({ token: 'example-token' });
	const complete = vi
		.spyOn(SignerDocumentsResource.prototype, 'completeCertificate')
		.mockResolvedValue({ signerName: 'Example Signer' });
	const program = new Command().option('--json').addCommand(signerCommand);
	await program.parseAsync(['--json', 'signer', 'certificate-start'], { from: 'user' });
	expect(start).toHaveBeenCalledWith('example-code');
	expect(JSON.parse(stdout)).toEqual({ token: 'example-token' });
	stdout = '';
	vi.stubEnv('ASSINAFY_CERTIFICATE_TOKEN', 'example-token');
	await program.parseAsync(['--json', 'signer', 'certificate-complete'], { from: 'user' });
	expect(complete).toHaveBeenCalledWith('example-code', 'example-token');
	expect(JSON.parse(stdout)).toEqual({ signerName: 'Example Signer' });
	expect(stderr).toBe('');
});

it('prints the processed document after upload --wait', async () => {
	vi.spyOn(DocumentResource.prototype, 'upload').mockResolvedValue(uploaded);
	vi.spyOn(DocumentResource.prototype, 'waitUntilReady').mockResolvedValue({
		...uploaded,
		status: 'metadata_ready',
		assignment: null,
		signing_url: undefined,
	});
	const program = new Command().option('--json').addCommand(documentsCommand);
	await program.parseAsync(['--json', 'documents', 'upload', 'example.pdf', '--wait'], {
		from: 'user',
	});
	expect(JSON.parse(stdout)).toMatchObject({ id: uploaded.id, status: 'metadata_ready' });
});

it('preserves the uploaded document ID and HTTP status when waiting fails', async () => {
	const upload = vi.spyOn(DocumentResource.prototype, 'upload').mockResolvedValue(uploaded);
	vi.spyOn(DocumentResource.prototype, 'waitUntilReady').mockRejectedValue(
		new ApiError('Unavailable', 503),
	);
	const program = new Command().option('--json').addCommand(documentsCommand);
	await program.parseAsync(['--json', 'documents', 'upload', 'example.pdf', '--wait'], {
		from: 'user',
	});
	expect(JSON.parse(stderr).error).toMatchObject({
		statusCode: 503,
		details: { documentId: uploaded.id },
	});
	expect(upload).toHaveBeenCalledTimes(1);
	expect(stdout).toBe('');
	expect(process.exitCode).toBe(1);
});

it('uses OAuth environment variables and prints the complete rotated token response', async () => {
	vi.stubEnv('ASSINAFY_OAUTH_CLIENT_ID', 'example-client');
	vi.stubEnv('ASSINAFY_OAUTH_CLIENT_SECRET', 'example-secret');
	vi.stubEnv('ASSINAFY_OAUTH_REFRESH_TOKEN', 'example-current-refresh');
	const token = vi.spyOn(OAuthResource.prototype, 'token').mockResolvedValue(tokens);
	const program = new Command().option('--json').addCommand(oauthCommand);
	await program.parseAsync(
		['--json', 'oauth', 'refresh', '--resource', 'https://api.example.com'],
		{ from: 'user' },
	);
	expect(token).toHaveBeenCalledWith({
		grant_type: 'refresh_token',
		client_id: 'example-client',
		client_secret: 'example-secret',
		refresh_token: 'example-current-refresh',
		resource: 'https://api.example.com',
	});
	expect(JSON.parse(stdout)).toEqual(tokens);
	expect(stderr).toBe('');
});

it('loads the saved authorization request and passes the complete callback to validation', async () => {
	const request = {
		authorization_url: 'https://auth.example.com/oauth/authorize',
		state: 'example-state',
		code_verifier: 'a'.repeat(43),
		issuer: 'https://auth.example.com',
		client_id: 'example-client',
		redirect_uri: 'https://example.com/callback',
		resource: 'https://api.example.com',
	};
	const file = path.join(directory, 'pending.json');
	writeFileSync(file, JSON.stringify(request), { mode: 0o600 });
	const callback =
		'https://example.com/callback?code=example-code&state=example-state&iss=https%3A%2F%2Fauth.example.com';
	vi.stubEnv('ASSINAFY_OAUTH_CALLBACK_URL', callback);
	vi.stubEnv('ASSINAFY_OAUTH_CLIENT_SECRET', 'example-secret');
	const exchange = vi.spyOn(OAuthResource.prototype, 'exchangeCode').mockResolvedValue(tokens);
	const program = new Command().option('--json').addCommand(oauthCommand);
	await program.parseAsync(['--json', 'oauth', 'exchange', '--request', file], { from: 'user' });
	expect(exchange).toHaveBeenCalledWith(callback, request, 'example-secret');
	expect(JSON.parse(stdout)).toEqual(tokens);
});

it.each([true, false])(
	'connects a public OAuth app with browser opening set to %s',
	async (browser) => {
		vi.stubEnv('ASSINAFY_OAUTH_CLIENT_SECRET', 'example-unused-confidential-secret');
		const url = 'https://auth.example.com/oauth/authorize?state=example-state';
		const connect = vi
			.spyOn(browserOAuth, 'connectOAuth')
			.mockImplementation(async (_oauth, _options, authorize) => {
				await authorize(url);
				return tokens;
			});
		const open = vi.spyOn(browserOAuth, 'openBrowser').mockRejectedValue(new Error('No browser'));
		const program = new Command().option('--json').addCommand(oauthCommand);
		await program.parseAsync(
			['--json', 'oauth', 'connect', '--timeout', '120', ...(browser ? [] : ['--no-browser'])],
			{ from: 'user' },
		);
		expect(connect).toHaveBeenCalledWith(
			expect.any(OAuthResource),
			{
				clientId: '96BZZ0sZTb2NkEXt1GCaIRCTprI2YKHZr8JDHawuXUyCLC88',
				redirectUri: 'https://integrations.assinafy.com.br/assinafy-cli/oauth-callback',
				scopes: [
					'account:read',
					'documents:read',
					'documents:write',
					'templates:read',
					'templates:write',
					'openid',
					'profile',
					'email',
					'offline_access',
				],
			},
			expect.any(Function),
			120_000,
		);
		expect(open).toHaveBeenCalledTimes(browser ? 1 : 0);
		expect(JSON.parse(stdout)).toEqual(tokens);
		expect(stderr).toContain(url);
		expect(stderr).not.toContain('example-unused-confidential-secret');
		expect(stderr.includes('Could not open')).toBe(browser);
	},
);

it('allows explicit client and scope selections over environment and bundled defaults', async () => {
	vi.stubEnv('ASSINAFY_OAUTH_CLIENT_ID', 'example-public-client');
	const connect = vi.spyOn(browserOAuth, 'connectOAuth').mockResolvedValue(tokens);
	const program = new Command().option('--json').addCommand(oauthCommand);
	await program.parseAsync(
		[
			'--json',
			'oauth',
			'connect',
			'--client-id',
			'example-flag-client',
			'--scope',
			'templates:read templates:write',
		],
		{ from: 'user' },
	);
	expect(connect.mock.calls[0]![1]).toMatchObject({
		clientId: 'example-flag-client',
		scopes: ['templates:read', 'templates:write'],
	});
	expect(JSON.parse(stdout)).toEqual(tokens);
});

it.each(['refresh', 'revoke'] as const)(
	'uses the bundled public client ID for %s',
	async (name) => {
		const token = vi.spyOn(OAuthResource.prototype, 'token').mockResolvedValue(tokens);
		const revoke = vi.spyOn(OAuthResource.prototype, 'revoke').mockResolvedValue(undefined);
		const program = new Command().option('--json').addCommand(oauthCommand);
		await program.parseAsync(['--json', 'oauth', name, `--${name}-token`, 'example-token'], {
			from: 'user',
		});
		expect(name === 'refresh' ? token : revoke).toHaveBeenCalledWith(
			expect.objectContaining({
				client_id: '96BZZ0sZTb2NkEXt1GCaIRCTprI2YKHZr8JDHawuXUyCLC88',
				client_secret: undefined,
			}),
		);
		expect(JSON.parse(stdout)).toEqual(name === 'refresh' ? tokens : { revoked: true });
		expect(stderr).toBe('');
	},
);
