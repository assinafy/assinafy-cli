import { Command } from '@commander-js/extra-typings';
import type { IUpdateWorkspacePayload } from '../api';
import { printData, printSuccess } from '../lib/output';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const createCommand = new Command('create')
	.description('Create a workspace (account)')
	.requiredOption('--name <name>', 'Workspace name')
	.option('--primary-color <hex>', 'Primary brand color')
	.option('--secondary-color <hex>', 'Secondary brand color')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const workspace = await withSpinner('Creating workspace', config, () =>
				client.workspaces.create({
					name: opts.name,
					primary_color: opts.primaryColor,
					secondary_color: opts.secondaryColor,
				}),
			);
			printSuccess(`Created workspace ${workspace.id}`, config);
			printData(workspace, config, (w) => renderKeyValue({ id: w.id, name: w.name }));
		});
	});

const listCommand = new Command('list')
	.description('List workspaces you can access')
	.action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const result = await withSpinner('Fetching workspaces', config, () =>
				client.workspaces.list(),
			);
			printData(result.data, config, (rows) =>
				renderTable(rows, [
					{ header: 'ID', value: (r) => r.id },
					{ header: 'NAME', value: (r) => r.name },
					{ header: 'ROLES', value: (r) => r.roles },
					{ header: 'CREATED', value: (r) => r.created_at },
				]),
			);
		});
	});

const getCommand = new Command('get')
	.description('Show a workspace by ID')
	.argument('<id>', 'Account/workspace ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const workspace = await withSpinner('Fetching workspace', config, () =>
				client.workspaces.get(id),
			);
			printData(workspace, config, (w) => renderKeyValue(w as unknown as Record<string, unknown>));
		});
	});

const updateCommand = new Command('update')
	.description('Update a workspace')
	.argument('<id>', 'Account/workspace ID')
	.option('--name <name>', 'New name')
	.option('--primary-color <hex>', 'Primary brand color (pass empty to clear)')
	.option('--secondary-color <hex>', 'Secondary brand color (pass empty to clear)')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const payload: IUpdateWorkspacePayload = {};
			if (opts.name) payload.name = opts.name;
			if (opts.primaryColor !== undefined) payload.primary_color = opts.primaryColor || null;
			if (opts.secondaryColor !== undefined) payload.secondary_color = opts.secondaryColor || null;
			const workspace = await withSpinner('Updating workspace', config, () =>
				client.workspaces.update(id, payload),
			);
			printSuccess(`Updated workspace ${workspace.id}`, config);
			printData(workspace, config, (w) => renderKeyValue({ id: w.id, name: w.name }));
		});
	});

const deleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete a workspace')
	.argument('<id>', 'Account/workspace ID')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			if (!(await confirmDestructive(`Delete workspace ${id}?`, Boolean(opts.yes)))) return;
			await withSpinner('Deleting workspace', config, () => client.workspaces.delete(id));
			printSuccess(`Deleted workspace ${id}`, config);
			printData({ deleted: id }, config);
		});
	});

export const workspacesCommand = new Command('workspaces')
	.alias('accounts')
	.description('Manage workspaces (accounts)')
	.addCommand(createCommand)
	.addCommand(listCommand)
	.addCommand(getCommand)
	.addCommand(updateCommand)
	.addCommand(deleteCommand);
