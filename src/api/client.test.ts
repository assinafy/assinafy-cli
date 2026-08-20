import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { AssinafyClient } from './client';

async function listen(server: Server): Promise<string> {
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('Test server did not bind');
	return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server): Promise<void> {
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
}

describe('AssinafyClient transport security', () => {
	it('requires HTTPS unless insecure local development is explicitly enabled', () => {
		expect(
			() => new AssinafyClient({ apiKey: 'test-key', baseUrl: 'http://example.test' }),
		).toThrow(/HTTPS/);
		expect(
			new AssinafyClient({
				apiKey: 'test-key',
				baseUrl: 'http://127.0.0.1:3000',
				allowInsecureHttp: true,
			}),
		).toBeInstanceOf(AssinafyClient);
		expect(
			() => new AssinafyClient({ apiKey: 'test-key', baseUrl: 'https://example.test/v1?x=1' }),
		).toThrow(/query string or fragment/);
		expect(
			() => new AssinafyClient({ apiKey: 'test-key', baseUrl: 'https://example.test/v1#docs' }),
		).toThrow(/query string or fragment/);
	});

	it('does not forward credentials through an HTTP redirect', async () => {
		let targetHits = 0;
		const target = createServer((_request, response) => {
			targetHits++;
			response.end();
		});
		const targetUrl = await listen(target);
		const redirect = createServer((_request, response) => {
			response.writeHead(302, { Location: `${targetUrl}/capture` });
			response.end();
		});
		const redirectUrl = await listen(redirect);
		try {
			const client = new AssinafyClient({
				apiKey: 'test-key',
				baseUrl: redirectUrl,
				allowInsecureHttp: true,
			});
			await expect(client.documents.statuses()).rejects.toMatchObject({ statusCode: 302 });
			expect(targetHits).toBe(0);
		} finally {
			await close(redirect);
			await close(target);
		}
	});

	it('omits owner credentials from public and signer-code requests', async () => {
		const capturedHeaders: IncomingHttpHeaders[] = [];
		const server = createServer((request, response) => {
			capturedHeaders.push(request.headers);
			response.setHeader('Content-Type', 'application/json');
			response.end(
				JSON.stringify({ status: 200, data: { id: 'signer1', success: true, is_valid: false } }),
			);
		});
		const baseUrl = await listen(server);
		try {
			const client = new AssinafyClient({
				apiKey: 'owner-test-key',
				accountId: 'account1',
				baseUrl,
				allowInsecureHttp: true,
			});
			await client.fields.validate('field1', 'value', { signerAccessCode: 'signer-code' });
			await client.signerDocuments.self('signer-code');
			await client.auth.login('person@example.test', 'password');
			await client.documents.verify('signaturehash');
			await client.documents.getPublic('document1');
			await client.documents.sendToken('document1', { email: 'person@example.test' });
			expect(capturedHeaders).toHaveLength(6);
			for (const headers of capturedHeaders) {
				expect(headers).not.toHaveProperty('x-api-key');
				expect(headers).not.toHaveProperty('authorization');
			}
		} finally {
			await close(server);
		}
	});
});

describe('AssinafyClient.uploadAndRequestSignatures', () => {
	it.each([
		{ signers: [{ name: '', email: 'ana@example.com' }] },
		{ signers: [{ name: 'Ana Lima', email: 'not-an-email' }] },
		{
			signers: [{ name: 'Ana Lima', email: 'ana@example.com' }],
			expiresAt: '2026-02-31T00:00:00Z',
		},
	])('rejects invalid local input before uploading: $signers', async (input) => {
		const client = new AssinafyClient({ apiKey: 'test-key', accountId: 'acc' });
		const upload = vi.spyOn(client.documents, 'upload');

		await expect(
			client.uploadAndRequestSignatures({
				source: { buffer: Buffer.from('%PDF-1.7'), fileName: 'contract.pdf' },
				waitForReady: false,
				...input,
			}),
		).rejects.toThrow();
		expect(upload).not.toHaveBeenCalled();
	});

	it('forwards each signer assignment control after creating the signer', async () => {
		const client = new AssinafyClient({ apiKey: 'test-key', accountId: 'acc' });
		vi.spyOn(client.documents, 'upload').mockResolvedValue({ id: 'document1' } as never);
		vi.spyOn(client.signers, 'create').mockResolvedValue({ id: 'signer1' } as never);
		const createAssignment = vi
			.spyOn(client.assignments, 'create')
			.mockResolvedValue({ id: 'assignment1' } as never);

		await client.uploadAndRequestSignatures({
			source: { buffer: Buffer.from('%PDF-1.7'), fileName: 'contract.pdf' },
			waitForReady: false,
			signers: [
				{
					name: 'Ana Lima',
					email: 'ana@example.com',
					verification_method: 'Whatsapp',
					notification_methods: ['Whatsapp'],
					step: 1,
				},
			],
		});

		expect(createAssignment).toHaveBeenCalledWith('document1', {
			method: 'virtual',
			signers: [
				{
					id: 'signer1',
					verification_method: 'Whatsapp',
					notification_methods: ['Whatsapp'],
					step: 1,
				},
			],
		});
	});

	it('uses WhatsApp assignment controls for a phone-only signer', async () => {
		const client = new AssinafyClient({ apiKey: 'test-key', accountId: 'acc' });
		vi.spyOn(client.documents, 'upload').mockResolvedValue({ id: 'document1' } as never);
		vi.spyOn(client.signers, 'create').mockResolvedValue({ id: 'signer1' } as never);
		const createAssignment = vi
			.spyOn(client.assignments, 'create')
			.mockResolvedValue({ id: 'assignment1' } as never);

		await client.uploadAndRequestSignatures({
			source: { buffer: Buffer.from('%PDF-1.7'), fileName: 'contract.pdf' },
			waitForReady: false,
			signers: [{ name: 'Ana Lima', whatsapp_phone_number: '+5500000000000' }],
		});

		expect(createAssignment).toHaveBeenCalledWith('document1', {
			method: 'virtual',
			signers: [
				{
					id: 'signer1',
					verification_method: 'Whatsapp',
					notification_methods: ['Whatsapp'],
					step: undefined,
				},
			],
		});
	});
});
