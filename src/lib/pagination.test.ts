import { describe, expect, it } from 'vitest';
import { listParams, paginationFooter } from './pagination';

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching the ESC in ANSI codes
const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

describe('listParams', () => {
	it('maps flags to SDK params, omitting empties', () => {
		expect(listParams({ page: '2', perPage: '50', search: 'x', sort: '-created_at' })).toEqual({
			page: 2,
			'per-page': 50,
			search: 'x',
			sort: '-created_at',
		});
	});

	it('returns an empty object when no flags are set', () => {
		expect(listParams({})).toEqual({});
	});
});

describe('paginationFooter', () => {
	it('returns empty string with no meta', () => {
		expect(paginationFooter({ data: [] })).toBe('');
	});

	it('summarizes page/total/per-page', () => {
		const out = plain(
			paginationFooter({
				data: [],
				meta: { current_page: 1, last_page: 3, total: 42, per_page: 20 },
			}),
		);
		expect(out).toContain('page 1/3');
		expect(out).toContain('42 total');
		expect(out).toContain('20/page');
	});
});
