import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleStreamError } from './cli-exit';

afterEach(() => {
	process.exitCode = 0;
});

describe('handleStreamError', () => {
	it('keeps EPIPE successful but makes other output failures fatal', () => {
		const exit = vi.fn() as unknown as (code: number) => never;
		const write = vi.fn(() => true);
		const fallback = { write } as unknown as NodeJS.WritableStream;
		handleStreamError(Object.assign(new Error('closed'), { code: 'EPIPE' }), fallback, exit);
		expect(exit).toHaveBeenCalledWith(0);

		handleStreamError(Object.assign(new Error('device failed'), { code: 'EIO' }), fallback, exit);
		expect(process.exitCode).toBe(1);
		expect(write).toHaveBeenCalledWith(expect.stringContaining('EIO'));
	});
});
