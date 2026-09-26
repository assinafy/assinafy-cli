import { Command } from '@commander-js/extra-typings';
import { openBrowser } from '../lib/oauth-browser';
import { printData, printInfo, printWarning } from '../lib/output';
import { runAction } from '../lib/run';

const DOCS_URL = 'https://api.assinafy.com.br/v1/docs';

export const docsCommand = new Command('docs')
	.description('Print (or open) the Assinafy API documentation URL')
	.option('--open', 'Open the documentation in your default browser')
	.action(async (opts, command) => {
		await runAction(command, async ({ config }) => {
			if (opts.open) {
				try {
					await openBrowser(DOCS_URL);
					printInfo(`Opening ${DOCS_URL}`, config);
				} catch {
					printWarning(`Could not open a browser. Visit ${DOCS_URL}`, config);
				}
			}
			printData({ docs: DOCS_URL }, config, (data) => data.docs);
		});
	});
