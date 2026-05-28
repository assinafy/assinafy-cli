import { Command } from '@commander-js/extra-typings';
import pc from 'picocolors';
import { assignmentsCommand } from './commands/assignments';
import { authCommand } from './commands/auth';
import { configCommand } from './commands/config/index';
import { docsCommand } from './commands/docs';
import { documentsCommand } from './commands/documents';
import { fieldsCommand } from './commands/fields';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { sendCommand } from './commands/send';
import { signerCommand } from './commands/signer';
import { signersCommand } from './commands/signers';
import { tagsCommand } from './commands/tags';
import { templatesCommand } from './commands/templates';
import { webhooksCommand } from './commands/webhooks';
import { whoamiCommand } from './commands/whoami';
import { workspacesCommand } from './commands/workspaces';
import { setupCliExitHandler } from './lib/cli-exit';
import { PACKAGE_NAME, VERSION } from './lib/version';

setupCliExitHandler();

const program = new Command()
	.name('assinafy')
	.description('Assinafy CLI — the command-line interface for the Assinafy digital-signature API')
	.configureHelp({ showGlobalOptions: true, styleTitle: (s) => pc.gray(s) })
	.configureOutput({
		writeErr: (str) => process.stderr.write(str.replace(/^error:/, () => pc.red('error:'))),
	})
	.version(`${PACKAGE_NAME} v${VERSION}`, '-v, --version', 'Output the current version')
	.option('--api-key <key>', 'API key (overrides env/config)')
	.option('--token <token>', 'Legacy JWT access token (overrides env/config)')
	.option('--account-id <id>', 'Default account/workspace ID (overrides env/config)')
	.option('--base-url <url>', 'API base URL (overrides env/config)')
	.option('-p, --profile <name>', 'Config profile to use (overrides ASSINAFY_PROFILE)')
	.option('--json', 'Output machine-readable JSON')
	.option('-q, --quiet', 'Suppress spinners and status messages')
	.addHelpText(
		'after',
		`
${pc.gray('Examples:')}

  ${pc.blue('$ assinafy login')}                              Store an API key
  ${pc.blue('$ assinafy whoami')}                             Verify credentials
  ${pc.blue('$ assinafy documents upload contract.pdf')}      Upload a PDF
  ${pc.blue('$ assinafy send contract.pdf --signer "Ana <ana@x.com>"')}

${pc.gray('Sandbox:')} target it with ${pc.blue('--base-url https://sandbox.assinafy.com.br/v1')}
`,
	)
	// Headline workflow
	.addCommand(sendCommand)
	// Core resources
	.addCommand(documentsCommand)
	.addCommand(signersCommand)
	.addCommand(assignmentsCommand)
	.addCommand(templatesCommand)
	.addCommand(tagsCommand)
	.addCommand(fieldsCommand)
	.addCommand(webhooksCommand)
	.addCommand(workspacesCommand)
	// Signer-side + auth
	.addCommand(signerCommand)
	.addCommand(authCommand)
	// Account / meta
	.addCommand(loginCommand)
	.addCommand(logoutCommand)
	.addCommand(whoamiCommand)
	.addCommand(configCommand)
	.addCommand(docsCommand);

program.parseAsync().catch((err) => {
	process.stderr.write(`${pc.red('error:')} ${err instanceof Error ? err.message : String(err)}\n`);
	process.exit(1);
});
