import type { Command, OptionValues } from '@commander-js/extra-typings';

/**
 * Attach the standard pagination/search flags shared by every `list` command.
 *
 * Written as a generic passthrough so commander's option typing is preserved:
 * the returned command's `opts()` includes `page`, `perPage`, `search`, `sort`
 * on top of whatever options the caller already declared.
 */
export function addListOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>) {
	return command
		.option('--page <n>', 'Page number to fetch')
		.option('--per-page <n>', 'Items per page')
		.option('--search <query>', 'Filter results by a search query')
		.option('--sort <field>', 'Sort by field (prefix with - for descending)');
}
