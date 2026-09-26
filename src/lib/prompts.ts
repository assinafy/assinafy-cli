import { cancel, confirm, isCancel, password, text } from '@clack/prompts';
import { CliError } from './errors';

/** Prompt for a single line of text. Throws a 130-exit CliError if the user cancels. */
export async function promptText(message: string, placeholder?: string): Promise<string> {
	const value = await text({ message, placeholder, output: process.stderr });
	return unwrap(value);
}

/** Prompt for a masked secret (API key, password). Throws a 130-exit CliError if cancelled. */
export async function promptSecret(message: string): Promise<string> {
	const value = await password({ message, output: process.stderr });
	return unwrap(value);
}

/**
 * Confirm a destructive action. `force` (the `--yes` flag) short-circuits to
 * `true`. When not attached to a TTY and not forced, refuses rather than
 * silently proceeding.
 */
export async function confirmDestructive(message: string, force: boolean): Promise<boolean> {
	if (force) return true;
	if (!process.stdin.isTTY) {
		throw new CliError('Refusing to proceed without confirmation. Re-run with --yes to confirm.');
	}
	const value = await confirm({ message, output: process.stderr });
	return unwrap(value);
}

function unwrap<T>(value: T | symbol): T {
	if (isCancel(value)) {
		cancel('Cancelled.', { output: process.stderr });
		throw new CliError('Cancelled.', { exitCode: 130 });
	}
	return value as T;
}
