import { describe, expect, it } from 'vitest';
import { resolveAssignmentSignerRefs } from './assignments';

describe('resolveAssignmentSignerRefs', () => {
	it('allows omitted signers only when the caller makes them optional', () => {
		expect(resolveAssignmentSignerRefs(undefined, undefined, false)).toEqual([]);
		expect(() => resolveAssignmentSignerRefs()).toThrow(/Provide signers/);
	});

	it('preserves structured assignment controls', () => {
		const signers = resolveAssignmentSignerRefs(
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
