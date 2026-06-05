import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	activeProfileName,
	configPath,
	DEFAULT_BASE_URL,
	readConfigFile,
	resolveConfig,
	writeConfigFile,
} from './config';

let tmpDir: string;
const ENV_KEYS = [
	'ASSINAFY_API_KEY',
	'ASSINAFY_TOKEN',
	'ASSINAFY_ACCOUNT_ID',
	'ASSINAFY_BASE_URL',
	'ASSINAFY_WEBHOOK_SECRET',
	'ASSINAFY_PROFILE',
];
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
	tmpDir = mkdtempSync(path.join(os.tmpdir(), 'assinafy-cli-test-'));
	process.env.ASSINAFY_CONFIG_DIR = tmpDir;
	for (const k of ENV_KEYS) {
		savedEnv[k] = process.env[k];
		delete process.env[k];
	}
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
	delete process.env.ASSINAFY_CONFIG_DIR;
	for (const k of ENV_KEYS) {
		if (savedEnv[k] === undefined) delete process.env[k];
		else process.env[k] = savedEnv[k];
	}
});

describe('config file round-trip', () => {
	it('writes with owner-only permissions and reads back', () => {
		writeConfigFile({
			default_profile: 'default',
			profiles: { default: { api_key: 'k_abc', account_id: 'acc_1' } },
		});
		const mode = statSync(configPath()).mode & 0o777;
		expect(mode).toBe(0o600);
		const round = readConfigFile();
		expect(round.profiles?.default?.api_key).toBe('k_abc');
	});

	it('returns an empty object when the file is missing', () => {
		expect(readConfigFile()).toEqual({});
	});

	it('returns an empty object when the file is malformed', () => {
		writeConfigFile({ profiles: { default: {} } });
		writeFileSync(configPath(), 'not json');
		expect(readConfigFile()).toEqual({});
	});
});

describe('activeProfileName', () => {
	it('prefers the flag, then env, then file default, then "default"', () => {
		expect(activeProfileName({ profile: 'flag' }, { default_profile: 'file' })).toBe('flag');
		process.env.ASSINAFY_PROFILE = 'env';
		expect(activeProfileName({}, { default_profile: 'file' })).toBe('env');
		delete process.env.ASSINAFY_PROFILE;
		expect(activeProfileName({}, { default_profile: 'file' })).toBe('file');
		expect(activeProfileName({}, {})).toBe('default');
	});
});

describe('resolveConfig precedence', () => {
	it('uses the built-in base URL when nothing is configured', () => {
		const cfg = resolveConfig({});
		expect(cfg.baseUrl).toBe(DEFAULT_BASE_URL);
		expect(cfg.apiKey).toBeUndefined();
	});

	it('flag overrides env overrides config file', () => {
		writeConfigFile({
			default_profile: 'default',
			profiles: { default: { api_key: 'from_file', account_id: 'acc_file' } },
		});
		process.env.ASSINAFY_API_KEY = 'from_env';
		expect(resolveConfig({}).apiKey).toBe('from_env');
		expect(resolveConfig({ apiKey: 'from_flag' }).apiKey).toBe('from_flag');
		// account_id only set in file → falls through to it
		expect(resolveConfig({}).accountId).toBe('acc_file');
	});

	it('normalizes a trailing slash on the base URL', () => {
		expect(resolveConfig({ baseUrl: 'https://x.test/v1/' }).baseUrl).toBe('https://x.test/v1');
	});

	it('reads from the selected profile', () => {
		writeConfigFile({
			default_profile: 'default',
			profiles: {
				default: { api_key: 'def' },
				sandbox: { api_key: 'sbx', base_url: 'https://sandbox.assinafy.com.br/v1' },
			},
		});
		const cfg = resolveConfig({ profile: 'sandbox' });
		expect(cfg.apiKey).toBe('sbx');
		expect(cfg.baseUrl).toBe('https://sandbox.assinafy.com.br/v1');
	});
});
