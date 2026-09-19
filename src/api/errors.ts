/** Base class for all Assinafy SDK errors. */
export class AssinafyError extends Error {
	public readonly context: Record<string, unknown>;

	constructor(
		message: string,
		context: Record<string, unknown> = {},
		options?: { cause?: unknown },
	) {
		super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
		this.name = 'AssinafyError';
		this.context = context;
	}
}

/** Thrown when the API returns a non-success HTTP status. */
export class ApiError extends AssinafyError {
	public readonly statusCode: number;
	public readonly responseData: unknown;
	/** Bearer challenge, including insufficient_scope and resource_metadata when provided. */
	public readonly wwwAuthenticate: string | undefined;
	/** Server retry delay (seconds or HTTP date), when provided. */
	public readonly retryAfter: string | undefined;

	constructor(
		message: string,
		statusCode: number,
		responseData: unknown = null,
		options?: { cause?: unknown; wwwAuthenticate?: string; retryAfter?: string },
	) {
		super(message, { statusCode, responseData }, options);
		this.name = 'ApiError';
		this.statusCode = statusCode;
		this.responseData = responseData;
		this.wwwAuthenticate = options?.wwwAuthenticate;
		this.retryAfter = options?.retryAfter;
	}

	static fromResponse(
		statusCode: number,
		responseData: unknown,
		headers: Record<string, unknown> = {},
	): ApiError {
		if (Buffer.isBuffer(responseData) || responseData instanceof ArrayBuffer) {
			const text = (
				Buffer.isBuffer(responseData) ? responseData : Buffer.from(responseData)
			).toString('utf8');
			try {
				responseData = JSON.parse(text);
			} catch {
				responseData = text;
			}
		}
		const data = (responseData ?? {}) as Record<string, unknown>;
		const rawMessage = data.message;
		const rawError = data.error;
		const message =
			typeof rawMessage === 'string' && rawMessage.length > 0
				? rawMessage
				: typeof rawError === 'string'
					? rawError
					: 'API request failed';
		return new ApiError(message, statusCode, responseData, {
			wwwAuthenticate:
				typeof headers['www-authenticate'] === 'string' ? headers['www-authenticate'] : undefined,
			retryAfter: typeof headers['retry-after'] === 'string' ? headers['retry-after'] : undefined,
		});
	}
}

/** Thrown when client-side validation fails before the request is sent. */
export class ValidationError extends AssinafyError {
	public readonly errors: Record<string, unknown>;

	constructor(message = 'Validation failed', errors: Record<string, unknown> = {}) {
		super(message, { errors });
		this.name = 'ValidationError';
		this.errors = errors;
	}
}

/** Thrown when the HTTP transport itself fails (DNS, timeout, etc.). */
export class NetworkError extends AssinafyError {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, {}, options);
		this.name = 'NetworkError';
	}
}

/**
 * Thrown when a multi-step workflow helper fails *after* it has already created
 * billable resources.
 *
 * Without this, a failure part-way through
 * {@link AssinafyClient.uploadAndRequestSignatures} would leave an uploaded
 * document and created or reused signers in the workspace with no handle for the
 * caller to resume from or clean up. The original failure is preserved in
 * {@link Error.cause}.
 *
 * @example
 * ```ts
 * try {
 *   await client.uploadAndRequestSignatures({ source, signers });
 * } catch (err) {
 *   if (err instanceof PartialWorkflowError) {
 *     console.error({ documentId: err.documentId, signerIds: err.signerIds });
 *     // Inspect the document before resuming. Signers may already be in use elsewhere.
 *   }
 *   throw err;
 * }
 * ```
 */
export class PartialWorkflowError extends AssinafyError {
	/** The document that was uploaded before the failure, if any. */
	public readonly documentId: string | undefined;
	/** IDs of every signer created (or reused) before the failure. */
	public readonly signerIds: string[];

	constructor(
		message: string,
		created: { documentId?: string; signerIds?: string[] },
		options?: { cause?: unknown },
	) {
		const signerIds = created.signerIds ?? [];
		super(message, { documentId: created.documentId, signerIds }, options);
		this.name = 'PartialWorkflowError';
		this.documentId = created.documentId;
		this.signerIds = signerIds;
	}
}
