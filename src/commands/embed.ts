import { Command, Option } from '@commander-js/extra-typings';
import { requireAccountId } from '../lib/client';
import { printData } from '../lib/output';
import { confirmDestructive } from '../lib/prompts';
import { runWithClient, runWithPublicClient } from '../lib/run';

const origins = new Command('origins').description('Manage origins allowed to embed signing pages');
origins.addCommand(
	new Command('list').description('List allowed origins').action(async (_opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			printData(await client.embed.listOrigins(requireAccountId(config)), config);
		});
	}),
);
origins.addCommand(
	new Command('create')
		.description('Allow an exact origin')
		.requiredOption('--origin <url>', 'HTTPS origin (HTTP allowed for localhost/127.0.0.1)')
		.action(async (opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				printData(await client.embed.createOrigin(opts.origin, requireAccountId(config)), config);
			});
		}),
);
origins.addCommand(
	new Command('update')
		.description('Replace an allowed origin')
		.argument('<originId>', 'Origin ID')
		.requiredOption('--origin <url>', 'New exact origin')
		.action(async (id, opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				printData(
					await client.embed.updateOrigin(id, opts.origin, requireAccountId(config)),
					config,
				);
			});
		}),
);
origins.addCommand(
	new Command('delete')
		.description('Remove an allowed origin')
		.argument('<originId>', 'Origin ID')
		.option('-y, --yes', 'Skip confirmation')
		.action(async (id, opts, command) => {
			await runWithClient(command, async ({ client, config }) => {
				if (!(await confirmDestructive(`Remove embed origin ${id}?`, Boolean(opts.yes)))) return;
				printData(await client.embed.deleteOrigin(id, requireAccountId(config)), config);
			});
		}),
);

const session = new Command('session')
	.description('Mint a private iframe URL valid for five minutes')
	.argument('<documentId>', 'Document ID')
	.argument('<assignmentId>', 'Assignment ID')
	.argument('<signerId>', 'Signer ID')
	.action(async (did, aid, sid, _opts, command) => {
		await runWithClient(command, async ({ client, config }) => {
			printData(await client.embed.createSession(did, aid, sid), config);
		});
	});
const exchange = new Command('exchange')
	.description('Consume a session token (Assinafy embed page operation)')
	.addOption(
		new Option('--session-token <token>', 'Private session token')
			.env('ASSINAFY_EMBED_SESSION_TOKEN')
			.makeOptionMandatory(),
	)
	.option('--parent-origin <url>', 'Origin hosting the iframe')
	.action(async (opts, command) => {
		await runWithPublicClient(command, async ({ client, config }) => {
			printData(await client.embed.exchangeSession(opts.sessionToken, opts.parentOrigin), config);
		});
	});

export const embedCommand = new Command('embed')
	.description('Embedded signing origins and sessions')
	.addCommand(origins)
	.addCommand(session)
	.addCommand(exchange);
