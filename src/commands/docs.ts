import { spawn } from 'node:child_process';
import { Command } from '@commander-js/extra-typings';
import { printData, printInfo, printWarning } from '../lib/output';
import { runAction } from '../lib/run';

const DOCS_URL = 'https://api.assinafy.com.br/v1/docs';

export const docsCommand = new Command('docs')
	.description('Print (or open) the Assinafy API documentation URL')
	.option('--open', 'Open the documentation in your default browser')
	.action(async (opts, command) => {
		await runAction(command, async ({ config }) => {
			if (opts.open) {
				const opener =
					process.platform === 'darwin'
						? 'open'
						: process.platform === 'win32'
							? 'start'
							: 'xdg-open';
				const child = spawn(opener, [DOCS_URL], {
					stdio: 'ignore',
					detached: true,
					shell: process.platform === 'win32',
				});
				// Without an 'error' handler a missing opener binary (ENOENT) emits an
				// unhandled 'error' event that crashes the process.
				child.on('error', () =>
					printWarning(`Could not open a browser. Visit ${DOCS_URL}`, config),
				);
				child.unref();
				printInfo(`Opening ${DOCS_URL}`, config);
			}
			printData({ docs: DOCS_URL }, config, (data) => data.docs);
		});
	});
