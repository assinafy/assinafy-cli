import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, it } from 'vitest';

it('renders nullable referenced fields and replaces taxpayer IDs with safe examples', () => {
	const directory = mkdtempSync(path.join(tmpdir(), 'assinafy-api-docs-test-'));
	const contractSchema = '#/components/schemas/DocumentContractInput';
	const spec = {
		openapi: '3.1.0',
		info: { version: '1' },
		paths: {
			'/v1/documents/{documentId}/contract': {
				put: {
					tags: ['Contracts'],
					summary: 'Set contract terms',
					requestBody: { content: { 'application/json': { schema: { $ref: contractSchema } } } },
				},
			},
		},
		components: {
			schemas: {
				DocumentContractInput: {
					type: 'object',
					properties: {
						counterparty_name: { type: ['string', 'null'] },
						counterparty_taxpayer_id: { type: ['string', 'null'] },
						value: { type: ['number', 'null'] },
						metadata: { type: ['object', 'null'] },
						related: { $ref: contractSchema },
						nested: { $ref: '#/components/schemas/Nested~1Terms~0' },
					},
				},
				'Nested/Terms~': { properties: { note: { type: ['string', 'null'] } } },
			},
		},
	};
	const rendered = [
		'# Set contract terms',
		'`PUT /v1/documents/{documentId}/contract`',
		'## Request Body',
		'Fields (`application/json`):',
		'- `counterparty_name` (Array)',
		'- `counterparty_taxpayer_id` (Array)',
		'- `value` (Array)',
		'- `metadata` (Array)',
		'- `note` (Array)',
		'## Responses',
		'### 200 — Updated terms',
		'```json',
		'{"data":{"counterparty_taxpayer_id":"synthetic-taxpayer-id","document_id":"synthetic-document-id"},"status":200}',
		'```',
	].join('\n\n');
	try {
		mkdirSync(path.join(directory, 'scripts'));
		mkdirSync(path.join(directory, 'docs'));
		for (const file of ['gen-api-reference.mjs', 'api-doc-values.mjs']) {
			copyFileSync(new URL(file, import.meta.url), path.join(directory, 'scripts', file));
		}
		const generator = pathToFileURL(path.join(directory, 'scripts/gen-api-reference.mjs')).href;
		const result = spawnSync(
			process.execPath,
			[
				'--input-type=module',
				'--eval',
				`
			globalThis.fetch = async (input) => {
				const url = new URL(input);
				if (url.href === 'https://api.assinafy.com.br/v1/docs/openapi.json') return new Response(${JSON.stringify(JSON.stringify(spec))});
				if (url.origin === 'https://api.assinafy.com.br' && url.pathname === '/v1/docs/markdown') return new Response(${JSON.stringify(rendered)});
				throw new Error('Unexpected request');
			};
			await import(${JSON.stringify(generator)});
		`,
			],
			{ encoding: 'utf8', timeout: 10_000 },
		);
		expect(result.status, result.stderr).toBe(0);
		const markdown = readFileSync(path.join(directory, 'docs/api-reference.md'), 'utf8');
		for (const [name, type] of [
			['counterparty_name', 'string'],
			['counterparty_taxpayer_id', 'string'],
			['value', 'number'],
			['metadata', 'object'],
			['note', 'string'],
		]) {
			expect.soft(markdown).toContain(`- \`${name}\` (${type} | null)`);
		}
		expect.soft(markdown).toContain('"counterparty_taxpayer_id": "00000000000"');
		expect(markdown).not.toContain('synthetic-taxpayer-id');
		expect(markdown).toContain('"document_id": "example_id_1"');
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
