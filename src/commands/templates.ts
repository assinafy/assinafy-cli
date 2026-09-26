import { Command } from '@commander-js/extra-typings';
import { requireAccountId } from '../lib/client';
import { saveDownload } from '../lib/files';
import { addDownloadOptions, addListOptions } from '../lib/options';
import { printData, printPaginatedData } from '../lib/output';
import { listParams, tableWithFooter } from '../lib/pagination';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const listCommand = addListOptions(
	new Command('list').description('List templates in the workspace'),
	'Sort by name (prefix with - for descending)',
).action(async (opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const result = await withSpinner('Fetching templates', config, () =>
			client.templates.list(listParams(opts), accountId),
		);
		printPaginatedData(result, config, (rows) => {
			const table = renderTable(rows, [
				{ header: 'ID', value: (r) => r.id },
				{ header: 'NAME', value: (r) => r.name },
				{ header: 'STATUS', value: (r) => r.status },
				{ header: 'CREATED', value: (r) => r.created_at },
			]);
			return tableWithFooter(table, result);
		});
	});
});

const getCommand = new Command('get')
	.description('Show a template by ID')
	.argument('<id>', 'Template ID')
	.action(async (id, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const template = await withSpinner('Fetching template', config, () =>
				client.templates.get(id, accountId),
			);
			printData(template, config, (t) =>
				renderKeyValue({
					id: t.id,
					name: t.name,
					status: t.status,
					roles: t.roles?.map((r) => r.name),
				}),
			);
		});
	});

const downloadPageCommand = addDownloadOptions(
	new Command('download-page')
		.description('Download a template page as a JPEG')
		.argument('<templateId>', 'Template ID')
		.argument('<pageId>', 'Page ID'),
).action(async (templateId, pageId, opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		await saveDownload(config, {
			message: 'Downloading page',
			download: () => client.templates.downloadPage(templateId, pageId, accountId),
			output: opts.output,
			defaultName: `${templateId}-page-${pageId}.jpg`,
			force: opts.force,
		});
	});
});

export const templatesCommand = new Command('templates')
	.description('List and inspect document templates')
	.addCommand(listCommand)
	.addCommand(getCommand)
	.addCommand(downloadPageCommand);
