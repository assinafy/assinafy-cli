import { Command } from '@commander-js/extra-typings';
import { printData, printSuccess } from '../lib/output';
import { confirmDestructive, promptSecret } from '../lib/prompts';
import { runWithOptionalClient, runWithTokenClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue } from '../lib/table';

const loginCommand = new Command('login')
	.description(
		'Exchange email + password for a JWT access token (no existing credentials required)',
	)
	.argument('<email>', 'Account email')
	.option('--password <password>', 'Password (prompted if omitted)')
	.action(async (email, opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const password = opts.password ?? (await promptSecret('Password'));
			const result = await withSpinner('Logging in', config, () =>
				client.auth.login(email, password),
			);
			printSuccess(`Logged in as ${result.user.email}`, config);
			printData(result, config, (r) =>
				renderKeyValue({
					access_token: r.access_token,
					user: r.user.email,
					accounts: r.accounts.map((a) => a.id),
				}),
			);
		});
	});

const socialLoginCommand = new Command('social-login')
	.description('Exchange a provider token for an Assinafy JWT (no existing credentials required)')
	.requiredOption('--provider <provider>', 'OAuth provider (e.g. google)')
	.requiredOption('--provider-token <token>', 'Provider token')
	.option('--accept-terms', 'Accept the platform terms')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const result = await withSpinner('Logging in', config, () =>
				client.auth.socialLogin({
					provider: opts.provider,
					token: opts.providerToken,
					has_accepted_terms: Boolean(opts.acceptTerms),
				}),
			);
			printData(result, config, (r) =>
				renderKeyValue({ access_token: r.access_token, user: r.user.email }),
			);
		});
	});

const changePasswordCommand = new Command('change-password')
	.description("Change the authenticated user's password (requires --token or ASSINAFY_TOKEN)")
	.requiredOption('--email <email>', 'Account email')
	.option('--password <password>', 'Current password (prompted if omitted)')
	.option('--new-password <password>', 'New password (prompted if omitted)')
	.action(async (opts, command) => {
		await runWithTokenClient(command, async ({ client, config }) => {
			const password = opts.password ?? (await promptSecret('Current password'));
			const newPassword = opts.newPassword ?? (await promptSecret('New password'));
			const result = await withSpinner('Changing password', config, () =>
				client.auth.changePassword({ email: opts.email, password, new_password: newPassword }),
			);
			printSuccess('Password changed', config);
			printData(result, config);
		});
	});

const requestResetCommand = new Command('request-password-reset')
	.description('Email a password-reset link to the user (no existing credentials required)')
	.argument('<email>', 'Account email')
	.action(async (email, _opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const result = await withSpinner('Requesting reset', config, () =>
				client.auth.requestPasswordReset(email),
			);
			printSuccess(`Reset link sent to ${email}`, config);
			printData(result, config);
		});
	});

const resetPasswordCommand = new Command('reset-password')
	.description(
		'Complete a password reset with the emailed token (no existing credentials required)',
	)
	.requiredOption('--email <email>', 'Account email')
	.option('--token <token>', 'Reset token from the email')
	.option('--new-password <password>', 'New password (prompted if omitted)')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			const newPassword = opts.newPassword ?? (await promptSecret('New password'));
			const result = await withSpinner('Resetting password', config, () =>
				client.auth.resetPassword({
					email: opts.email,
					token: opts.token,
					new_password: newPassword,
				}),
			);
			printSuccess('Password reset', config);
			printData(result, config);
		});
	});

const apiKeyCreateCommand = new Command('create')
	.description('Generate (and rotate) the current user API key')
	.option('--password <password>', 'Account password (prompted if omitted)')
	.action(async (opts, command) => {
		await runWithTokenClient(command, async ({ client, config }) => {
			const password = opts.password ?? (await promptSecret('Password'));
			const result = await withSpinner('Creating API key', config, () =>
				client.auth.createApiKey(password),
			);
			printSuccess('API key generated', config);
			printData(result, config, (r) => renderKeyValue({ api_key: r.api_key }));
		});
	});

const apiKeyGetCommand = new Command('get')
	.description('Show the masked current API key')
	.action(async (_opts, command) => {
		await runWithTokenClient(command, async ({ client, config }) => {
			const result = await withSpinner('Fetching API key', config, () => client.auth.getApiKey());
			if (!result) {
				printData({ api_key: null }, config, () => 'No API key has been generated yet.');
				return;
			}
			printData(result, config, (r) => renderKeyValue({ api_key: r.api_key }));
		});
	});

const apiKeyDeleteCommand = new Command('delete')
	.alias('rm')
	.description('Revoke the current API key')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (opts, command) => {
		await runWithTokenClient(command, async ({ client, config }) => {
			if (!(await confirmDestructive('Revoke the current API key?', Boolean(opts.yes)))) return;
			await withSpinner('Revoking API key', config, () => client.auth.deleteApiKey());
			printSuccess('API key revoked', config);
			printData({ revoked: true }, config);
		});
	});

const apiKeysCommand = new Command('api-keys')
	.description('Manage the current user personal API key (requires --token or ASSINAFY_TOKEN)')
	.addCommand(apiKeyCreateCommand)
	.addCommand(apiKeyGetCommand)
	.addCommand(apiKeyDeleteCommand);

export const authCommand = new Command('auth')
	.description('Authentication, password management, and personal API keys')
	.addCommand(loginCommand)
	.addCommand(socialLoginCommand)
	.addCommand(changePasswordCommand)
	.addCommand(requestResetCommand)
	.addCommand(resetPasswordCommand)
	.addCommand(apiKeysCommand);
