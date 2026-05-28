import { describe, expect, it } from 'vitest';
import { CliError } from '../lib/errors';
import { parseSignerSpec, resolveSigners } from './send';

describe('parseSignerSpec', () => {
	it('parses "Name <email>"', () => {
		expect(parseSignerSpec('Ana Lima <ana@example.com>')).toEqual({
			name: 'Ana Lima',
			email: 'ana@example.com',
		});
	});

	it('parses "Name <phone>" as a WhatsApp number', () => {
		expect(parseSignerSpec('Ana <+5548999990000>')).toEqual({
			name: 'Ana',
			whatsapp_phone_number: '+5548999990000',
		});
	});

	it('parses a bare email, defaulting the name to the email', () => {
		expect(parseSignerSpec('ana@example.com')).toEqual({
			name: 'ana@example.com',
			email: 'ana@example.com',
		});
	});

	it('throws on an empty contact', () => {
		expect(() => parseSignerSpec('Name <>')).toThrow(CliError);
	});
});

describe('resolveSigners', () => {
	it('parses --signers JSON when provided', () => {
		const json = '[{"name":"X","email":"x@y.com"}]';
		expect(resolveSigners([], json)).toEqual([{ name: 'X', email: 'x@y.com' }]);
	});

	it('maps --signer specs', () => {
		expect(resolveSigners(['A <a@b.com>'])).toEqual([{ name: 'A', email: 'a@b.com' }]);
	});

	it('throws when no signers are given', () => {
		expect(() => resolveSigners([])).toThrow(/At least one/);
	});
});
