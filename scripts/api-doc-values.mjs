export const publicIdentifier = /^(?:document|assignment|signature|signer|user|template)_[a-z_]+$/;

export function isCredentialKey(key) {
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

export function isGovernmentKey(key) {
	return key === 'government_id' || key === 'tax_id' || key === 'cpf' || key === 'cnpj';
}

export function isIdentifierKey(key) {
	const normalizedKey = normalizeKey(key);
	return (
		normalizedKey === 'id' ||
		normalizedKey === 'hash' ||
		normalizedKey === 'copy_receivers' ||
		/_(?:id|ids)$/.test(normalizedKey)
	);
}

export function isUrlKey(key) {
	return (
		key === 'url' ||
		key.endsWith('_url') ||
		key === 'uri' ||
		key.endsWith('_uri') ||
		key === 'endpoint'
	);
}

export function normalizeKey(key) {
	return key
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.replaceAll('-', '_')
		.toLowerCase();
}
