import { describe, expect, it } from 'vitest';
import { authCommand, resetPasswordPayload } from './auth';

describe('auth reset-password', () => {
	it('keeps the reset credential separate from the global bearer-token flag', () => {
		const command = authCommand.commands.find((candidate) => candidate.name() === 'reset-password');
		expect(command?.options.some((option) => option.long === '--reset-token')).toBe(true);
		expect(command?.options.some((option) => option.long === '--token')).toBe(false);
	});

	it('maps the reset token into the request payload', () => {
		expect(resetPasswordPayload('person@example.test', 'reset-secret', 'new-secret')).toEqual({
			email: 'person@example.test',
			token: 'reset-secret',
			new_password: 'new-secret',
		});
	});
});
