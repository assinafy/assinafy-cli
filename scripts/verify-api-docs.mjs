#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'docs', 'api-operations.json'), 'utf8'));
const reference = readFileSync(path.join(root, 'docs', 'api-reference.md'), 'utf8');
const publicIdentifier = /^(?:document|assignment|signature|signer|user|template)_[a-z_]+$/;

for (const operation of manifest.operations) {
	const marker = `\`${operation.method} ${operation.path}\``;
	const start = reference.indexOf(`\n${marker}\n`);
	if (start === -1) throw new Error(`Missing API documentation for ${marker}`);
	const next = reference.indexOf('\n### ', start + marker.length);
	const section = reference.slice(start, next === -1 ? reference.length : next);
	if (!section.includes('#### Responses'))
		throw new Error(`${marker} has no response documentation`);
	if (operation.hasRequestBody && !section.includes('#### Request Body')) {
		throw new Error(`${marker} has no request-body documentation`);
	}
}

if (!reference.includes(`Contract SHA-256: \`${manifest.hash}\``)) {
	throw new Error('API reference and operation manifest hashes do not match');
}

let expectedStatus;
let json;
for (const line of reference.split('\n')) {
	const heading = line.match(/^##### (\d{3})\b/);
	if (heading) expectedStatus = Number(heading[1]);
	else if (/^#{1,4} /.test(line)) expectedStatus = undefined;
	if (line === '```json') {
		json = [];
	} else if (json !== undefined) {
		if (line === '```') {
			const payload = JSON.parse(json.join('\n'));
			verifyPlaceholderValues(payload);
			if (
				expectedStatus !== undefined &&
				payload &&
				!Array.isArray(payload) &&
				typeof payload.status === 'number' &&
				payload.status !== expectedStatus
			) {
				throw new Error(
					`Response example status ${payload.status} does not match ${expectedStatus}`,
				);
			}
			json = undefined;
		} else {
			json.push(line);
		}
	}
}

const unsafeEmail = reference
	.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)
	?.find((email) => !/@(example\.com|example\.test|example\.invalid)$/i.test(email));
if (unsafeEmail) throw new Error('API reference contains a non-placeholder email');

if (/"(?:api_key|access_token)"\s*:\s*"(?!example_credential")/i.test(reference)) {
	throw new Error('API reference contains a non-placeholder credential');
}

console.log(`Verified documentation for ${manifest.operations.length} API operations`);

function verifyPlaceholderValues(value, key = '') {
	if (Array.isArray(value)) {
		for (const item of value) {
			if (typeof item === 'string' && isIdentifierKey(key)) verifyIdentifier(item, key);
			else verifyPlaceholderValues(item, key);
		}
		return;
	}
	if (value && typeof value === 'object') {
		for (const [childKey, child] of Object.entries(value)) {
			verifyPlaceholderValues(child, childKey);
		}
		return;
	}
	const normalizedKey = normalizeKey(key);
	if (value === null || value === undefined) return;
	if (isCredentialKey(normalizedKey)) {
		const expected =
			normalizedKey.includes('api_key') ||
			normalizedKey.includes('access_token') ||
			normalizedKey.includes('credential')
				? 'example_credential'
				: 'example_secret';
		if (value !== expected) throw new Error(`API reference contains a non-placeholder ${key}`);
		return;
	}
	if (isGovernmentKey(normalizedKey)) {
		const length = normalizedKey === 'cnpj' ? 14 : 11;
		if (value !== '0'.repeat(length)) {
			throw new Error(`API reference contains a non-placeholder ${key}`);
		}
		return;
	}
	if (/(?:^|_)(?:email)$/.test(normalizedKey)) {
		if (!/^user[1-9]\d*@example\.com$/.test(value)) {
			throw new Error(`API reference contains a non-placeholder ${key}`);
		}
		return;
	}
	if (normalizedKey === 'recipient') {
		if (value !== '+5500000000000' && !/^user[1-9]\d*@example\.com$/.test(value)) {
			throw new Error('API reference contains a non-placeholder recipient');
		}
		return;
	}
	if (
		/(?:^|_)(?:telephone|telephone_number|phone|phone_number|whatsapp_phone_number)$/.test(
			normalizedKey,
		)
	) {
		if (value !== '+5500000000000') {
			throw new Error(`API reference contains a non-placeholder ${key}`);
		}
		return;
	}
	if (normalizedKey === 'full_name') {
		if (value !== 'Example User')
			throw new Error('API reference contains a non-placeholder full_name');
		return;
	}
	if (typeof value === 'string' && isIdentifierKey(key)) {
		verifyIdentifier(value, key);
		return;
	}
	if (isUrlKey(normalizedKey)) {
		if (!/^https:\/\/example\.com\/example-url-[1-9]\d*$/.test(value)) {
			throw new Error(`API reference contains a non-placeholder URL in ${key}`);
		}
		return;
	}
	if (typeof value !== 'string') return;
	if (
		/^[a-z][a-z\d+.-]*:\/\//i.test(value) &&
		!/^https:\/\/example\.com\/example-url-[1-9]\d*$/.test(value)
	) {
		throw new Error(`API reference contains a non-placeholder URL in ${key || 'JSON'}`);
	}
}

function verifyIdentifier(value, key) {
	if (!publicIdentifier.test(value) && !/^example_id_[1-9]\d*$/.test(value)) {
		throw new Error(`API reference contains a non-placeholder identifier in ${key}`);
	}
}

function isCredentialKey(key) {
	return (
		key === 'authorization' ||
		key === 'credential' ||
		key === 'credentials' ||
		key.endsWith('_credential') ||
		key.endsWith('_credentials') ||
		key === 'secret' ||
		key.endsWith('_secret') ||
		key === 'password' ||
		key.endsWith('_password') ||
		key === 'token' ||
		key.endsWith('_token') ||
		key === 'api_key' ||
		key === 'access_token' ||
		key === 'signer_access_code' ||
		key === 'verification_code'
	);
}

function isGovernmentKey(key) {
	return key === 'government_id' || key === 'tax_id' || key === 'cpf' || key === 'cnpj';
}

function isIdentifierKey(key) {
	const normalizedKey = normalizeKey(key);
	return (
		normalizedKey === 'id' ||
		normalizedKey === 'hash' ||
		normalizedKey === 'copy_receivers' ||
		/_(?:id|ids)$/.test(normalizedKey)
	);
}

function isUrlKey(key) {
	return (
		key === 'url' ||
		key.endsWith('_url') ||
		key === 'uri' ||
		key.endsWith('_uri') ||
		key === 'endpoint'
	);
}

function normalizeKey(key) {
	return key
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.replaceAll('-', '_')
		.toLowerCase();
}
