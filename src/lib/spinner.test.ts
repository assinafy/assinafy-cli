import { spinner } from '@clack/prompts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { withSpinner } from './spinner';

const controls = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), error: vi.fn() }));

vi.mock('@clack/prompts', () => ({
	spinner: vi.fn(() => controls),
}));

afterEach(() => {
	vi.clearAllMocks();
	Reflect.deleteProperty(process.stderr, 'isTTY');
});

describe('withSpinner', () => {
	it('renders the clack spinner on stderr, keeping stdout clean for data', async () => {
		Object.defineProperty(process.stderr, 'isTTY', { value: true, configurable: true });
		const result = await withSpinner('Working', { json: false, quiet: false }, async () => 42);
		expect(result).toBe(42);
		expect(spinner).toHaveBeenCalledWith({ output: process.stderr });
		expect(controls.start).toHaveBeenCalledWith('Working');
		expect(controls.stop).toHaveBeenCalledWith('Working');
	});

	it('marks the spinner as failed when the task rejects', async () => {
		Object.defineProperty(process.stderr, 'isTTY', { value: true, configurable: true });
		const failure = new Error('boom');
		await expect(
			withSpinner('Working', { json: false, quiet: false }, async () => {
				throw failure;
			}),
		).rejects.toBe(failure);
		expect(controls.error).toHaveBeenCalledWith('Working');
	});

	it('skips the spinner when stderr is not a TTY', async () => {
		const result = await withSpinner('Working', { json: false, quiet: false }, async () => 42);
		expect(result).toBe(42);
		expect(spinner).not.toHaveBeenCalled();
	});
});
