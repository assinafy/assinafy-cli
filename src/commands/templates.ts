import { Command } from '@commander-js/extra-typings';
import { requireAccountId } from '../lib/client';
import { writeBinary } from '../lib/files';
import { addListOptions } from '../lib/options';
import { printData, printSuccess } from '../lib/output';
import { listParams, paginationFooter } from '../lib/pagination';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const listCommand = addListOptions(
	new Command('list').description('List templates in the workspace'),
).action(async (opts, command) => {
	await runWithClient(command, async ({ client, config }) => {
		const accountId = requireAccountId(config);
		const result = await withSpinner('Fetching templates', config, () =>
			client.templates.list(listParams(opts), accountId),
		);
		printData(result.data, config, (rows) => {
			const table = renderTable(rows, [
				{ header: 'ID', value: (r) => r.id },
				{ header: 'NAME', value: (r) => r.name },
				{ header: 'STATUS', value: (r) => r.status },
				{ header: 'CREATED', value: (r) => r.created_at },
			]);
			const footer = paginationFooter(result);
			return footer ? `${table}\n${footer}` : table;
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

const downloadPageCommand = new Command('download-page')
	.description('Download a template page as a JPEG')
	.argument('<templateId>', 'Template ID')
	.argument('<pageId>', 'Page ID')
	.option('-o, --output <path>', 'Output file path')
	.action(async (templateId, pageId, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const buffer = await withSpinner('Downloading page', config, () =>
				client.templates.downloadPage(templateId, pageId, accountId),
			);
			const out = writeBinary(opts.output ?? `${templateId}-page-${pageId}.jpg`, buffer);
			printSuccess(`Saved ${buffer.byteLength} bytes to ${out}`, config);
			printData({ path: out, bytes: buffer.byteLength }, config, (d) => d.path);
		});
	});

export const templatesCommand = new Command('templates')
	.description('List and inspect document templates')
	.addCommand(listCommand)
	.addCommand(getCommand)
	.addCommand(downloadPageCommand);
