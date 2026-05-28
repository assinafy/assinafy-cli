import pc from 'picocolors';

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

	const headers = columns.map((c) => c.header);
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

/** Render a single object as an aligned `key: value` block. */
export function renderKeyValue(obj: Record<string, unknown>, order?: string[]): string {
	const keys = order ?? Object.keys(obj);
	const present = keys.filter((k) => k in obj && obj[k] !== undefined);
	if (present.length === 0) {
		return pc.dim('(empty)');
	}
	const labelWidth = Math.max(...present.map((k) => k.length));
	return present
		.map((k) => `${pc.dim(`${k}:`.padEnd(labelWidth + 1))} ${formatCell(obj[k])}`)
		.join('\n');
}

function formatCell(value: unknown): string {
	if (value === null || value === undefined) return pc.dim('—');
	if (typeof value === 'boolean') return value ? 'yes' : 'no';
	if (Array.isArray(value)) {
		return value.length === 0 ? pc.dim('—') : value.map((v) => formatCell(v)).join(', ');
	}
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

/** Visible width ignoring ANSI escape sequences picocolors may have inserted. */
function displayWidth(text: string): number {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping ANSI codes
	return text.replace(/\[[0-9;]*m/g, '').length;
}
