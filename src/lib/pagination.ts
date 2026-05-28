import pc from 'picocolors';
import type { PaginatedResult } from '../api';
import { parseInteger } from './json';

/** Common pagination/search flags accepted by `list` commands. */
export interface ListFlags {
	page?: string;
	perPage?: string;
	search?: string;
	sort?: string;
}

/** Build the SDK list params object from parsed list flags (omitting empties). */
export function listParams(flags: ListFlags): Record<string, string | number> {
	const params: Record<string, string | number> = {};
	const page = parseInteger(flags.page, '--page');
	const perPage = parseInteger(flags.perPage, '--per-page');
	if (page !== undefined) params.page = page;
	if (perPage !== undefined) params['per-page'] = perPage;
	if (flags.search) params.search = flags.search;
	if (flags.sort) params.sort = flags.sort;
	return params;
}

/** Render a one-line pagination summary, or an empty string when no meta exists. */
export function paginationFooter(result: PaginatedResult<unknown>): string {
	const meta = result.meta;
	if (!meta) return '';
	const parts: string[] = [];
	if (meta.current_page !== undefined && meta.last_page !== undefined) {
		parts.push(`page ${meta.current_page}/${meta.last_page}`);
	}
	if (meta.total !== undefined) {
		parts.push(`${meta.total} total`);
	}
	if (meta.per_page !== undefined) {
		parts.push(`${meta.per_page}/page`);
	}
	return parts.length > 0 ? pc.dim(parts.join('  ·  ')) : '';
}
