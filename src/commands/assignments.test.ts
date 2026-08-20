import { describe, expect, it } from 'vitest';
import { resolveSigners } from './assignments';

describe('resolveSigners', () => {
	it('allows omitted signers only when the caller makes them optional', () => {
		expect(resolveSigners(undefined, undefined, false)).toEqual([]);
		expect(() => resolveSigners()).toThrow(/Provide signers/);
	});

	it('preserves structured assignment controls', () => {
		const signers = resolveSigners(
			'[{"id":"signer-1","verification_method":"Email","notification_methods":["Email"],"step":2}]',
		);
		expect(signers).toEqual([
			{
				id: 'signer-1',
				verification_method: 'Email',
				notification_methods: ['Email'],
				step: 2,
			},
		]);
	});
});
