import { ValidationError } from '../errors.js';
import type { IEmbedOrigin, IEmbedSession, IEmbedSessionExchange, IEmptyResult } from '../types.js';
import { publicRequestConfig } from '../utils.js';
import { BaseResource } from './base.js';

/** Embedded signing origins and short-lived, single-use sessions. */
export class EmbedResource extends BaseResource {
	async listOrigins(accountId?: string): Promise<IEmbedOrigin[]> {
		const id = this.accountId(accountId);
		return this.call('Failed to list embed origins', () =>
			this.http.get(`/accounts/${id}/embed-origins`),
		);
	}
	async createOrigin(origin: string, accountId?: string): Promise<IEmbedOrigin> {
		const id = this.accountId(accountId);
		validateOrigin(origin);
		return this.call('Failed to add embed origin', () =>
			this.http.post(`/accounts/${id}/embed-origins`, { origin }),
		);
	}
	async updateOrigin(originId: string, origin: string, accountId?: string): Promise<IEmbedOrigin> {
		const id = this.accountId(accountId);
		const oid = this.requireId(originId, 'Origin ID');
		validateOrigin(origin);
		return this.call('Failed to update embed origin', () =>
			this.http.put(`/accounts/${id}/embed-origins/${oid}`, { origin }),
		);
	}
	async deleteOrigin(originId: string, accountId?: string): Promise<IEmptyResult> {
		const id = this.accountId(accountId);
		const oid = this.requireId(originId, 'Origin ID');
		return this.call('Failed to delete embed origin', () =>
			this.http.delete(`/accounts/${id}/embed-origins/${oid}`),
		);
	}
	/** Load the returned private URL in the iframe within five minutes. */
	async createSession(
		documentId: string,
		assignmentId: string,
		signerId: string,
	): Promise<IEmbedSession> {
		const did = this.requireId(documentId, 'Document ID');
		const aid = this.requireId(assignmentId, 'Assignment ID');
		const sid = this.requireId(signerId, 'Signer ID');
		return this.call('Failed to create embed session', () =>
			this.http.post(`/documents/${did}/assignments/${aid}/signers/${sid}/embed-sessions`),
		);
	}
	/** Used by Assinafy's embed page; consumes the token even on a 409. Never retry automatically. */
	async exchangeSession(token: string, parentOrigin?: string): Promise<IEmbedSessionExchange> {
		const value = this.requireId(token, 'Embed session token');
		if (parentOrigin !== undefined) validateOrigin(parentOrigin);
		return this.call('Failed to exchange embed session', () =>
			this.http.post(
				`/embed/sessions/${value}/exchange`,
				parentOrigin === undefined ? undefined : { parent_origin: parentOrigin },
				publicRequestConfig(),
			),
		);
	}
}

function validateOrigin(value: string): void {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new ValidationError('origin must be an absolute origin');
	}
	if (
		typeof value !== 'string' ||
		/[\s\\?#*]/.test(value) ||
		!/^[a-z][a-z\d+.-]*:\/\/[^/]+\/?$/i.test(value) ||
		url.username ||
		url.password ||
		url.pathname !== '/' ||
		(url.protocol !== 'https:' &&
			!(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
	) {
		throw new ValidationError(
			'origin must use HTTPS (HTTP only for localhost or 127.0.0.1) without path, credentials, query, fragment or wildcard',
		);
	}
}
