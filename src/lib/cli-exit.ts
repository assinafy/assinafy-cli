import pc from 'picocolors';
import { sanitizeTerminalText } from './terminal';

let reportingStreamError = false;

/**
 * Install process-level guards so the CLI exits cleanly:
 *  - Ctrl-C produces exit code 130 without a stack trace.
 *  - EPIPE on stdout/stderr (e.g. piping into `head`) is swallowed instead of crashing.
 *  - Unhandled rejections print a single-line error and exit non-zero.
 */
export function setupCliExitHandler(): void {
	process.on('SIGINT', () => process.exit(130));
	process.on('SIGTERM', () => process.exit(143));

	// Guard BOTH streams: a consumer that closes the pipe early (`| head`) breaks
	// whichever stream we next write to. An unguarded 'error' event is fatal.
	process.stdout.on('error', (err) => handleStreamError(err, process.stderr));
	process.stderr.on('error', (err) => handleStreamError(err, process.stdout));

	process.on('unhandledRejection', (reason) => {
		const message = sanitizeTerminalText(reason instanceof Error ? reason.message : String(reason));
		process.stderr.write(`${pc.red('error:')} ${message}\n`);
		process.exit(1);
	});
}

/** Preserve `head`/pipe ergonomics without hiding real output failures. */
export function handleStreamError(
	err: NodeJS.ErrnoException,
	fallback: NodeJS.WritableStream,
	exit: (code: number) => never = process.exit,
): void {
	if (err.code === 'EPIPE') {
		exit(0);
		return;
	}
	process.exitCode = 1;
	if (reportingStreamError) return;
	reportingStreamError = true;
	try {
		fallback.write(
			`${pc.red('error:')} output stream failed (${sanitizeTerminalText(err.code ?? err.message)})\n`,
		);
	} catch {
		// Both output streams are unavailable; the non-zero exit code is the fallback.
	} finally {
		reportingStreamError = false;
	}
}
