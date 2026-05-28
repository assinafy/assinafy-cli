import { afterEach, describe, expect, it, vi } from 'vitest';
import { CliError } from './errors';
import { printData, printError, printSuccess } from './output';

function captureStdout(fn: () => void): string {
	const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
	fn();
	const out = spy.mock.calls.map((c) => String(c[0])).join('');
	spy.mockRestore();
	return out;
}

function captureStderr(fn: () => void): string {
	const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
	fn();
	const out = spy.mock.calls.map((c) => String(c[0])).join('');
	spy.mockRestore();
	return out;
}

afterEach(() => {
	process.exitCode = 0;
});

describe('printData', () => {
	it('emits pretty JSON under --json', () => {
		const out = captureStdout(() => printData({ a: 1 }, { json: true, quiet: false }));
		expect(JSON.parse(out)).toEqual({ a: 1 });
	});

	it('uses the human formatter when not --json', () => {
		const out = captureStdout(() =>
			printData({ a: 1 }, { json: false, quiet: false }, () => 'HUMAN'),
		);
		expect(out.trim()).toBe('HUMAN');
	});

	it('falls back to JSON when no human formatter is supplied', () => {
		const out = captureStdout(() => printData({ a: 1 }, { json: false, quiet: false }));
		expect(JSON.parse(out)).toEqual({ a: 1 });
	});
});

describe('printSuccess', () => {
	it('writes to stderr in human mode', () => {
		const out = captureStderr(() => printSuccess('done', { json: false, quiet: false }));
		expect(out).toContain('done');
	});

	it('is suppressed under --json', () => {
		const out = captureStderr(() => printSuccess('done', { json: true, quiet: false }));
		expect(out).toBe('');
	});
});

describe('printError', () => {
	it('sets a non-zero exit code and writes to stderr', () => {
		const out = captureStderr(() =>
			printError(new CliError('boom'), { json: false, quiet: false }),
		);
		expect(out).toContain('boom');
		expect(process.exitCode).toBe(1);
	});

	it('emits JSON under --json', () => {
		const out = captureStderr(() => printError(new CliError('boom'), { json: true, quiet: false }));
		expect(JSON.parse(out).error.message).toBe('boom');
	});
});
