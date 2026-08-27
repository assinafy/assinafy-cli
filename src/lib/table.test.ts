import { describe, expect, it } from 'vitest';
import { renderDocumentStats, renderKeyValue, renderTable } from './table';

// Strip ANSI escape sequences so assertions match the visible text.
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching the ESC in ANSI codes
const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

describe('renderTable', () => {
	it('renders headers and aligned rows', () => {
		const out = plain(
			renderTable(
				[
					{ id: '1', name: 'Alice' },
					{ id: '22', name: 'Bob' },
				],
				[
					{ header: 'ID', value: (r) => r.id },
					{ header: 'NAME', value: (r) => r.name },
				],
			),
		);
		const lines = out.split('\n');
		expect(lines[0]).toContain('ID');
		expect(lines[0]).toContain('NAME');
		expect(lines[1]).toContain('Alice');
		expect(lines[2]).toContain('Bob');
	});

	it('shows a placeholder for empty input', () => {
		expect(plain(renderTable([], [{ header: 'X', value: () => '' }]))).toBe('(no results)');
	});

	it('formats booleans, arrays, and null', () => {
		const out = plain(
			renderTable(
				[{ ok: true, tags: ['a', 'b'], missing: null }],
				[
					{ header: 'OK', value: (r) => r.ok },
					{ header: 'TAGS', value: (r) => r.tags },
					{ header: 'MISSING', value: (r) => r.missing },
				],
			),
		);
		expect(out).toContain('yes');
		expect(out).toContain('a, b');
		expect(out).toContain('—');
	});

	it('removes terminal controls and flattens newlines in remote cell values', () => {
		const payload =
			'\u001b]52;c;copied\u0007\u001b[31mspoof\nrow\u202efdp.exe\u2066x\u2069\u2028next';
		const out = plain(
			renderTable([{ value: payload }], [{ header: 'VALUE', value: (r) => r.value }]),
		);
		expect(out).toContain('spoof rowfdp.exex next');
		expect(out).not.toContain('\u001b');
		expect(out).not.toContain('\u202e');
		expect(out).not.toContain('\u2066');
		expect(out.split('\n')).toHaveLength(2);
	});
});

describe('renderDocumentStats', () => {
	it('renders every current notification and verification counter', () => {
		const out = plain(
			renderDocumentStats([
				{
					period: '2026-08',
					documents_uploaded: 1,
					documents_sent: 2,
					signature_requests: 3,
					signature_requests_notification_email: 4,
					signature_requests_notification_whatsapp: 5,
					signature_requests_notification_bypass: 6,
					signature_requests_verification_email: 7,
					signature_requests_verification_whatsapp: 8,
					signature_requests_verification_bypass: 9,
					signature_requests_verification_digital_certificate: 10,
					signature_requests_viewed: 11,
					signature_requests_completed: 12,
					documents_certified: 13,
				},
			]),
		);

		for (const heading of [
			'NOTIFY EMAIL',
			'NOTIFY WA',
			'NOTIFY BYPASS',
			'VERIFY EMAIL',
			'VERIFY WA',
			'VERIFY BYPASS',
			'VERIFY CERT',
			'VIEWED',
		]) {
			expect(out).toContain(heading);
		}
		expect(out.split('\n')[1]?.trim().split(/\s+/).slice(-10)).toEqual([
			'4',
			'5',
			'6',
			'7',
			'8',
			'9',
			'10',
			'11',
			'12',
			'13',
		]);
	});
});

describe('renderKeyValue', () => {
	it('renders present keys and skips undefined', () => {
		const out = plain(renderKeyValue({ id: '1', name: 'Alice', extra: undefined }));
		expect(out).toContain('id:');
		expect(out).toContain('Alice');
		expect(out).not.toContain('extra');
	});

	it('shows a placeholder when nothing is present', () => {
		expect(plain(renderKeyValue({ a: undefined }))).toBe('(empty)');
	});

	it('sanitizes dynamic keys and values', () => {
		const out = plain(renderKeyValue({ 'bad\nkey': '\u001b]52;c;x\u0007value\nnext' }));
		expect(out).toContain('bad key:');
		expect(out).toContain('value next');
		expect(out).not.toContain('\u001b');
	});

	it('sanitizes controls nested in object values', () => {
		const out = plain(renderKeyValue({ payload: { value: '\u009d52;c;x\u009c' } }));
		expect(out).not.toContain('\u009d');
		expect(out).not.toContain('\u009c');
	});
});
