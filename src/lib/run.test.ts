import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.doUnmock('./config');
	vi.resetModules();
	vi.restoreAllMocks();
	process.exitCode = 0;
});

it('reports configuration failures as JSON when requested', async () => {
	vi.doMock('./config', async (importOriginal) => ({
		...(await importOriginal<typeof import('./config')>()),
		resolveConfig: () => {
			throw new Error('configuration failed');
		},
	}));
	const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
	const handler = vi.fn();
	const { runAction } = await import('./run');

	await runAction({ optsWithGlobals: () => ({ json: true }) }, handler);

	const output = stderr.mock.calls.map((call) => String(call[0])).join('');
	expect(JSON.parse(output).error.message).toContain('configuration failed');
	expect(handler).not.toHaveBeenCalled();
	expect(process.exitCode).toBe(1);
});
