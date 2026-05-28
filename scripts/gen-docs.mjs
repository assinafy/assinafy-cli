#!/usr/bin/env node
// Generate per-command reference docs from the CLI's own --help output.
// Accuracy by construction: the docs are exactly what `assinafy <cmd> --help` prints.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = path.join(root, 'dist', 'cli.cjs');
const docsDir = path.join(root, 'docs');

function help(args) {
	try {
		return execFileSync('node', [bin, ...args, '--help'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		});
	} catch (err) {
		// commander exits non-zero for help in some versions; stdout still holds the text.
		return err.stdout?.toString() ?? '';
	}
}

// Parse the "Commands:" block, returning child command names. Command lines start
// with exactly two leading spaces; description continuations are indented further,
// so the `^ {2}` anchor (not `\s{2,}`) avoids matching them as subcommands.
function subcommands(text) {
	const lines = text.split('\n');
	const start = lines.findIndex((l) => l.trim() === 'Commands:');
	if (start === -1) return [];
	const names = [];
	for (let i = start + 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line.trim()) break;
		const m = line.match(/^ {2}([a-z][\w-]*)/);
		if (m && m[1] !== 'help') names.push(m[1]);
	}
	return names;
}

function section(pathParts, depth) {
	const text = help(pathParts).trimEnd();
	const heading = '#'.repeat(Math.min(depth + 2, 6));
	let md = `${heading} \`assinafy ${pathParts.join(' ')}\`\n\n\`\`\`text\n${text}\n\`\`\`\n\n`;
	for (const sub of subcommands(text)) {
		md += section([...pathParts, sub], depth + 1);
	}
	return md;
}

const topLevel = subcommands(help([]));
mkdirSync(docsDir, { recursive: true });

let index = '# Command reference\n\nAuto-generated from `assinafy <command> --help`.\n\n';

for (const name of topLevel) {
	const md = `# \`assinafy ${name}\`\n\n${section([name], 0)}`;
	const file = `${name}.md`;
	writeFileSync(path.join(docsDir, file), md);
	index += `- [${name}](./${file})\n`;
}

writeFileSync(path.join(docsDir, 'README.md'), index);
console.log(`Generated docs for ${topLevel.length} commands in ${docsDir}`);
