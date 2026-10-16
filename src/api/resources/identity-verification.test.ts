import type { AxiosAdapter } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AssinafyClient } from '../client';
import { ApiError, ValidationError } from '../errors';
import type { ISignerIdentityReview } from '../types';

const captureUrl = 'https://example.com/capture#t=example-private-token';
const session = { id: 'session', url: captureUrl, expires_at: null };
const state = {
	can_start: false,
	status: 'Pending',
	url: captureUrl,
	expires_at: null,
	completed_at: null,
};
const review = {
	id: 'verification',
	status: 'InReview',
	provider: 'AssinafyVerify',
	verification_method: 'IdDocumentFaceMatchBasic',
	reason_codes: [{ code: 'NAME_MISMATCH', description: 'Name differs' }],
	evidence_available: true,
	expected: { name: 'Example Signer', cpf: '00000000000' },
	document: { type: 'CNH', name: 'Example Name', cpf: '00000000000' },
	matches: { cpf: true, name: 0.52, birth_date: null },
	checks: [{ name: 'name', result: 'review', score: 0.52, reasons: ['NAME_MISMATCH'] }],
	images: ['document_front', 'document_back', 'document_pdf', 'face'],
	ruleset_version: 'example-rules',
	evidence_sha256: null,
	reviewed_by: null,
	reviewed_at: null,
	review_note: null,
	completed_at: null,
} satisfies ISignerIdentityReview;

function clientWithResponse(data: unknown) {
	const client = new AssinafyClient({ apiKey: 'example-owner-key', accountId: 'account' });
	const http = client.getAxiosInstance();
	http.defaults.headers.common.Authorization = 'Bearer example-owner-token';
	const adapter = vi.fn<AxiosAdapter>(async (config) => ({
		config,
		status: 200,
		statusText: 'OK',
		headers: {},
		data: { status: 200, data },
	}));
	http.defaults.adapter = adapter;
	return { client, http, adapter };
}

describe('signer identity verification', () => {
	it('preserves the complete session and status responses without forwarding owner headers', async () => {
		const { client, http, adapter } = clientWithResponse(session);
		expect(
			await client.signerDocuments.startIdentityVerification('access-code', { consent: true }),
		).toEqual(session);
		const sent = adapter.mock.calls[0]![0];
		expect(JSON.parse(sent.data)).toEqual({ consent: true });
		adapter.mockImplementation(async (config) => ({
			config,
			status: 200,
			statusText: 'OK',
			headers: {},
			data: { status: 200, data: state },
		}));
		expect(await client.signerDocuments.getIdentityVerification('access-code')).toEqual(state);
		for (const [config] of adapter.mock.calls) {
			expect(config.headers.get('X-Api-Key')).toBeUndefined();
			expect(config.headers.get('Authorization')).toBeUndefined();
			expect(new URL(http.getUri(config)).searchParams.get('signer-access-code')).toBe(
				'access-code',
			);
		}
	});

	it('requires an access code and explicit boolean consent before transport', async () => {
		const { client, adapter } = clientWithResponse(session);
		for (const consent of [undefined, false, 'true', 1]) {
			await expect(
				client.signerDocuments.startIdentityVerification('code', { consent } as never),
			).rejects.toThrow(/consent/);
		}
		await expect(
			client.signerDocuments.startIdentityVerification('', { consent: true }),
		).rejects.toThrow(ValidationError);
		await expect(client.signerDocuments.getIdentityVerification(' ')).rejects.toThrow(
			ValidationError,
		);
		expect(adapter).not.toHaveBeenCalled();
	});

	it('never retries a provider-session write after a server failure', async () => {
		const { client, adapter } = clientWithResponse(session);
		adapter.mockRejectedValue(new ApiError('Session already exists', 400));
		await expect(
			client.signerDocuments.startIdentityVerification('code', { consent: true }),
		).rejects.toMatchObject({ statusCode: 400 });
		expect(adapter).toHaveBeenCalledTimes(1);
	});
});

describe('account identity review', () => {
	it('preserves evidence and forwards review decisions, null notes, and Unicode notes', async () => {
		const { client, adapter } = clientWithResponse(review);
		expect(await client.assignments.getIdentityVerification('doc', 'assignment', 'signer')).toEqual(
			review,
		);
		for (const note of [undefined, null, '😀'.repeat(2000)]) {
			await client.assignments.reviewIdentityVerification('doc', 'assignment', 'signer', {
				decision: 'Approved',
				note,
			});
			expect(JSON.parse(adapter.mock.calls.at(-1)![0].data)).toEqual({
				decision: 'Approved',
				...(note === undefined ? {} : { note }),
			});
		}
		await client.assignments.reviewIdentityVerification('doc', 'assignment', 'signer', {
			decision: 'Rejected',
			note: 'Example review',
		});
		expect(JSON.parse(adapter.mock.calls.at(-1)![0].data)).toEqual({
			decision: 'Rejected',
			note: 'Example review',
		});
	});

	it('validates decisions, note length, path IDs and evidence names before transport', async () => {
		const { client, adapter } = clientWithResponse(review);
		await expect(
			client.assignments.reviewIdentityVerification('doc', 'assignment', 'signer', {
				decision: 'approve',
			} as never),
		).rejects.toThrow(/decision/);
		for (const note of ['😀'.repeat(2001), 123]) {
			await expect(
				client.assignments.reviewIdentityVerification('doc', 'assignment', 'signer', {
					decision: 'Approved',
					note,
				} as never),
			).rejects.toThrow(/note/);
		}
		await expect(
			client.assignments.getIdentityVerification('doc/other', 'assignment', 'signer'),
		).rejects.toThrow(ValidationError);
		await expect(
			client.assignments.downloadIdentityVerificationImage('doc', '', 'signer', 'face'),
		).rejects.toThrow(ValidationError);
		await expect(
			client.assignments.downloadIdentityVerificationImage(
				'doc',
				'assignment',
				'signer',
				'../face' as never,
			),
		).rejects.toThrow(ValidationError);
		expect(adapter).not.toHaveBeenCalled();
	});

	it('returns image/PDF bytes and keeps binary JSON failures in the shared error pipeline', async () => {
		const { client, http, adapter } = clientWithResponse(review);
		const bytes = Buffer.from('example-evidence');
		adapter.mockImplementation(async (config) => ({
			config,
			status: 200,
			statusText: 'OK',
			headers: {},
			data: bytes,
		}));
		expect(
			await client.assignments.downloadIdentityVerificationImage(
				'doc',
				'assignment',
				'signer',
				'document_pdf',
			),
		).toEqual(bytes);
		expect(adapter.mock.calls[0]![0].responseType).toBe('arraybuffer');
		http.defaults.adapter = async (config) => {
			throw {
				isAxiosError: true,
				config,
				response: { status: 404, data: Buffer.from('{"message":"Review is closed"}') },
			};
		};
		await expect(
			client.assignments.downloadIdentityVerificationImage('doc', 'assignment', 'signer', 'face'),
		).rejects.toMatchObject({ statusCode: 404, message: 'Review is closed' });
	});

	it('does not retry review decisions after an ambiguous transport failure', async () => {
		const { client, adapter } = clientWithResponse(review);
		adapter.mockRejectedValue({
			isAxiosError: true,
			message: 'Connection reset',
			config: {},
		});
		await expect(
			client.assignments.reviewIdentityVerification('doc', 'assignment', 'signer', {
				decision: 'Rejected',
			}),
		).rejects.toThrow('Connection reset');
		expect(adapter).toHaveBeenCalledTimes(1);
	});
});
