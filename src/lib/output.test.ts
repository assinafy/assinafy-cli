import { afterEach, describe, expect, it, vi } from 'vitest';
import { CliError } from './errors';
import { printData, printError, printPaginatedData, printSuccess } from './output';

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

	it('emits valid JSON null for void results', () => {
		const out = captureStdout(() => printData(undefined, { json: true, quiet: false }));
		expect(JSON.parse(out)).toBeNull();
	});

	it('sanitizes raw human strings without changing JSON data', () => {
		const unsafe = '\u001b]52;c;copied\u0007value\nspoof';
		const human = captureStdout(() => printData(unsafe, { json: false, quiet: false }));
		const json = captureStdout(() => printData(unsafe, { json: true, quiet: false }));
		expect(human).toContain('value spoof');
		expect(human).not.toContain('\u001b');
		expect(JSON.parse(json)).toBe(unsafe);
	});

	it('escapes C1 terminal controls while preserving JSON values', () => {
		const unsafe = '\u009d52;c;copied\u009c\u202efdp.exe\u2028spoof';
		const json = captureStdout(() => printData({ value: unsafe }, { json: true, quiet: false }));
		expect(json).not.toContain('\u009d');
		expect(json).not.toContain('\u009c');
		expect(json).not.toContain('\u202e');
		expect(json).not.toContain('\u2028');
		expect(json).toContain('\\u009d');
		expect(JSON.parse(json)).toEqual({ value: unsafe });
	});

	it('sanitizes C1 controls in human object output', () => {
		const out = captureStdout(() =>
			printData({ value: '\u009d52;c;copied\u009c' }, { json: false, quiet: false }),
		);
		expect(out).not.toContain('\u009d');
		expect(out).not.toContain('\u009c');
	});
});

describe('printPaginatedData', () => {
	const result = { data: [{ id: '1' }], meta: { current_page: 1, total: 1 } };

	it('preserves data and meta under --json', () => {
		const out = captureStdout(() =>
			printPaginatedData(result, { json: true, quiet: false }, () => 'ROWS'),
		);
		expect(JSON.parse(out)).toEqual(result);
	});

	it('renders only rows in human mode', () => {
		const out = captureStdout(() =>
			printPaginatedData(result, { json: false, quiet: false }, (rows) => rows[0]?.id ?? ''),
		);
		expect(out.trim()).toBe('1');
	});
});

describe('printSuccess', () => {
	it('writes to stderr in human mode', () => {
		const out = captureStderr(() => printSuccess('done', { json: false, quiet: false }));
		expect(out).toContain('done');
	});

	it('sanitizes dynamic status text', () => {
		const out = captureStderr(() =>
			printSuccess('done\u001b]52;c;x\u0007\nspoof\u202efdp.exe\u2066x\u2069', {
				json: false,
				quiet: false,
			}),
		);
		expect(out).toContain('done spooffdp.exex');
		expect(out).not.toContain('\u001b');
		expect(out).not.toContain('\u202e');
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

	it('escapes C1 controls in JSON errors', () => {
		const unsafe = '\u009d52;c;copied\u009c';
		const out = captureStderr(() => printError(new CliError(unsafe), { json: true, quiet: false }));
		expect(out).not.toContain('\u009d');
		expect(JSON.parse(out).error.message).toBe(unsafe);
	});
});
