import { describe, expect, it } from 'vitest';
import { assignmentsCommand } from './assignments';
import { authCommand } from './auth';
import { documentsCommand } from './documents';
import { fieldsCommand } from './fields';
import { sendCommand } from './send';
import { signerCommand } from './signer';
import { tagsCommand } from './tags';
import { templatesCommand } from './templates';
import { usersCommand } from './users';
import { workspacesCommand } from './workspaces';

interface CommandTree {
	readonly commands: readonly {
		name(): string;
		readonly options: readonly { long?: string }[];
	}[];
}

function hasOption(parent: CommandTree, commandName: string, longFlag: string): boolean {
	return Boolean(
		parent.commands
			.find((command) => command.name() === commandName)
			?.options.some((option) => option.long === longFlag),
	);
}

function optionConflicts(parent: CommandTree, commandName: string, longFlag: string): string[] {
	const option = parent.commands
		.find((command) => command.name() === commandName)
		?.options.find((candidate) => candidate.long === longFlag) as
		| { conflictsWith?: string[] }
		| undefined;
	return option?.conflictsWith ?? [];
}

describe('download command safety', () => {
	it('exposes --force only as an explicit overwrite opt-in', () => {
		expect(hasOption(documentsCommand, 'download', '--force')).toBe(true);
		expect(hasOption(documentsCommand, 'thumbnail', '--force')).toBe(true);
		expect(hasOption(documentsCommand, 'download-page', '--force')).toBe(true);
		expect(hasOption(signerCommand, 'download', '--force')).toBe(true);
		expect(hasOption(signerCommand, 'download-signature', '--force')).toBe(true);
		expect(hasOption(templatesCommand, 'download-page', '--force')).toBe(true);
	});
});

describe('signer command coverage', () => {
	it('exposes signer document search', () => {
		expect(signerCommand.commands.some((command) => command.name() === 'search')).toBe(true);
	});

	it('can explicitly enable or disable signature reuse', () => {
		expect(hasOption(signerCommand, 'upload-signature', '--reuse')).toBe(true);
		expect(hasOption(signerCommand, 'upload-signature', '--no-reuse')).toBe(true);
	});
});

describe('current API command coverage', () => {
	it('supports the current and live-compatible public token payload flags', () => {
		expect(hasOption(documentsCommand, 'send-token', '--email')).toBe(true);
		expect(hasOption(documentsCommand, 'send-token', '--recipient')).toBe(true);
	});

	it('exposes account theme, stats, and logo operations', () => {
		expect(workspacesCommand.commands.some((command) => command.name() === 'theme')).toBe(true);
		expect(workspacesCommand.commands.some((command) => command.name() === 'stats')).toBe(true);
		const logo = workspacesCommand.commands.find((command) => command.name() === 'logo');
		expect(logo?.commands.map((command) => command.name())).toEqual([
			'download',
			'upload',
			'delete',
		]);
	});

	it('exposes user self, stats, preferences, and social-link operations', () => {
		expect(usersCommand.commands.map((command) => command.name())).toEqual([
			'self',
			'stats',
			'notification-preferences',
		]);
		expect(authCommand.commands.some((command) => command.name() === 'link-social-login')).toBe(
			true,
		);
	});
});

describe('mutating option safety', () => {
	it('rejects ambiguous expiration and token-recipient options', () => {
		expect(optionConflicts({ commands: [sendCommand] }, 'send', '--signer')).toContain('signers');
		expect(optionConflicts({ commands: [sendCommand] }, 'send', '--signers')).toContain('signer');
		for (const command of ['create', 'estimate-cost']) {
			expect(optionConflicts(assignmentsCommand, command, '--signer-ids')).toContain('signers');
			expect(optionConflicts(assignmentsCommand, command, '--signers')).toContain('signerIds');
		}
		expect(optionConflicts(assignmentsCommand, 'reset-expiration', '--expires-at')).toContain(
			'clear',
		);
		expect(optionConflicts(assignmentsCommand, 'reset-expiration', '--clear')).toContain(
			'expiresAt',
		);
		expect(optionConflicts(documentsCommand, 'send-token', '--email')).toEqual([
			'recipient',
			'channel',
		]);
		expect(optionConflicts(documentsCommand, 'send-token', '--recipient')).toContain('email');
	});

	it('rejects contradictory field and tag updates', () => {
		expect(optionConflicts(fieldsCommand, 'update', '--required')).toContain('optional');
		expect(optionConflicts(fieldsCommand, 'update', '--active')).toContain('inactive');
		expect(optionConflicts(fieldsCommand, 'update', '--regex')).toContain('clearRegex');
		expect(optionConflicts(tagsCommand, 'update', '--color')).toContain('clearColor');
	});
});
