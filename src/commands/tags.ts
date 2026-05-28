import { Command } from '@commander-js/extra-typings';
import type { IUpdateTagPayload } from '../api';
import { requireAccountId } from '../lib/client';
import { printData, printSuccess } from '../lib/output';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient } from '../lib/run';
import { withSpinner } from '../lib/spinner';
import { renderKeyValue, renderTable } from '../lib/table';

const tagColumns = [
	{ header: 'ID', value: (r: { id: string }) => r.id },
	{ header: 'NAME', value: (r: { name: string }) => r.name },
	{ header: 'COLOR', value: (r: { color: string | null }) => r.color },
];

const listCommand = new Command('list')
	.description('List workspace tags (alphabetical)')
	.option('--search <query>', 'Case-insensitive name filter')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const params = opts.search ? { search: opts.search } : {};
			const tags = await withSpinner('Fetching tags', config, () =>
				client.tags.list(params, accountId),
			);
			printData(tags, config, (rows) => renderTable(rows, tagColumns));
		});
	});

const createCommand = new Command('create')
	.description('Create a tag')
	.requiredOption('--name <name>', 'Tag name (unique per workspace)')
	.option('--color <hex>', '6-char hex color, with or without leading #')
	.action(async (opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const tag = await withSpinner('Creating tag', config, () =>
				client.tags.create({ name: opts.name, color: opts.color }, accountId),
			);
			printSuccess(`Created tag ${tag.id}`, config);
			printData(tag, config, (t) => renderKeyValue({ id: t.id, name: t.name, color: t.color }));
		});
	});

const updateCommand = new Command('update')
	.description('Update a tag name and/or color')
	.argument('<id>', 'Tag ID')
	.option('--name <name>', 'New name')
	.option('--color <hex>', '6-char hex color')
	.option('--clear-color', 'Clear the color')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			const payload: IUpdateTagPayload = {};
			if (opts.name) payload.name = opts.name;
			if (opts.clearColor) payload.color = null;
			else if (opts.color) payload.color = opts.color;
			const tag = await withSpinner('Updating tag', config, () =>
				client.tags.update(id, payload, accountId),
			);
			printSuccess(`Updated tag ${tag.id}`, config);
			printData(tag, config, (t) => renderKeyValue({ id: t.id, name: t.name, color: t.color }));
		});
	});

const deleteCommand = new Command('delete')
	.alias('rm')
	.description('Delete a tag')
	.argument('<id>', 'Tag ID')
	.option('--force', 'Detach the tag from everything first')
	.option('-y, --yes', 'Skip the confirmation prompt')
	.action(async (id, opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			const accountId = requireAccountId(config);
			if (!(await confirmDestructive(`Delete tag ${id}?`, Boolean(opts.yes)))) return;
			await withSpinner('Deleting tag', config, () =>
				client.tags.delete(id, { force: opts.force, accountId }),
			);
			printSuccess(`Deleted tag ${id}`, config);
			printData({ deleted: id }, config);
		});
	});

export const tagsCommand = new Command('tags')
	.description('Manage workspace tags')
	.addCommand(listCommand)
	.addCommand(createCommand)
	.addCommand(updateCommand)
	.addCommand(deleteCommand);
