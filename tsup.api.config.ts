import { defineConfig } from 'tsup';

export default defineConfig({
	entry: { api: 'src/api/index.ts' },
	format: ['esm', 'cjs'],
	target: 'node22',
	platform: 'node',
	outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
	outDir: 'dist',
	clean: false,
	bundle: true,
	sourcemap: true,
	dts: false,
});
