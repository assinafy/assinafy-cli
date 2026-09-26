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

	it('parses a bare phone number as WhatsApp, defaulting the name to the number', () => {
		expect(parseSignerSpec('+5548999990000')).toEqual({
			name: '+5548999990000',
			whatsapp_phone_number: '+5548999990000',
		});
	});

	it('accepts common phone punctuation in a bare contact', () => {
		expect(parseSignerSpec('+55 (48) 99999-0000')).toEqual({
			name: '+55 (48) 99999-0000',
			whatsapp_phone_number: '+55 (48) 99999-0000',
		});
	});

	it('rejects a bare name instead of treating it as a phone number', () => {
		expect(() => parseSignerSpec('Ana Lima')).toThrow(/Name <email-or-phone>/);
		expect(() => parseSignerSpec('sales team')).toThrow(CliError);
	});

	it('rejects a bare contact mixing letters and digits', () => {
		expect(() => parseSignerSpec('ana123')).toThrow(/Name <email-or-phone>/);
	});

	it('throws on an empty contact', () => {
		expect(() => parseSignerSpec('Name <>')).toThrow(CliError);
	});
});

describe('resolveSigners', () => {
	it('parses --signers JSON when provided', () => {
		const json = '[{"name":"X","email":"x@example.com"}]';
		expect(resolveSigners([], json)).toEqual([{ name: 'X', email: 'x@example.com' }]);
	});

	it('maps --signer specs', () => {
		expect(resolveSigners(['A <a@example.com>'])).toEqual([{ name: 'A', email: 'a@example.com' }]);
	});

	it('throws when no signers are given', () => {
		expect(() => resolveSigners([])).toThrow(/At least one/);
	});

	it('rejects ambiguous signer sources', () => {
		expect(() =>
			resolveSigners(['A <a@example.com>'], '[{"name":"B","email":"b@example.com"}]'),
		).toThrow(/not both/);
	});
});
