import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * The default production base URL. The sandbox lives at a different host
 * (`https://sandbox.assinafy.com.br/v1`); point `--base-url` / `ASSINAFY_BASE_URL`
 * there while testing.
 */
export const DEFAULT_BASE_URL = 'https://api.assinafy.com.br/v1';

/** Credentials + settings stored for a single named profile. */
export interface ProfileConfig {
	api_key?: string;
	token?: string;
	account_id?: string;
	base_url?: string;
	webhook_secret?: string;
}

/** On-disk shape of `~/.config/assinafy/config.json`. */
export interface ConfigFile {
	default_profile?: string;
	profiles?: Record<string, ProfileConfig>;
}

/**
 * Global options shared by every command, parsed by commander and merged from
 * the parent (`optsWithGlobals`). Field names mirror the long flag in camelCase.
 */
export interface GlobalOptions {
	apiKey?: string;
	token?: string;
	accountId?: string;
	baseUrl?: string;
	profile?: string;
	json?: boolean;
	quiet?: boolean;
}

/** Fully resolved configuration after merging flags, env vars, and the config file. */
export interface ResolvedConfig {
	apiKey?: string;
	token?: string;
	accountId?: string;
	baseUrl: string;
	webhookSecret?: string;
	/** The profile name that was selected (even if it does not exist on disk). */
	profile: string;
	json: boolean;
	quiet: boolean;
}

const DEFAULT_PROFILE = 'default';

/** Absolute path to the config directory (honours `XDG_CONFIG_HOME` / `%APPDATA%`). */
export function configDir(): string {
	if (process.env.ASSINAFY_CONFIG_DIR) {
		return process.env.ASSINAFY_CONFIG_DIR;
	}
	if (process.platform === 'win32' && process.env.APPDATA) {
		return path.join(process.env.APPDATA, 'assinafy');
	}
	const xdg = process.env.XDG_CONFIG_HOME;
	const base = xdg && xdg.length > 0 ? xdg : path.join(os.homedir(), '.config');
	return path.join(base, 'assinafy');
}

/** Absolute path to the config file. */
export function configPath(): string {
	return path.join(configDir(), 'config.json');
}

/** Read and parse the config file. Returns an empty object when absent or invalid. */
export function readConfigFile(): ConfigFile {
	const file = configPath();
	if (!existsSync(file)) {
		return {};
	}
	try {
		const parsed = JSON.parse(readFileSync(file, 'utf8')) as ConfigFile;
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

/** Persist the config file (creating the directory) with owner-only permissions. */
export function writeConfigFile(config: ConfigFile): void {
	const dir = configDir();
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true, mode: 0o700 });
	}
	writeFileSync(configPath(), `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}

/** The active profile name, honouring the flag, env var, then the file default. */
export function activeProfileName(globals: GlobalOptions, file = readConfigFile()): string {
	return globals.profile || process.env.ASSINAFY_PROFILE || file.default_profile || DEFAULT_PROFILE;
}

/**
 * Resolve effective configuration with precedence: CLI flag > env var > profile
 * in the config file > built-in default (base URL only).
 */
export function resolveConfig(globals: GlobalOptions): ResolvedConfig {
	const file = readConfigFile();
	const profileName = activeProfileName(globals, file);
	const profile = file.profiles?.[profileName] ?? {};

	const pick = (flag: string | undefined, env: string | undefined, stored: string | undefined) =>
		flag ?? env ?? stored;

	const baseUrl =
		pick(globals.baseUrl, process.env.ASSINAFY_BASE_URL, profile.base_url) ?? DEFAULT_BASE_URL;

	return {
		apiKey: pick(globals.apiKey, process.env.ASSINAFY_API_KEY, profile.api_key),
		token: pick(globals.token, process.env.ASSINAFY_TOKEN, profile.token),
		accountId: pick(globals.accountId, process.env.ASSINAFY_ACCOUNT_ID, profile.account_id),
		baseUrl: normalizeBaseUrl(baseUrl),
		webhookSecret: pick(undefined, process.env.ASSINAFY_WEBHOOK_SECRET, profile.webhook_secret),
		profile: profileName,
		json: Boolean(globals.json),
		quiet: Boolean(globals.quiet),
	};
}

function normalizeBaseUrl(raw: string): string {
	return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}
