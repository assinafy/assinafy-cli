import { spawn } from 'node:child_process';
import { Command } from '@commander-js/extra-typings';
import { printData, printInfo } from '../lib/output';
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
				spawn(opener, [DOCS_URL], {
					stdio: 'ignore',
					detached: true,
					shell: process.platform === 'win32',
				}).unref();
				printInfo(`Opening ${DOCS_URL}`, config);
			}
			printData({ docs: DOCS_URL }, config, (data) => data.docs);
		});
	});
