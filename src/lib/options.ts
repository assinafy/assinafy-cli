import { type Command, Option, type OptionValues } from '@commander-js/extra-typings';

/**
 * Attach pagination flags shared by list commands.
 *
 * Written as a generic passthrough so commander's option typing is preserved.
 */
function addPaginationOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>) {
	return command
		.option('--page <n>', 'Page number to fetch')
		.option('--per-page <n>', 'Items per page');
}

/** Attach pagination plus search. */
function addSearchListOptions<
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

/** Attach the shared download flags: an explicit output path and an overwrite opt-in. */
export function addDownloadOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>) {
	return command
		.option('-o, --output <path>', 'Output file path')
		.option('--force', 'Overwrite the output file if it already exists');
}

/**
 * Attach the mutually-exclusive signer reference flags shared by assignment
 * create/estimate commands. Signers are required: the API rejects signer-less
 * assignments and cost estimates.
 */
export function addSignerRefOptions<
	Args extends unknown[],
	Opts extends OptionValues,
	Globals extends OptionValues,
>(command: Command<Args, Opts, Globals>) {
	return command
		.addOption(
			new Option('--signer-ids <csv>', 'Comma-separated signer IDs (required)').conflicts(
				'signers',
			),
		)
		.addOption(
			new Option(
				'--signers <json>',
				'JSON array of signer refs, with verification_method, step, … (required)',
			).conflicts('signerIds'),
		);
}
