#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsUrl = 'https://api.assinafy.com.br/v1/docs';
const specUrl = `${docsUrl}/openapi.json`;
const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);
const exampleIds = new Map();
const exampleEmails = new Map();
const exampleUrls = new Map();
const publicIdentifier = /^(?:document|assignment|signature|signer|user|template)_[a-z_]+$/;

const response = await fetch(specUrl);
if (!response.ok) throw new Error(`Failed to fetch ${specUrl}: HTTP ${response.status}`);
const source = await response.text();
const spec = JSON.parse(source);
const hash = createHash('sha256').update(source).digest('hex');

const operations = Object.entries(spec.paths).flatMap(([apiPath, pathItem]) =>
	Object.entries(pathItem)
		.filter(([method]) => methods.has(method))
		.map(([method, operation]) => ({
			method: method.toUpperCase(),
			path: apiPath,
			tag: operation.tags?.[0] ?? 'Other',
			summary: operation.summary ?? `${method.toUpperCase()} ${apiPath}`,
			operationId: operation.operationId,
			hasRequestBody: operation.requestBody !== undefined,
		})),
);

const sections = [];
for (let offset = 0; offset < operations.length; offset += 10) {
	const batch = operations.slice(offset, offset + 10);
	sections.push(
		...(await Promise.all(
			batch.map(async (operation) => {
				const url = new URL(`${docsUrl}/markdown`);
				url.searchParams.set('method', operation.method.toLowerCase());
				url.searchParams.set('path', operation.path);
				const rendered = await fetch(url);
				if (!rendered.ok) {
					throw new Error(
						`Failed to render ${operation.method} ${operation.path}: HTTP ${rendered.status}`,
					);
				}
				const markdown = normalizeResponseStatuses((await rendered.text()).trim());
				return { ...operation, markdown: lowerHeadings(markdown) };
			}),
		)),
	);
}

const grouped = Map.groupBy(sections, (operation) => operation.tag);
let markdown = `# Assinafy API v1 — request/response reference

Generated from the official [Assinafy OpenAPI document](${specUrl}) and its native Markdown renderer. It contains every published operation and the complete examples supplied by Assinafy. Runtime-only SDK helpers are documented in [sdk-reference.md](./sdk-reference.md).

The renderer reuses a generic 400 envelope for several non-400 errors; top-level numeric \`status\` fields below are normalized to their documented HTTP response code. Example identifiers, contact details, and credentials are replaced with deterministic non-production placeholders.

- OpenAPI: ${spec.openapi}
- API document version: ${spec.info.version}
- Operations: ${operations.length}
- Contract SHA-256: \`${hash}\`
`;

for (const [tag, tagged] of grouped) {
	markdown += `\n## ${tag}\n\n${tagged.map((operation) => operation.markdown).join('\n\n')}\n`;
}

markdown = sanitizeExampleValues(markdown);

writeFileSync(path.join(root, 'docs', 'api-reference.md'), markdown);
writeFileSync(
	path.join(root, 'docs', 'api-operations.json'),
	`${JSON.stringify({ specUrl, hash, operations }, null, 2)}\n`,
);
console.log(`Generated ${operations.length} API operations (${hash.slice(0, 12)})`);

function lowerHeadings(markdown) {
	return markdown.replace(/^(#{1,3}) /gm, (_line, hashes) => `${'#'.repeat(hashes.length + 2)} `);
}

function normalizeResponseStatuses(markdown) {
	return markdown.replace(
		/^(### (\d{3})\b[^\n]*\n)([\s\S]*?)(?=^### \d{3}\b|(?![\s\S]))/gm,
		(_section, heading, status, body) =>
			`${heading}${body.replace(/```json\n([\s\S]*?)\n```/g, (block, json) => {
				try {
					const payload = JSON.parse(json);
					if (payload && !Array.isArray(payload) && typeof payload.status === 'number') {
						payload.status = Number(status);
						return `\`\`\`json\n${JSON.stringify(payload, null, 4)}\n\`\`\``;
					}
				} catch {
					// Preserve non-JSON examples exactly as published.
				}
				return block;
			})}`,
	);
}

function sanitizeExampleValues(markdown) {
	return markdown
		.replace(/```json\n([\s\S]*?)\n```/g, (block, json) => {
			try {
				return `\`\`\`json\n${JSON.stringify(sanitizeJsonValue(JSON.parse(json)), null, 4)}\n\`\`\``;
			} catch {
				return block;
			}
		})
		.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, (email) => {
			const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
			if (['example.com', 'example.test', 'example.invalid'].includes(domain)) return email;
			return placeholderEmail(email);
		})
		.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '192.0.2.1');
}

function sanitizeJsonValue(value, key = '') {
	if (Array.isArray(value)) {
		return value.map((item) =>
			typeof item === 'string' && isIdentifierKey(key)
				? placeholderId(item)
				: sanitizeJsonValue(item, key),
		);
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([childKey, child]) => [
				childKey,
				sanitizeJsonValue(child, childKey),
			]),
		);
	}
	const normalizedKey = normalizeKey(key);
	if (value === null || value === undefined) return value;
	if (isCredentialKey(normalizedKey)) {
		return normalizedKey.includes('api_key') ||
			normalizedKey.includes('access_token') ||
			normalizedKey.includes('credential')
			? 'example_credential'
			: 'example_secret';
	}
	if (isGovernmentKey(normalizedKey))
		return normalizedKey === 'cnpj' ? '0'.repeat(14) : '0'.repeat(11);
	if (/(?:^|_)(?:email)$/.test(normalizedKey)) return placeholderEmail(String(value));
	if (normalizedKey === 'recipient') {
		return String(value).includes('@') ? placeholderEmail(String(value)) : '+5500000000000';
	}
	if (
		/(?:^|_)(?:telephone|telephone_number|phone|phone_number|whatsapp_phone_number)$/.test(
			normalizedKey,
		)
	) {
		return '+5500000000000';
	}
	if (normalizedKey === 'full_name') return 'Example User';
	if (typeof value === 'string' && isIdentifierKey(key)) return placeholderId(value);
	if (isUrlKey(normalizedKey)) return placeholderUrl(String(value));
	if (typeof value !== 'string') return value;
	if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
		return placeholderUrl(value);
	}
	return value;
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

function placeholderId(value) {
	if (publicIdentifier.test(value)) return value;
	if (!exampleIds.has(value)) exampleIds.set(value, `example_id_${exampleIds.size + 1}`);
	return exampleIds.get(value);
}

function placeholderEmail(value) {
	if (!exampleEmails.has(value)) {
		exampleEmails.set(value, `user${exampleEmails.size + 1}@example.com`);
	}
	return exampleEmails.get(value);
}

function placeholderUrl(value) {
	if (!exampleUrls.has(value)) {
		exampleUrls.set(value, `https://example.com/example-url-${exampleUrls.size + 1}`);
	}
	return exampleUrls.get(value);
}
