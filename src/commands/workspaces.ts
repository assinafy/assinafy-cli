import path from 'node:path';
import { Command } from '@commander-js/extra-typings';
import type {
	IDocumentStatsParams,
	IDocumentStatsRow,
	IUpdateWorkspacePayload,
	NotificationSenderType,
} from '../api';
import { readBinary, writeBinary } from '../lib/files';
import { printData, printPaginatedData, printSuccess } from '../lib/output';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';
import { sanitizeTerminalText } from '../lib/terminal';

const createCommand = new Command('create')
	.description('Create a workspace (account)')
	.requiredOption('--name <name>', 'Workspace name')
	.option('--notification-sender <type>', 'Notification sender: User or Account')
	.option('--primary-color <hex>', 'Primary brand color')
	.option('--secondary-color <hex>', 'Secondary brand color')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const workspace = await withSpinner('Creating workspace', config, () =>
				client.workspaces.create({
					name: opts.name,
					notification_sender_type: opts.notificationSender as NotificationSenderType | undefined,
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
			printPaginatedData(result, config, (rows) =>
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
	.option('--notification-sender <type>', 'Notification sender: User or Account')
	.option('--primary-color <hex>', 'Primary brand color (pass empty to clear)')
	.option('--secondary-color <hex>', 'Secondary brand color (pass empty to clear)')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const payload: IUpdateWorkspacePayload = {};
			if (opts.name) payload.name = opts.name;
			if (opts.notificationSender)
				payload.notification_sender_type = opts.notificationSender as NotificationSenderType;
			if (opts.primaryColor !== undefined) payload.primary_color = opts.primaryColor || null;
			if (opts.secondaryColor !== undefined) payload.secondary_color = opts.secondaryColor || null;
			const workspace = await withSpinner('Updating workspace', config, () =>
				client.workspaces.update(id, payload),
			);
			printSuccess(`Updated workspace ${workspace.id}`, config);
			printData(workspace, config, (w) => renderKeyValue({ id: w.id, name: w.name }));
		});
	});

const themeCommand = new Command('theme')
	.description('Show public branding for a workspace')
	.argument('<id>', 'Account/workspace ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const theme = await withSpinner('Fetching workspace theme', config, () =>
				client.workspaces.getTheme(id),
			);
			printData(theme, config, (value) =>
				renderKeyValue(value as unknown as Record<string, unknown>),
			);
		});
	});

const statsCommand = new Command('stats')
	.description('Show document KPIs for a workspace')
	.argument('<id>', 'Account/workspace ID')
	.option('--granularity <value>', 'monthly or daily', 'monthly')
	.option('--month <yyyy-mm>', 'Month required for daily granularity')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const params: IDocumentStatsParams = {
				granularity: opts.granularity as IDocumentStatsParams['granularity'],
				month: opts.month,
			};
			const rows = await withSpinner('Fetching workspace statistics', config, () =>
				client.workspaces.stats(id, params),
			);
			printData(rows, config, renderStats);
		});
	});

const logoDownloadCommand = new Command('download')
	.description('Download the workspace logo')
	.argument('<id>', 'Account/workspace ID')
	.option('-o, --output <path>', 'Output file path')
	.option('--force', 'Overwrite the output file if it already exists')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const logo = await withSpinner('Downloading workspace logo', config, () =>
				client.workspaces.downloadLogo(id),
			);
			const output = writeBinary(opts.output ?? `${id}-logo.png`, logo, { force: opts.force });
			printSuccess(`Saved ${logo.byteLength} bytes to ${output}`, config);
			printData({ path: output, bytes: logo.byteLength }, config, (value) =>
				sanitizeTerminalText(value.path),
			);
		});
	});

const logoUploadCommand = new Command('upload')
	.description('Upload or replace the workspace logo')
	.argument('<id>', 'Account/workspace ID')
	.argument('<file>', 'Logo image path')
	.option('--content-type <mime>', 'Image MIME type (inferred from extension)')
	.action(async (id, file, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			await withSpinner('Uploading workspace logo', config, () =>
				client.workspaces.uploadLogo(id, readBinary(file), {
					fileName: path.basename(file),
					contentType: opts.contentType ?? logoContentType(file),
				}),
			);
			printSuccess(`Uploaded workspace logo for ${id}`, config);
			printData({ uploaded: true, account_id: id }, config);
		});
	});

const logoDeleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete the workspace logo')
	.argument('<id>', 'Account/workspace ID')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			if (!(await confirmDestructive(`Delete the logo for workspace ${id}?`, Boolean(opts.yes)))) {
				return;
			}
			await withSpinner('Deleting workspace logo', config, () => client.workspaces.deleteLogo(id));
			printSuccess(`Deleted workspace logo for ${id}`, config);
			printData({ deleted: true, account_id: id }, config);
		});
	});

const logoCommand = new Command('logo')
	.description('Manage a workspace logo')
	.addCommand(logoDownloadCommand)
	.addCommand(logoUploadCommand)
	.addCommand(logoDeleteCommand);

const deleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete a workspace')
	.argument('<id>', 'Account/workspace ID')
	.option('--force', 'Cancel an active paid subscription automatically and delete anyway')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			if (!(await confirmDestructive(`Delete workspace ${id}?`, Boolean(opts.yes)))) return;
			await withSpinner('Deleting workspace', config, () =>
				client.workspaces.delete(id, { force: opts.force }),
			);
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
	.addCommand(themeCommand)
	.addCommand(statsCommand)
	.addCommand(logoCommand)
	.addCommand(updateCommand)
	.addCommand(deleteCommand);

function logoContentType(file: string): string {
	return (
		{
			'.gif': 'image/gif',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.webp': 'image/webp',
		}[path.extname(file).toLowerCase()] ?? 'image/png'
	);
}

function renderStats(rows: IDocumentStatsRow[]): string {
	return renderTable(rows, [
		{ header: 'PERIOD', value: (row) => row.period },
		{ header: 'UPLOADED', value: (row) => row.documents_uploaded },
		{ header: 'SENT', value: (row) => row.documents_sent },
		{ header: 'REQUESTS', value: (row) => row.signature_requests },
		{ header: 'COMPLETED', value: (row) => row.signature_requests_completed },
		{ header: 'CERTIFIED', value: (row) => row.documents_certified },
	]);
}
