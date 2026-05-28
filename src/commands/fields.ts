import { Command } from '@commander-js/extra-typings';
import type { ICreateFieldPayload, IFieldValidateMultipleEntry, IUpdateFieldPayload } from '../api';
import { requireAccountId } from '../lib/client';
import { CliError } from '../lib/errors';
import { parseJsonArray } from '../lib/json';
import { printData, printSuccess } from '../lib/output';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient, runWithOptionalClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const fieldColumns = [
	{ header: 'ID', value: (r: { id: string }) => r.id },
	{ header: 'NAME', value: (r: { name: string }) => r.name },
	{ header: 'TYPE', value: (r: { type: string }) => r.type },
	{ header: 'REQUIRED', value: (r: { is_required?: boolean }) => r.is_required },
	{ header: 'ACTIVE', value: (r: { is_active: boolean }) => r.is_active },
];

const createCommand = new Command('create')
	.description('Create a custom field definition')
	.requiredOption('--type <type>', 'Field type (see `fields types`)')
	.requiredOption('--name <name>', 'Field name')
	.option('--regex <regex>', 'Validation regex')
	.option('--required', 'Mark the field as required')
	.option('--inactive', 'Create the field inactive')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const payload: ICreateFieldPayload = { type: opts.type, name: opts.name };
			if (opts.regex) payload.regex = opts.regex;
			if (opts.required) payload.is_required = true;
			if (opts.inactive) payload.is_active = false;
			const field = await withSpinner('Creating field', config, () =>
				client.fields.create(payload, accountId),
			);
			printSuccess(`Created field ${field.id}`, config);
			printData(field, config, (f) => renderKeyValue({ id: f.id, name: f.name, type: f.type }));
		});
	});

const listCommand = new Command('list')
	.description('List field definitions')
	.option('--include-inactive', 'Include inactive fields')
	.option('--include-standard', 'Include standard fields (signature, initial, …)')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const fields = await withSpinner('Fetching fields', config, () =>
				client.fields.list(
					{ include_inactive: opts.includeInactive, include_standard: opts.includeStandard },
					accountId,
				),
			);
			printData(fields, config, (rows) => renderTable(rows, fieldColumns));
		});
	});

const getCommand = new Command('get')
	.description('Show a field definition by ID')
	.argument('<id>', 'Field ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const field = await withSpinner('Fetching field', config, () =>
				client.fields.get(id, accountId),
			);
			printData(field, config, (f) => renderKeyValue(f as unknown as Record<string, unknown>));
		});
	});

const updateCommand = new Command('update')
	.description('Update a field definition')
	.argument('<id>', 'Field ID')
	.option('--type <type>', 'Field type')
	.option('--name <name>', 'Field name')
	.option('--regex <regex>', 'Validation regex')
	.option('--required', 'Mark as required')
	.option('--optional', 'Mark as not required')
	.option('--active', 'Activate the field')
	.option('--inactive', 'Deactivate the field')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const payload: IUpdateFieldPayload = {};
			if (opts.type) payload.type = opts.type;
			if (opts.name) payload.name = opts.name;
			if (opts.regex !== undefined) payload.regex = opts.regex;
			if (opts.required) payload.is_required = true;
			if (opts.optional) payload.is_required = false;
			if (opts.active) payload.is_active = true;
			if (opts.inactive) payload.is_active = false;
			const field = await withSpinner('Updating field', config, () =>
				client.fields.update(id, payload, accountId),
			);
			printSuccess(`Updated field ${field.id}`, config);
			printData(field, config, (f) => renderKeyValue({ id: f.id, name: f.name, type: f.type }));
		});
	});

const deleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete a field definition')
	.argument('<id>', 'Field ID')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			if (!(await confirmDestructive(`Delete field ${id}?`, Boolean(opts.yes)))) return;
			await withSpinner('Deleting field', config, () => client.fields.delete(id, accountId));
			printSuccess(`Deleted field ${id}`, config);
			printData({ deleted: id }, config);
		});
	});

const validateCommand = new Command('validate')
	.description('Validate a value against a field definition')
	.argument('<id>', 'Field ID')
	.argument('<value>', 'Value to validate')
	.option('--signer-access-code <code>', 'Signer access code (for signer-side validation)')
	.action(async (id, value, opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			requireCredentialsOrSignerAccessCode(config, opts.signerAccessCode);
			const accountId = requireAccountId(config);
			const result = await withSpinner('Validating', config, () =>
				client.fields.validate(id, value, { signerAccessCode: opts.signerAccessCode, accountId }),
			);
			printData(result, config, (r) =>
				renderKeyValue({ success: r.success, error_message: r.error_message }),
			);
		});
	});

const validateMultipleCommand = new Command('validate-multiple')
	.description('Validate multiple field values at once')
	.requiredOption('--entries <json>', 'JSON array of { field_id, value } entries')
	.option('--signer-access-code <code>', 'Signer access code')
	.action(async (opts, command) => {
		await runWithOptionalClient(command, async ({ client, config }) => {
			requireCredentialsOrSignerAccessCode(config, opts.signerAccessCode);
			const accountId = requireAccountId(config);
			const entries = parseJsonArray(opts.entries, '--entries') as IFieldValidateMultipleEntry[];
			const result = await withSpinner('Validating', config, () =>
				client.fields.validateMultiple(entries, {
					signerAccessCode: opts.signerAccessCode,
					accountId,
				}),
			);
			printData(result, config, (rows) =>
				renderTable(rows, [
					{ header: 'FIELD', value: (r) => r.field_id },
					{ header: 'SUCCESS', value: (r) => r.success },
					{ header: 'ERROR', value: (r) => r.error_message },
				]),
			);
		});
	});

const typesCommand = new Command('types')
	.description("List the platform's supported field types")
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const types = await withSpinner('Fetching field types', config, () =>
				client.fields.listTypes(),
			);
			printData(types, config, (rows) =>
				renderTable(rows, [
					{ header: 'TYPE', value: (r) => r.type },
					{ header: 'NAME', value: (r) => r.name },
				]),
			);
		});
	});

export const fieldsCommand = new Command('fields')
	.description('Manage custom field definitions used by collect assignments')
	.addCommand(createCommand)
	.addCommand(listCommand)
	.addCommand(getCommand)
	.addCommand(updateCommand)
	.addCommand(deleteCommand)
	.addCommand(validateCommand)
	.addCommand(validateMultipleCommand)
	.addCommand(typesCommand);

function requireCredentialsOrSignerAccessCode(
	config: { apiKey?: string; token?: string },
	signerAccessCode: string | undefined,
): void {
	if (!config.apiKey && !config.token && !signerAccessCode) {
		throw new CliError('Provide credentials or --signer-access-code <code> for validation.');
	}
}
