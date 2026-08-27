import { stripVTControlCharacters } from 'node:util';
import pc from 'picocolors';
import type { IDocumentStatsRow } from '../api';
import { sanitizeTerminalText } from './terminal';

export interface Column<T> {
	header: string;
	/** Extract the cell value; returned value is coerced/normalized for display. */
	value: (row: T) => unknown;
}

/** Render a list of rows as a column-aligned, header-underlined table string. */
export function renderTable<T>(rows: T[], columns: Column<T>[]): string {
	if (rows.length === 0) {
		return pc.dim('(no results)');
	}

	const headers = columns.map((c) => sanitizeTerminalText(c.header));
	const body = rows.map((row) => columns.map((c) => formatCell(c.value(row))));

	const widths = headers.map((header, i) => {
		const cellMax = body.reduce((max, cells) => Math.max(max, displayWidth(cells[i] ?? '')), 0);
		return Math.max(displayWidth(header), cellMax);
	});

	const pad = (text: string, width: number) =>
		text + ' '.repeat(Math.max(0, width - displayWidth(text)));

	const headerLine = headers.map((h, i) => pc.bold(pad(h, widths[i] ?? 0))).join('  ');
	const lines = body.map((cells) =>
		cells
			.map((c, i) => pad(c, widths[i] ?? 0))
			.join('  ')
			.trimEnd(),
	);

	return [headerLine, ...lines].join('\n');
}

/** Render every KPI published in an account/user document-statistics row. */
export function renderDocumentStats(rows: IDocumentStatsRow[]): string {
	return renderTable(rows, [
		{ header: 'PERIOD', value: (row) => row.period },
		{ header: 'UPLOADED', value: (row) => row.documents_uploaded },
		{ header: 'SENT', value: (row) => row.documents_sent },
		{ header: 'REQUESTS', value: (row) => row.signature_requests },
		{ header: 'NOTIFY EMAIL', value: (row) => row.signature_requests_notification_email },
		{ header: 'NOTIFY WA', value: (row) => row.signature_requests_notification_whatsapp },
		{ header: 'NOTIFY BYPASS', value: (row) => row.signature_requests_notification_bypass },
		{ header: 'VERIFY EMAIL', value: (row) => row.signature_requests_verification_email },
		{ header: 'VERIFY WA', value: (row) => row.signature_requests_verification_whatsapp },
		{ header: 'VERIFY BYPASS', value: (row) => row.signature_requests_verification_bypass },
		{
			header: 'VERIFY CERT',
			value: (row) => row.signature_requests_verification_digital_certificate,
		},
		{ header: 'VIEWED', value: (row) => row.signature_requests_viewed },
		{ header: 'COMPLETED', value: (row) => row.signature_requests_completed },
		{ header: 'CERTIFIED', value: (row) => row.documents_certified },
	]);
}

/** Render a single object as an aligned `key: value` block. */
export function renderKeyValue(obj: Record<string, unknown>, order?: string[]): string {
	const keys = order ?? Object.keys(obj);
	const present = keys.filter((k) => k in obj && obj[k] !== undefined);
	if (present.length === 0) {
		return pc.dim('(empty)');
	}
	const labels = new Map(present.map((key) => [key, sanitizeTerminalText(key)]));
	const labelWidth = Math.max(...present.map((key) => labels.get(key)?.length ?? 0));
	return present
		.map((k) => `${pc.dim(`${labels.get(k)}:`.padEnd(labelWidth + 1))} ${formatCell(obj[k])}`)
		.join('\n');
}

function formatCell(value: unknown): string {
	if (value === null || value === undefined) return pc.dim('—');
	if (typeof value === 'boolean') return value ? 'yes' : 'no';
	if (Array.isArray(value)) {
		return value.length === 0 ? pc.dim('—') : value.map((v) => formatCell(v)).join(', ');
	}
	if (typeof value === 'object') return sanitizeTerminalText(JSON.stringify(value));
	return sanitizeTerminalText(value);
}

/** Visible width ignoring ANSI escape sequences picocolors may have inserted. */
function displayWidth(text: string): number {
	return stripVTControlCharacters(text).length;
}
