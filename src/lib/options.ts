import type { Command, OptionValues } from '@commander-js/extra-typings';

/**
 * Attach pagination flags shared by list commands.
 *
 * Written as a generic passthrough so commander's option typing is preserved.
 */
export function addPaginationOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>) {
	return command
		.option('--page <n>', 'Page number to fetch')
		.option('--per-page <n>', 'Items per page');
}

/** Attach pagination plus search. */
export function addSearchListOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>) {
	return addPaginationOptions(command).option('--search <query>', 'Filter by a search query');
}

/** Attach pagination plus an endpoint-specific sort option. */
export function addSortableListOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>, description: string) {
	return addPaginationOptions(command).option('--sort <field>', description);
}

/** Attach pagination, search, and endpoint-specific sorting. */
export function addListOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>, sortDescription = 'Sort by field') {
	return addSearchListOptions(command).option('--sort <field>', sortDescription);
}
