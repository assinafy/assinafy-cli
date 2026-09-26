import { cancel, confirm, text } from '@clack/prompts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CliError } from './errors';
import { confirmDestructive, promptText } from './prompts';

const CANCELLED = Symbol('cancelled');

vi.mock('@clack/prompts', () => ({
	cancel: vi.fn(),
	confirm: vi.fn(),
	isCancel: vi.fn((value: unknown) => value === CANCELLED),
	password: vi.fn(),
	text: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe('promptText', () => {
	it('returns the entered value and renders on stderr', async () => {
		vi.mocked(text).mockResolvedValue('example-value');
		await expect(promptText('Name?')).resolves.toBe('example-value');
		expect(text).toHaveBeenCalledWith(expect.objectContaining({ output: process.stderr }));
	});

	it('throws a 130-exit CliError when the user cancels', async () => {
		vi.mocked(text).mockResolvedValue(CANCELLED as unknown as string);
		const failure = await promptText('Name?').catch((err) => err);
		expect(failure).toBeInstanceOf(CliError);
		expect(failure).toMatchObject({ message: 'Cancelled.', exitCode: 130 });
		expect(cancel).toHaveBeenCalledWith('Cancelled.', { output: process.stderr });
	});
});

describe('confirmDestructive', () => {
	it('short-circuits when forced', async () => {
		await expect(confirmDestructive('Delete?', true)).resolves.toBe(true);
		expect(confirm).not.toHaveBeenCalled();
	});

	it('refuses without a TTY instead of silently proceeding', async () => {
		await expect(confirmDestructive('Delete?', false)).rejects.toThrow(/Refusing/);
		expect(confirm).not.toHaveBeenCalled();
	});

	it('confirms interactively on a TTY and treats cancellation as a 130-exit CliError', async () => {
		Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
		try {
			vi.mocked(confirm).mockResolvedValue(true);
			await expect(confirmDestructive('Delete?', false)).resolves.toBe(true);
			expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ output: process.stderr }));

			vi.mocked(confirm).mockResolvedValue(CANCELLED as unknown as boolean);
			const failure = await confirmDestructive('Delete?', false).catch((err) => err);
			expect(failure).toMatchObject({ exitCode: 130 });
		} finally {
			Reflect.deleteProperty(process.stdin, 'isTTY');
		}
	});
});
