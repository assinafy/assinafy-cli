import { defineConfig } from 'tsup';

/**
 * Bundle the CLI into a single self-contained CommonJS file with a shebang so
 * it can be installed as the `assinafy` binary. All dependencies are inlined
 * (`noExternal`), so the published artifact has no runtime `node_modules`
 * requirement.
 */
export default defineConfig({
	entry: { cli: 'src/cli.ts' },
	format: ['cjs'],
	target: 'node22',
	platform: 'node',
	outExtension: () => ({ js: '.cjs' }),
	banner: { js: '#!/usr/bin/env node' },
	clean: true,
	bundle: true,
	noExternal: [/.*/],
	minify: false,
	sourcemap: false,
	dts: false,
});
