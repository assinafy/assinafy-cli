import { expect, it } from 'vitest';
import { compareSemver } from './semver-greater.mjs';

it('orders release versions and rejects invalid numeric prereleases', () => {
	const ordered = [
		'1.0.0-alpha',
		'1.0.0-alpha.1',
		'1.0.0-alpha.beta',
		'1.0.0-beta',
		'1.0.0-beta.2',
		'1.0.0-beta.11',
		'1.0.0-rc.1',
		'1.0.0',
		'2.0.0',
	];
	for (let i = 1; i < ordered.length; i++) {
		expect(compareSemver(ordered[i], ordered[i - 1])).toBe(1);
		expect(compareSemver(ordered[i - 1], ordered[i])).toBe(-1);
	}
	expect(compareSemver('1.0.0+build.1', '1.0.0+build.2')).toBe(0);
	expect(compareSemver('1.0.0-0a', '1.0.0-0')).toBe(1);
	for (const invalid of ['01.0.0', '1.0.0-01', '1.0.0-rc.01', '1.0.0-']) {
		expect(() => compareSemver(invalid, '1.0.0')).toThrow('Invalid SemVer');
	}
});
