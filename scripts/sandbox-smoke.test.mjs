import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it.each([
	['optional', '', '', 0, 'SKIPPED'],
	['required', '1', '', 2, 'FAILED'],
	['required with whitespace', '1', ' \t\n', 2, 'FAILED'],
])('reports missing sandbox configuration for %s runs', (_name, required, value, code, status) => {
	const missing = [
		'ASSINAFY_API_KEY',
		'ASSINAFY_ACCOUNT_ID',
		'ASSINAFY_TEST_EMAIL',
		'ASSINAFY_TEST_EMAIL_ALT',
	];
	const result = spawnSync(process.execPath, ['scripts/sandbox-smoke.mjs'], {
		env: {
			...process.env,
			...Object.fromEntries(missing.map((name) => [name, value])),
			ASSINAFY_SANDBOX_REQUIRED: required,
			ASSINAFY_SANDBOX_BASE_URL: 'https://example.invalid/v1',
		},
		encoding: 'utf8',
		timeout: 5000,
	});
	expect(result.error).toBeUndefined();
	expect(result.status).toBe(code);
	expect(result.stderr).toBe('');
	expect(JSON.parse(result.stdout)).toEqual({
		status,
		reason: 'sandbox credentials are not configured',
		missing,
	});
});
