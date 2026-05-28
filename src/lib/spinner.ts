import { spinner as clackSpinner } from '@clack/prompts';
import type { OutputConfig } from './output';

/**
 * Run an async task while showing a spinner, when appropriate.
 *
 * The spinner is skipped under `--json`, `--quiet`, or when stderr is not a TTY
 * (e.g. piped/CI), so machine-readable output is never polluted. The task runs
 * unchanged in every case.
 */
export async function withSpinner<T>(
	message: string,
	config: OutputConfig,
	task: () => Promise<T>,
): Promise<T> {
	const useSpinner = !config.json && !config.quiet && process.stderr.isTTY;
	if (!useSpinner) {
		return task();
	}

	const s = clackSpinner();
	s.start(message);
	try {
		const result = await task();
		s.stop(message);
		return result;
	} catch (err) {
		s.stop(message, 1);
		throw err;
	}
}
