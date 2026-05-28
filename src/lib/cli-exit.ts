import pc from 'picocolors';

/**
 * Install process-level guards so the CLI exits cleanly:
 *  - Ctrl-C produces exit code 130 without a stack trace.
 *  - EPIPE (e.g. piping into `head`) is swallowed instead of crashing.
 *  - Unhandled rejections print a single-line error and exit non-zero.
 */
export function setupCliExitHandler(): void {
	process.on('SIGINT', () => process.exit(130));
	process.on('SIGTERM', () => process.exit(143));

	process.stdout.on('error', (err: NodeJS.ErrnoException) => {
		if (err.code === 'EPIPE') process.exit(0);
	});

	process.on('unhandledRejection', (reason) => {
		const message = reason instanceof Error ? reason.message : String(reason);
		process.stderr.write(`${pc.red('error:')} ${message}\n`);
		process.exit(1);
	});
}
