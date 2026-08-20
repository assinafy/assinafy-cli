import { stripVTControlCharacters } from 'node:util';

// biome-ignore lint/suspicious/noControlCharactersInRegex: these are the terminal C0/C1 controls
const TERMINAL_CONTROLS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g;

/** Make one untrusted value safe to render on a terminal line. */
export function sanitizeTerminalText(value: unknown): string {
	const stripped = stripVTControlCharacters(String(value));
	return stripped
		.replace(TERMINAL_CONTROLS, ' ')
		.replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '');
}
