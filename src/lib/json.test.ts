import { describe, expect, it } from 'vitest';
import { CliError } from './errors';
import { collect, parseInteger, parseJsonArray, parseJsonObject, splitList } from './json';

describe('parseJsonObject', () => {
	it('returns undefined for undefined input', () => {
		expect(parseJsonObject(undefined, '--x')).toBeUndefined();
	});

	it('parses a JSON object', () => {
		expect(parseJsonObject('{"a":1}', '--x')).toEqual({ a: 1 });
	});

	it('throws on invalid JSON', () => {
		expect(() => parseJsonObject('nope', '--x')).toThrow(CliError);
	});

	it('throws when the JSON is not an object', () => {
		expect(() => parseJsonObject('[1,2]', '--x')).toThrow(/must be a JSON object/);
		expect(() => parseJsonObject('"s"', '--x')).toThrow(/must be a JSON object/);
	});
});

describe('parseJsonArray', () => {
	it('parses a JSON array', () => {
		expect(parseJsonArray('[1,2]', '--x')).toEqual([1, 2]);
	});

	it('throws when not an array', () => {
		expect(() => parseJsonArray('{}', '--x')).toThrow(/must be a JSON array/);
	});

	it('throws on invalid JSON', () => {
		expect(() => parseJsonArray('{', '--x')).toThrow(/must be valid JSON/);
	});
});

describe('splitList', () => {
	it('returns undefined for undefined', () => {
		expect(splitList(undefined)).toBeUndefined();
	});

	it('splits, trims, and drops empties', () => {
		expect(splitList('a, b , ,c')).toEqual(['a', 'b', 'c']);
	});

	it('returns an empty array for an empty string', () => {
		expect(splitList('')).toEqual([]);
	});
});

describe('parseInteger', () => {
	it('returns undefined for undefined', () => {
		expect(parseInteger(undefined, '--n')).toBeUndefined();
	});

	it('parses integers', () => {
		expect(parseInteger('42', '--n')).toBe(42);
	});

	it('throws on non-numeric input', () => {
		expect(() => parseInteger('abc', '--n')).toThrow(/must be an integer/);
	});
});

describe('collect', () => {
	it('accumulates values', () => {
		expect(collect('b', collect('a', []))).toEqual(['a', 'b']);
	});

	it('defaults the accumulator', () => {
		expect(collect('a')).toEqual(['a']);
	});
});
