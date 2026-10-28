import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Command } from '@commander-js/extra-typings';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ContractResource } from '../api';
import * as prompts from '../lib/prompts';
import { contractsCommand } from './contracts';

let directory: string;
let stdout: string;
beforeEach(() => {
	directory = mkdtempSync(path.join(tmpdir(), 'assinafy-contract-command-'));
	vi.stubEnv('ASSINAFY_CONFIG_DIR', directory);
	vi.stubEnv('ASSINAFY_API_KEY', 'example-key');
	vi.stubEnv('ASSINAFY_ACCOUNT_ID', 'account');
	stdout = '';
	vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
		stdout += String(chunk);
		return true;
	});
	vi.spyOn(process.stderr, 'write').mockReturnValue(true);
	process.exitCode = 0;
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
	rmSync(directory, { recursive: true, force: true });
	process.exitCode = 0;
});
async function run(args: string[]) {
	await new Command()
		.option('--json')
		.option('-q, --quiet')
		.addCommand(contractsCommand)
		.parseAsync(['--json', '-q', 'contracts', ...args], { from: 'user' });
}

it('forwards all contract filters including today and pagination', async () => {
	const list = vi
		.spyOn(ContractResource.prototype, 'list')
		.mockResolvedValue({ data: [], meta: { total: 0 } });
	await run([
		'list',
		'--status',
		'active,expired',
		'--ending-within-days',
		'0',
		'--external-system',
		'erp',
		'--external-id',
		'A/1',
		'--expand',
		'document',
		'--page',
		'2',
		'--per-page',
		'10',
		'--sort=-updated_at',
	]);
	expect(list).toHaveBeenCalledWith(
		expect.objectContaining({
			status: 'active,expired',
			ending_within_days: 0,
			external_system: 'erp',
			external_id: 'A/1',
			expand: 'document',
			page: 2,
			'per-page': 10,
			sort: '-updated_at',
		}),
		'account',
	);
	expect(JSON.parse(stdout)).toEqual({ data: [], meta: { total: 0 } });
});

it('passes JSON terms unchanged including explicit clearing and amendment links', async () => {
	const response = { document_id: 'document', status: 'pending', parent_document_id: 'root' };
	const set = vi.spyOn(ContractResource.prototype, 'set').mockResolvedValue(response as never);
	const payload = {
		value: null,
		notice_period_days: 0,
		auto_renew: false,
		parent_document_id: 'root',
		relation_type: 'amendment',
		external_references: [],
	};
	await run(['set', 'document', '--data', JSON.stringify(payload)]);
	expect(set).toHaveBeenCalledWith('document', payload, 'account');
	expect(JSON.parse(stdout)).toEqual(response);
});

it.each(['get', 'related'] as const)('exposes contract %s through the SDK', async (method) => {
	const call = vi
		.spyOn(ContractResource.prototype, method)
		.mockResolvedValue({ document_id: 'document' } as never);
	await run([method, 'document']);
	expect(call).toHaveBeenCalledWith('document', 'account');
});

it.each(['renew', 'terminate'] as const)(
	'confirms %s and forwards guarded writes',
	async (method) => {
		const call = vi
			.spyOn(ContractResource.prototype, method)
			.mockResolvedValue({ document_id: 'document' } as never);
		const confirm = vi.spyOn(prompts, 'confirmDestructive').mockResolvedValue(false);
		const payload =
			method === 'renew'
				? { term: 1, value: null }
				: { reason: 'Example', updated_at: '2026-10-23T12:00:00Z' };
		await run([method, 'document', '--data', JSON.stringify(payload)]);
		expect(call).not.toHaveBeenCalled();
		confirm.mockResolvedValue(true);
		await run([method, 'document', '--data', JSON.stringify(payload), '--yes']);
		expect(confirm).toHaveBeenLastCalledWith(expect.any(String), true);
		expect(call).toHaveBeenCalledWith('document', payload, 'account');
	},
);

it('rejects nonobject JSON before changing terms', async () => {
	const set = vi.spyOn(ContractResource.prototype, 'set');
	await run(['set', 'document', '--data', '[]']);
	expect(set).not.toHaveBeenCalled();
	expect(process.exitCode).toBe(1);
});
