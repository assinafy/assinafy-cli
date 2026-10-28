import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AssinafyClient } from '../client';
import type { ISetContractPayload } from '../contract-types';
import { ApiError, ValidationError } from '../errors';

function fixture(response: unknown = { resource: 'document_contract', document_id: 'document' }) {
	const client = new AssinafyClient({ apiKey: 'example-key', accountId: 'account' });
	const adapter = vi.fn(async (config) => ({
		status: 200,
		statusText: 'OK',
		config,
		headers: { 'x-pagination-current-page': '2', 'x-pagination-total-count': '3' },
		data: { status: 200, data: response },
	}));
	client.getAxiosInstance().defaults.adapter = adapter;
	return { client, contracts: client.contracts, adapter };
}

describe('contract terms', () => {
	it('accepts early-year date filters without allowing early stored terms', async () => {
		const { contracts, adapter } = fixture([]);
		await contracts.list({ end_date_from: '0999-01-01', end_date_to: '0999-12-31' });
		expect(adapter.mock.calls[0]?.[0].params).toMatchObject({
			end_date_from: '0999-01-01',
			end_date_to: '0999-12-31',
		});
		await expect(contracts.set('document', { start_date: '0999-01-01' })).rejects.toBeInstanceOf(
			ValidationError,
		);
		expect(adapter).toHaveBeenCalledTimes(1);
	});
	it('normalizes list statuses and pagination without losing zero or external IDs', async () => {
		const { contracts, adapter } = fixture([]);
		await expect(
			contracts.list(
				{
					status: ['active', 'expired'],
					ending_within_days: 0,
					external_system: 'ERP',
					external_id: 'A/1?x',
					per_page: 2,
					page: 2,
					expand: 'document',
				},
				'other',
			),
		).resolves.toEqual({ data: [], meta: { current_page: 2, total: 3 } });
		expect(adapter.mock.calls[0]?.[0]).toMatchObject({
			url: '/accounts/other/contracts',
			params: {
				status: 'active,expired',
				ending_within_days: 0,
				external_system: 'ERP',
				external_id: 'A/1?x',
				'per-page': 2,
				page: 2,
				expand: 'document',
			},
		});
	});

	it('preserves every set field, null clearing, empty lists, zero and false', async () => {
		const { contracts, adapter } = fixture();
		const payload: ISetContractPayload = {
			status: 'draft',
			counterparty_name: null,
			counterparty_taxpayer_id: null,
			value: 0,
			currency: 'brl',
			start_date: '2028-02-29',
			end_date: null,
			auto_renew: false,
			renewal_term_months: null,
			notice_period_days: 0,
			owner_id: null,
			metadata: {},
			external_references: [],
			updated_at: '2026-10-23T12:00:00.000Z',
		};
		await contracts.set('document', payload);
		expect(JSON.parse(adapter.mock.calls[0]?.[0].data)).toEqual(payload);
		expect(payload.currency).toBe('brl');
	});

	it('preserves amendment deltas and forwards unlinking without filtering nulls', async () => {
		const response = {
			resource: 'document_contract_amendment',
			status: 'pending',
			parent_document_id: 'root',
			terms: { value: 100 },
			changes: null,
		};
		const { contracts, adapter } = fixture(response);
		await expect(
			contracts.set('amendment', {
				parent_document_id: 'root',
				relation_type: 'amendment',
				value: 100,
			}),
		).resolves.toEqual(response);
		await contracts.set('amendment', { value: null, parent_document_id: null });
		expect(JSON.parse(adapter.mock.calls[1]?.[0].data)).toEqual({
			value: null,
			parent_document_id: null,
		});
	});

	it.each([
		{},
		[],
		null,
		{ value: undefined },
		{ value: -1 },
		{ value: Number.NaN },
		{ value: Infinity },
		{ value: 1.001 },
		{ start_date: '2026-02-30' },
		{ end_date: '0999-01-01' },
		{ start_date: '2027-01-02', end_date: '2027-01-01' },
		{ updated_at: 'yesterday' },
		{ status: null },
		{ status: 'pending_signature' },
		{ auto_renew: 'false' },
		{ notice_period_days: 3651 },
		{ renewal_term_months: 0 },
		{ currency: 'US' },
		{ metadata: [] },
		{ metadata: { amount: 1 } },
		{ metadata: { 'bad key': 'text' } },
		{ external_references: [{ system: 'erp', id: '💰' }] },
		{ external_references: {} },
	])('rejects invalid contract input before sending: %j', async (payload) => {
		const { contracts, adapter } = fixture();
		await expect(contracts.set('document', payload as ISetContractPayload)).rejects.toBeInstanceOf(
			ValidationError,
		);
		expect(adapter).not.toHaveBeenCalled();
	});

	it('requires a renewal guard and preserves null value with a current term', async () => {
		const { contracts, adapter } = fixture();
		for (const payload of [{}, { end_date: null }, { term: 0 }, { term: 1.2 }])
			await expect(contracts.renew('document', payload)).rejects.toBeInstanceOf(ValidationError);
		expect(adapter).not.toHaveBeenCalled();
		await contracts.renew('document', { term: 2, value: null, end_date: '' });
		await contracts.renew('document', { end_date: '2028-06-30' });
		expect(JSON.parse(adapter.mock.calls[0]?.[0].data)).toEqual({
			term: 2,
			value: null,
			end_date: '',
		});
	});

	it('counts termination reason as Unicode characters and supports an empty body', async () => {
		const { contracts, adapter } = fixture();
		await contracts.terminate('document', { reason: '🙂'.repeat(500) });
		await expect(contracts.terminate('document', { reason: '🙂'.repeat(501) })).rejects.toThrow(
			'500',
		);
		await contracts.terminate('document');
		expect(JSON.parse(adapter.mock.calls[1]?.[0].data)).toEqual({});
	});

	it.each(['../other', 'a/b', 'a?x', 'a%2fb', ' '])('rejects unsafe path IDs: %s', async (id) => {
		const { contracts, adapter } = fixture();
		await expect(contracts.get(id)).rejects.toBeInstanceOf(ValidationError);
		await expect(contracts.related('document', id)).rejects.toBeInstanceOf(ValidationError);
		expect(adapter).not.toHaveBeenCalled();
	});

	it.each([
		{ status: 'active,other' },
		{ status: [] },
		{ ending_within_days: -1 },
		{ ending_within_days: 1.5 },
		{ end_date_from: '2026-02-30' },
		{ sort: 'name' },
		{ expand: 'assignment' },
	])('rejects invalid list filters: %j', async (params) => {
		const { contracts, adapter } = fixture();
		await expect(contracts.list(params as never)).rejects.toBeInstanceOf(ValidationError);
		expect(adapter).not.toHaveBeenCalled();
	});

	it('preserves structured 409 conflicts and never retries a write', async () => {
		const { client, contracts } = fixture();
		const data = {
			status: 409,
			message: 'Contract changed',
			errors: [{ field: 'updated_at', code: 'ContractChanged' }],
		};
		const adapter = vi.fn(async (config) => {
			throw new AxiosError('Conflict', 'ERR_BAD_REQUEST', config, undefined, {
				config,
				data,
				status: 409,
				statusText: 'Conflict',
				headers: new AxiosHeaders(),
			});
		});
		client.getAxiosInstance().defaults.adapter = adapter;
		await expect(
			contracts.set('document', { value: 10, updated_at: '2026-10-23T12:00:00Z' }),
		).rejects.toMatchObject({ statusCode: 409, responseData: data });
		expect(adapter).toHaveBeenCalledTimes(1);
	});

	it('retains missing terms as a 404 rather than an empty contract', async () => {
		const { client, contracts } = fixture();
		client.getAxiosInstance().defaults.adapter = async () => {
			throw new ApiError('Not found', 404);
		};
		await expect(contracts.get('document')).rejects.toMatchObject({ statusCode: 404 });
	});
});
