import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Command } from '@commander-js/extra-typings';
import { expect, it, vi } from 'vitest';
import { DocumentResource } from '../api/resources/documents';
import { documentsCommand } from './documents';

it('forwards activity pagination and sort while keeping JSON output an array', async () => {
	const directory = mkdtempSync(path.join(tmpdir(), 'assinafy-activities-'));
	vi.stubEnv('ASSINAFY_CONFIG_DIR', directory);
	vi.stubEnv('ASSINAFY_API_KEY', 'example-owner');
	vi.stubEnv('ASSINAFY_TOKEN', undefined);
	vi.stubEnv('ASSINAFY_BASE_URL', 'https://api.example.com/v1');
	const activities = vi.spyOn(DocumentResource.prototype, 'activities').mockResolvedValue([]);
	let stdout = '';
	vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
		stdout += String(chunk);
		return true;
	});
	try {
		await new Command()
			.option('--json')
			.addCommand(documentsCommand)
			.parseAsync(
				[
					'--json',
					'documents',
					'activities',
					'document',
					'--page',
					'2',
					'--per-page',
					'5',
					'--sort',
					'id',
				],
				{ from: 'user' },
			);
		expect(activities).toHaveBeenCalledWith('document', { page: 2, 'per-page': 5, sort: 'id' });
		expect(JSON.parse(stdout)).toEqual([]);
	} finally {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
		rmSync(directory, { recursive: true, force: true });
	}
});
