#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

const SEMVER =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function parse(value) {
	const match = SEMVER.exec(value);
	if (!match) throw new Error(`Invalid SemVer: ${value}`);
	return {
		core: [BigInt(match[1]), BigInt(match[2]), BigInt(match[3])],
		prerelease: match[4]?.split('.') ?? [],
	};
}

export function compareSemver(leftValue, rightValue) {
	const left = parse(leftValue);
	const right = parse(rightValue);
	for (let index = 0; index < 3; index++) {
		if (left.core[index] !== right.core[index]) {
			return left.core[index] > right.core[index] ? 1 : -1;
		}
	}
	if (left.prerelease.length === 0 || right.prerelease.length === 0) {
		return left.prerelease.length === right.prerelease.length
			? 0
			: left.prerelease.length === 0
				? 1
				: -1;
	}
	const length = Math.max(left.prerelease.length, right.prerelease.length);
	for (let index = 0; index < length; index++) {
		const leftPart = left.prerelease[index];
		const rightPart = right.prerelease[index];
		if (leftPart === undefined || rightPart === undefined) {
			return leftPart === rightPart ? 0 : leftPart === undefined ? -1 : 1;
		}
		if (leftPart === rightPart) continue;
		const leftNumeric = /^\d+$/.test(leftPart);
		const rightNumeric = /^\d+$/.test(rightPart);
		if (leftNumeric && rightNumeric) return BigInt(leftPart) > BigInt(rightPart) ? 1 : -1;
		if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
		return leftPart > rightPart ? 1 : -1;
	}
	return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	if (process.argv.length !== 4) process.exit(2);
	try {
		process.exit(compareSemver(process.argv[2], process.argv[3]) > 0 ? 0 : 1);
	} catch {
		process.exit(2);
	}
}
