#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const includedLocations = new Set(
	Object.entries(lock.packages)
		.filter(([location, metadata]) => location && metadata.dev !== true)
		.map(([location]) => location),
);

for (const name of ['@clack/prompts', '@commander-js/extra-typings', 'commander', 'picocolors']) {
	includeDependencyTree('', name);
}

const dependencies = [...includedLocations]
	.map((location) => {
		const directory = path.join(root, location);
		const pkg = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'));
		const licenseFile = readdirSync(directory).find((name) => /^licen[cs]e(?:\.|$)/i.test(name));
		return {
			name: pkg.name,
			version: pkg.version,
			license: pkg.license ?? 'See package source',
			source: repositoryUrl(pkg.repository) ?? pkg.homepage,
			text: licenseFile
				? readFileSync(path.join(directory, licenseFile), 'utf8').trim()
				: undefined,
		};
	})
	.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

let output = `# Third-party notices

The self-contained Assinafy CLI bundle includes the following third-party software. Each section preserves the license notice distributed by that package.
`;

for (const dependency of dependencies) {
	output += `\n## ${dependency.name} ${dependency.version}\n\nLicense: ${dependency.license}\n`;
	if (dependency.source) output += `\nSource: ${dependency.source}\n`;
	if (dependency.text) {
		output += `\n${dependency.text
			.split('\n')
			.map((line) => (line.trimEnd() ? `    ${line.trimEnd()}` : ''))
			.join('\n')}\n`;
	}
}

writeFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), `${output.trimEnd()}\n`);
console.log(`Generated notices for ${dependencies.length} bundled/runtime packages`);

function includeDependencyTree(parentLocation, name) {
	const location = resolvePackageLocation(parentLocation, name);
	if (!location || includedLocations.has(location)) return;
	includedLocations.add(location);
	const metadata = lock.packages[location];
	for (const dependency of Object.keys({
		...metadata.dependencies,
		...metadata.optionalDependencies,
	})) {
		includeDependencyTree(location, dependency);
	}
}

function resolvePackageLocation(parentLocation, name) {
	let current = parentLocation;
	while (current && current !== '.') {
		const candidate = path.posix.join(current, 'node_modules', name);
		if (lock.packages[candidate]) return candidate;
		current = path.posix.dirname(current);
	}
	const rootLocation = path.posix.join('node_modules', name);
	return lock.packages[rootLocation] ? rootLocation : undefined;
}

function repositoryUrl(repository) {
	if (typeof repository === 'string') return repository;
	return repository?.url;
}
