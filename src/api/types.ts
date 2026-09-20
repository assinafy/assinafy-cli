/** Document lifecycle states emitted by the API. */
export type DocumentStatus =
	| 'uploading'
	| 'uploaded'
	| 'metadata_processing'
	| 'metadata_ready'
	| 'pending_signature'
	| 'expired'
	| 'certificating'
	| 'certificated'
	| 'rejected_by_signer'
	| 'rejected_by_user'
	| 'failed';

/** Artifact names available for document download. */
export type DocumentArtifactName =
	| 'original'
	| 'certificated'
	| 'certificate-page'
	| 'pades'
	| 'bundle';

/** Assignment methods supported by the API. */
export type AssignmentMethod = 'virtual' | 'collect';

/** Verification methods accepted by assignment signer entries. */
export type AssignmentVerificationMethod =
	| 'Email'
	| 'Whatsapp'
	| 'DigitalCertificate'
	| (string & {});

/** Notification methods accepted by assignment signer entries. */
export type AssignmentNotificationMethod = 'Email' | 'Whatsapp' | (string & {});

/** OAuth provider currently accepted by the Assinafy authentication API. */
export type SocialLoginProvider = 'google';

/** Minimal logger contract (compatible with console, pino, winston, etc.). */
export interface Logger {
	debug: (message: string, context?: Record<string, unknown>) => void;
	info: (message: string, context?: Record<string, unknown>) => void;
	warn: (message: string, context?: Record<string, unknown>) => void;
	error: (message: string, context?: Record<string, unknown>) => void;
}

/** Client configuration options. */
export interface AssinafyClientOptions {
	/** Assinafy API key. Preferred authentication method (sends `X-Api-Key` header). */
	apiKey?: string;
	/**
	 * OAuth access token or user JWT. Sends `Authorization: Bearer <token>`.
	 * `apiKey` takes precedence when both options are supplied.
	 */
	token?: string;
	/**
	 * Build a client without credentials for public, OAuth bootstrap, or signer-code calls.
	 */
	allowUnauthenticated?: boolean;
	/** Default account (workspace) ID applied to account-scoped endpoints. */
	accountId?: string;
	/** Override the API base URL. Defaults to https://api.assinafy.com.br/v1. */
	baseUrl?: string;
	/**
	 * Allow a plaintext `http://` base URL. Restricted to loopback hosts
	 * (`localhost`, `127.0.0.0/8`, `[::1]`) so the API key can never leave the
	 * machine in cleartext; any other host is rejected even with this enabled.
	 */
	allowInsecureHttp?: boolean;
	/**
	 * Experimental secret for {@link WebhookVerifier}. Assinafy does not publish
	 * a webhook-signature contract; do not rely on it without provider confirmation.
	 */
	webhookSecret?: string;
	/** Request timeout in milliseconds. Defaults to 30_000. */
	timeout?: number;
	/** Optional logger. Defaults to a no-op logger. */
	logger?: Logger;
}

/**
 * Payload for creating a signer.
 *
 * The official API requires only `full_name`; email and WhatsApp are optional
 * delivery channels.
 */
export interface ICreateSignerPayload {
	full_name: string;
	email?: string;
	whatsapp_phone_number?: string;
	/** PHP SDK compatibility alias for `whatsapp_phone_number`. */
	phone?: string;
	/** Compatibility extension for a Brazilian CPF; non-digits are stripped. */
	cpf?: string;
	/** Compatibility extension for integration-defined signer metadata. */
	metadata?: Record<string, unknown>;
}

/** Payload for updating a signer. */
export interface IUpdateSignerPayload {
	full_name?: string;
	email?: string;
	whatsapp_phone_number?: string;
	/** PHP SDK compatibility alias for `whatsapp_phone_number`. */
	phone?: string;
	/** CPF/CNPJ. Non-digits are stripped and sent as the official `government_id` field. */
	government_id?: string;
	/** Backwards-compatible alias for `government_id`. */
	cpf?: string;
}

/** Signer object as returned by the API. */
export interface ISigner {
	resource?: string;
	id: string;
	full_name: string;
	email: string | null;
	whatsapp_phone_number?: string | null;
	government_id?: string | null;
	cpf?: string | null;
	has_accepted_terms?: boolean;
	/** Only returned by `GET /signers/self`. */
	has_signature?: boolean;
	/** Only returned by `GET /signers/self`. */
	has_initial?: boolean;
	metadata?: Record<string, unknown>;
}

/** Signer profile returned by `GET /signers/self`. */
export interface ISignerSelf extends ISigner {
	has_signature: boolean;
	has_initial: boolean;
	is_signature_reusable: boolean;
}

/** Signer data returned after accepting the platform terms. */
export interface ISignerTermsAcceptance {
	full_name: string;
	email: string | null;
	has_accepted_terms: boolean;
}

export type ICreateSignerResponse = ISigner;

/** Pagination metadata extracted from `X-Pagination-*` response headers. */
export interface PaginationMeta {
	current_page?: number;
	last_page?: number;
	per_page?: number;
	total?: number;
}

/** Shape returned by every paginated list call in the SDK. */
export interface PaginatedResult<T> {
	data: T[];
	meta?: PaginationMeta;
}

/** Direct status body used by successful API operations without a `data` member. */
export interface IStatusResponse {
	status: number;
	message: string;
}

/** Unwrapped `data: []` returned by successful operations without result data. */
export type IEmptyResult = unknown[];

/** @deprecated use {@link PaginatedResult} — retained for existing type imports. */
export type IPaginatedResponse<T> = PaginatedResult<T>;

export type ISignerListResponse = PaginatedResult<ISigner>;

/** Signer reference accepted by the assignment endpoints. */
export type SignerReference =
	| string
	| {
			id?: string;
			signer_id?: string;
			verification_method?: AssignmentVerificationMethod;
			/** Production defaults an empty array to Email; it does not disable invitations. */
			notification_methods?: AssignmentNotificationMethod[];
			/** Integer signing-order value forwarded to the assignment API. */
			step?: number;
	  };

/** Payload for creating an assignment. */
export interface ICreateAssignmentPayload {
	method?: AssignmentMethod;
	/**
	 * List of signers. Each entry may be a signer id string, or an object with
	 * `id` / `signer_id`. For cost estimation, entries may omit the ID and
	 * specify only `verification_method` / `notification_methods`.
	 *
	 * The SDK normalises them to the docs-sanctioned `signers: [{ ... }]`
	 * shape before sending.
	 */
	signers?: SignerReference[];
	/** Legacy field still accepted by the API docs and used by the PHP SDK. */
	signer_ids?: string[];
	/** Camel-case legacy alias used by the quick-start docs. */
	signerIds?: string[];
	message?: string;
	expires_at?: string;
	copy_receivers?: string[];
	/** Field placement entries. Required when `method` is `collect`. */
	entries?: ICollectAssignmentEntry[];
}

/**
 * A field placement rectangle on a document page. Geometry values are pixels
 * in Assinafy's 150-DPI page image, measured from the upper-left corner.
 */
export interface IDisplaySettings {
	left: number;
	top: number;
	width: number;
	height: number;
	fontSize: number;
	fontFamily?: string;
	backgroundColor?: string;
}

/** One page's field placements, used by `collect`-method assignments. */
export interface ICollectAssignmentEntry {
	page_id: string;
	fields: Array<{
		signer_id: string;
		field_id: string;
		display_settings?: IDisplaySettings;
	}>;
}

/** Direct signing URL generated for one signer (inside `assignment.signing_urls`). */
export interface ISigningUrl {
	signer_id: string;
	url: string;
}

/**
 * One tracked notification-delivery record, returned inside
 * `assignment.signers[].notification_history` (account-owner contexts only).
 */
export interface IAssignmentSignerNotification {
	event: string;
	status: string;
	error_code?: string | null;
	error_message?: string | null;
	sent_at?: string | null;
	failed_at?: string | null;
}

/**
 * Signer as embedded inside an assignment. Extends the base {@link ISigner}
 * with the per-assignment verification / notification / ordering fields the
 * API returns. `completed` and `notification_history` are only present in
 * account-owner contexts.
 */
export interface IAssignmentSigner extends ISigner {
	verification_method?: AssignmentVerificationMethod | null;
	notification_methods?: AssignmentNotificationMethod[] | null;
	step?: number | null;
	notified?: boolean | null;
	completed?: boolean | null;
	notification_history?: IAssignmentSignerNotification[];
}

/**
 * One item (field placement instance) inside an assignment. `signer` and
 * `field` are embedded objects whose exact shape varies by context (the API's
 * own spec leaves them generic); `display_settings` is populated for
 * `collect`-method items and an empty array for `virtual`/legacy ones.
 */
export interface IAssignmentItem {
	id: string;
	page: { id: string; number: number; height: number; width: number; download_url: string } | null;
	signer: Partial<ISigner> & Record<string, unknown>;
	field: Partial<IFieldDefinition> & Record<string, unknown>;
	display_settings: IDisplaySettings | unknown[] | null;
	value: string | null;
	completed: boolean;
}

/** Signer summary entry inside `assignment.summary.signers` (account-owner contexts). */
export interface IAssignmentSummarySigner extends ISigner {
	completed: boolean;
}

/** Assignment object as returned by the API. */
export interface IAssignment {
	/** Resource type (`assignment`); present in single-resource responses. */
	resource?: string;
	id: string;
	sender_email?: string;
	/** `virtual` or `collect`. Documented as `null` for some `collect` responses. */
	method: AssignmentMethod | null;
	/** ISO 8601 timestamp, or `null` when the assignment does not expire. */
	expires_at?: string | null;
	expiration?: string;
	message?: string | null;
	signers: IAssignmentSigner[];
	/** Request payloads use signer IDs; responses may expand them to objects. */
	copy_receivers?: Array<string | Record<string, unknown>>;
	items?: IAssignmentItem[];
	summary?: {
		signer_count: number;
		completed_count: number;
		signers: IAssignmentSummarySigner[];
	};
	signing_urls?: ISigningUrl[];
}

export type ICreateAssignmentResponse = IAssignment;

export interface IResendEmailResponse {
	is_sent?: boolean;
	document_id?: string;
	signer_id?: string;
}

/** One line item in a cost-estimation `breakdown`. */
export interface IEstimateCostBreakdownItem {
	code: string;
	name: string;
	cost: number;
	quantity: number;
	unit_cost: number;
}

/**
 * Cost-estimation response shared by the assignment `estimate-cost` and the
 * template `documents/estimate-cost` endpoints (identical shape per the docs).
 */
export interface IEstimateCostResponse {
	documents: number;
	credits: number;
	needs_extra_document: boolean;
	extra_document_cost: number;
	total_credits: number;
	breakdown: IEstimateCostBreakdownItem[];
	document_balance: number;
	credit_balance: number;
	has_sufficient_resources: boolean;
	blocking_reason: 'PendingPayment' | 'InsufficientDocuments' | 'InsufficientCredits' | null;
	message: string | null;
}

/** Cost-estimation response for resending a single signer notification. */
export type IResendCostEstimate =
	| IEstimateCostResponse
	| {
			total: number;
			breakdown: Pick<IEstimateCostBreakdownItem, 'code' | 'name' | 'cost'>[];
			credit_balance: number;
			has_sufficient_credits: boolean;
	  };

/** Webhook payload envelope. */
export interface IWebhookPayload {
	id?: number;
	event?: string;
	type?: string;
	message?: string | null;
	payload?: Record<string, unknown> | null;
	origin?: Record<string, unknown> | null;
	subject?: Record<string, unknown>;
	object?: Record<string, unknown>;
	account_id?: string;
	data?: {
		document_uuid?: string;
		document_id?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

/** Known webhook event names. */
export type WebhookEventType =
	| 'document_uploaded'
	| 'document_metadata_ready'
	| 'document_prepared'
	| 'assignment_created'
	| 'document_ready'
	| 'signature_requested'
	| 'signer_created'
	| 'signer_email_verified'
	| 'signer_whatsapp_verified'
	| 'signer_data_confirmed'
	| 'signer_viewed_document'
	| 'signer_signed_document'
	| 'signer_rejected_document'
	| 'user_rejected_document'
	| 'document_processing_failed'
	| 'template_created'
	| 'template_processed'
	| 'template_processing_failed';

/** Rendered document-page metadata returned by document and template endpoints. */
export interface IDocumentPage {
	id: string;
	number: number;
	height: number;
	width: number;
	download_url: string;
}

/** Artifact URLs embedded in document responses. */
export interface IDocumentArtifacts {
	original: string;
	certificated?: string;
	'certificate-page'?: string;
	pades?: string;
	bundle?: string;
	thumbnail?: string;
}

/**
 * Document listing item (paginated).
 *
 * The list endpoint auto-expands `assignment` and `pages`, so live list items
 * carry the full document shape — `artifacts`, `pages`, `assignment`,
 * `signing_url`, `decline_reason` and `declined_by` are all present (verified
 * against the sandbox). They are optional here because the exact set can vary
 * by document status.
 */
export interface IDocumentListItem {
	resource?: string;
	id: string;
	name: string;
	status: DocumentStatus;
	account_id?: string;
	template_id?: string | null;
	/** Tags attached to the document (inline `{ id, name, color }` shape). */
	tags?: IInlineTag[];
	/** Downloadable artifact URLs (`original` always present once processed). */
	artifacts?: IDocumentArtifacts;
	/** Rendered page metadata (auto-expanded by the list endpoint). */
	pages?: IDocumentPage[];
	/** Embedded assignment (auto-expanded); `null` before signatures are requested. */
	assignment?: IAssignment | null;
	/** Direct signing URL when an assignment is active. */
	signing_url?: string | null;
	decline_reason?: string | null;
	declined_by?: ISigner | string | null;
	created_at: string;
	updated_at?: string;
	is_closed?: boolean;
}

export type IDocumentListResponse = PaginatedResult<IDocumentListItem>;

/** Query parameters accepted by `documents.list`. */
export interface IDocumentListParams extends IPaginationParams {
	/** Filter by document status, e.g. `pending_signature`. */
	status?: DocumentStatus | string;
	/** Filter by signature method (`virtual` or `collect`). */
	method?: AssignmentMethod;
	/** Comma-separated list of tag IDs (AND semantics). */
	tags?: string;
	search?: string;
	sort?: 'name' | '-name' | 'updated_at' | '-updated_at';
}

/** Query parameters accepted by the lightweight document search endpoint. */
export interface IDocumentSearchParams extends IPaginationParams {
	status?: DocumentStatus | string;
	search?: string;
	/** Live-verified extension; absent from the published OpenAPI. */
	sort?: 'name' | '-name' | 'updated_at' | '-updated_at';
}

/** Document upload response. */
export interface IDocumentUploadResponse {
	resource?: string;
	id: string;
	account_id: string;
	template_id: string | null;
	name: string;
	status: DocumentStatus;
	/** Absent immediately after upload; present once a signature request is active. */
	assignment?: IAssignment | null;
	/** Direct signing URL; present once the document has been processed. */
	signing_url?: string | null;
	artifacts: IDocumentArtifacts;
	pages: IDocumentPage[];
	/** Tags attached to the document (inline `{ id, name, color }` shape). */
	tags?: IInlineTag[];
	created_at: string;
	updated_at: string;
	is_closed: boolean;
	decline_reason: string | null;
	declined_by: ISigner | null;
}

/** Detailed document response. */
export interface IDocumentDetailsResponse {
	resource?: string;
	id: string;
	account_id: string;
	template_id?: string | null;
	name: string;
	status: DocumentStatus;
	assignment: IAssignment | null;
	download_url?: string;
	download_final_url?: string;
	signing_url?: string;
	artifacts?: IDocumentArtifacts;
	/** Omitted by the signer-side `GET /signers/{id}/document` endpoint. */
	pages?: IDocumentPage[];
	/** Tags attached to the document (inline `{ id, name, color }` shape). */
	tags?: IInlineTag[];
	created_at: string;
	updated_at: string;
	is_closed: boolean;
	decline_reason?: string | null;
	declined_by?: ISigner | null;
	activities?: Array<IDocumentActivity>;
}

export interface IDocumentActivity {
	id: number;
	event: string;
	message: string;
	/** Event-specific payload snapshot. Object for most events, occasionally `[]`. */
	payload?: Record<string, unknown> | unknown[];
	/** Request origin (`ip` / `user-agent`) when available; `null` for system events. */
	origin: { ip?: string; 'user-agent'?: string } | string | null;
	created_at: string;
}

/** Progress summary returned by `documents.getSigningProgress`. */
export interface ISigningProgress {
	signed: number;
	total: number;
	percentage: number;
	pending: number;
}

/** Pagination keys shared by current list endpoints. */
export interface IPaginationParams {
	page?: number;
	per_page?: number;
	'per-page'?: number;
}

/**
 * @deprecated Use the endpoint-specific list parameter type. Retained for
 * source compatibility with existing integrations.
 */
export interface IListParams extends IPaginationParams {
	search?: string;
	sort?: string;
	[key: string]: string | number | boolean | undefined;
}

/** Live-verified assignment list extension; absent from the published OpenAPI. */
export interface IAssignmentListParams extends IPaginationParams {
	sort?: 'created_at' | '-created_at';
}

/** Published template filters plus a live-verified name sort extension. */
export interface ITemplateListParams extends IPaginationParams {
	search?: string;
	sort?: 'name' | '-name';
}

/** Published signer filters plus a live-verified full-name sort extension. */
export interface ISignerListParams extends IPaginationParams {
	search?: string;
	sort?: 'full_name' | '-full_name';
}

/** Signer-side document list compatibility filters. */
export interface ISignerDocumentListParams extends IPaginationParams {
	search?: string;
	sort?: string;
}

/** Workspace creation payload. */
export interface ICreateWorkspacePayload {
	name: string;
	notification_sender_type?: NotificationSenderType;
	/** Undocumented compatibility field retained until sandbox support is disproved. */
	primary_color?: string;
	/** Undocumented compatibility field retained until sandbox support is disproved. */
	secondary_color?: string;
}

export interface IUpdateWorkspacePayload {
	name?: string;
	notification_sender_type?: NotificationSenderType;
	/** Undocumented compatibility field retained until sandbox support is disproved. */
	primary_color?: string | null;
	/** Undocumented compatibility field retained until sandbox support is disproved. */
	secondary_color?: string | null;
}

export interface IWorkspaceResponse {
	resource?: string;
	id: string;
	name: string;
	primary_color?: string | null;
	secondary_color?: string | null;
	notification_sender_type?: NotificationSenderType;
	roles?: string[];
	is_delete_allowed?: boolean;
	created_at: string;
}

export interface IWorkspaceListItem extends IWorkspaceResponse {
	is_delete_allowed: boolean;
	roles: string[];
}

export type IWorkspaceListResponse = PaginatedResult<IWorkspaceListItem>;

export type NotificationSenderType = 'User' | 'Account';

/** Branding details returned by `GET /accounts/{accountId}/theme`. */
export interface IAccountTheme {
	account_name: string;
	primary_color: string;
	secondary_color: string | null;
	logo: string | null;
}

/** Query parameters shared by account and user document statistics. */
export interface IDocumentStatsParams {
	granularity?: 'monthly' | 'daily';
	/** Required in `YYYY-MM` form when `granularity` is `daily`. */
	month?: string;
}

/** One period in an account/user document-funnel statistics response. */
export interface IDocumentStatsRow {
	period: string;
	documents_uploaded: number;
	documents_sent: number;
	signature_requests: number;
	/** Requests notified by email; multi-channel requests count in each notification channel. */
	signature_requests_notification_email: number;
	/** Requests notified by WhatsApp; multi-channel requests count in each notification channel. */
	signature_requests_notification_whatsapp: number;
	/** Requests created without a notification. */
	signature_requests_notification_bypass: number;
	/** Requests verified with an email token. */
	signature_requests_verification_email: number;
	/** Requests verified with a WhatsApp token. */
	signature_requests_verification_whatsapp: number;
	/** Requests signed without token verification. */
	signature_requests_verification_bypass: number;
	/** Requests signed with the signer's ICP-Brasil digital certificate. */
	signature_requests_verification_digital_certificate: number;
	signature_requests_viewed: number;
	signature_requests_completed: number;
	documents_certified: number;
}

/** Options for uploading a workspace logo. */
export interface IUploadAccountLogoOptions {
	fileName?: string;
	contentType?: string;
}

/** Webhook subscription payload. */
export interface IWebhookRegisterPayload {
	url: string;
	email: string;
	events?: WebhookEventType[] | string[];
	is_active?: boolean;
}

export interface IWebhookSubscription {
	id?: string;
	/** Documented as `string|null` — `null` when no endpoint URL is configured. */
	url: string | null;
	/** Documented as `string|null` — `null` when no contact email is configured. */
	email: string | null;
	events: string[];
	is_active: boolean;
	created_at?: string | null;
	updated_at?: string | null;
}

export interface IWebhookEventTypeInfo {
	id: WebhookEventType | string;
	description: string;
}

export interface IWebhookDispatch {
	resource?: string;
	id: string;
	event: WebhookEventType | string;
	activity_id: number;
	endpoint: string | null;
	payload: IWebhookPayload | Record<string, unknown> | null;
	delivered: boolean;
	http_status: number | null;
	response_body: string | null;
	error: string | null;
	/** ISO 8601 timestamp (verified against the sandbox — not a unix epoch number). */
	created_at: string;
	/** ISO 8601 timestamp (verified against the sandbox — not a unix epoch number). */
	updated_at?: string;
}

export interface IWebhookDispatchListParams extends IPaginationParams {
	event?: WebhookEventType | string;
	delivered?: boolean | 'true' | 'false';
	from?: number;
	to?: number;
	/** Live-verified extension; absent from the published OpenAPI. */
	sort?: 'created_at' | '-created_at';
}

/** Shape of the high-level `uploadAndRequestSignatures` helper result. */
export interface IUploadAndRequestSignaturesResult {
	document: IDocumentUploadResponse;
	assignment: IAssignment;
	signer_ids: string[];
}

/** Input for a signer in `uploadAndRequestSignatures`. */
export interface IUploadAndRequestSignaturesSigner {
	name: string;
	email?: string;
	whatsapp_phone_number?: string;
	/** PHP SDK compatibility alias for `whatsapp_phone_number`. */
	phone?: string;
	/** Compatibility extension for a Brazilian CPF; non-digits are stripped. */
	cpf?: string;
	/** Compatibility extension for integration-defined signer metadata. */
	metadata?: Record<string, unknown>;
	verification_method?: AssignmentVerificationMethod;
	notification_methods?: AssignmentNotificationMethod[];
	/** Integer signing-order value forwarded to the assignment signer reference. */
	step?: number;
}

/** Template role definition. */
export interface ITemplateRole {
	id: string;
	name: string;
	assignment_type?: string;
	created_at?: string;
	updated_at?: string;
	[key: string]: unknown;
}

/** One template field placement returned inside a template page. */
export interface ITemplateField {
	id: string;
	field_id: string;
	role_id: string;
	label: string;
	display_settings: IDisplaySettings | unknown[] | null;
	created_at: string;
	updated_at: string;
}

/** One rendered page and its editor/signer field placements. */
export interface ITemplatePage extends IDocumentPage {
	fields: ITemplateField[];
}

/** Template list item (paginated). */
export interface ITemplateListItem {
	resource?: string;
	id: string;
	name: string;
	document_name?: string | null;
	message?: string | null;
	status: string;
	account_id?: string;
	pages?: ITemplatePage[];
	roles?: ITemplateRole[];
	/** Tags attached to the template itself (inline `{ id, name }` shape). */
	tags?: IInlineTag[];
	/** Tags auto-applied to documents created from this template. */
	default_document_tags?: IInlineTag[];
	created_at: string;
	updated_at?: string;
}

export type ITemplateListResponse = PaginatedResult<ITemplateListItem>;

/** Full template details, including any platform-specific extension fields. */
export interface ITemplateDetailsResponse extends ITemplateListItem {
	[key: string]: unknown;
}

/**
 * Signer assignment for creating a document from a template. `id` is required
 * here; for cost estimation it is optional — see {@link ITemplateCostSigner}.
 */
export interface ITemplateSigner {
	role_id: string;
	id: string;
	verification_method?: AssignmentVerificationMethod;
	notification_methods?: AssignmentNotificationMethod[];
	/**
	 * Positive signing order. If used for any role, every role needs a step and
	 * the distinct values must form a contiguous sequence starting at 1.
	 */
	step?: number;
}

/** Signer entry accepted by the template cost-estimation endpoint. */
export interface ITemplateCostSigner {
	role_id: string;
	verification_method?: AssignmentVerificationMethod;
	notification_methods?: AssignmentNotificationMethod[];
	/** Compatibility extension retained for integrations that already send a signer ID. */
	id?: string;
	/** Compatibility extension retained for integrations that already send a signing step. */
	step?: number;
}

/** One editor field value baked into a generated document. */
export interface ITemplateEditorField {
	field_id: string;
	value: string;
}

/** Options for creating a document from a template. */
export interface ICreateDocumentFromTemplateOptions {
	name?: string;
	message?: string;
	expires_at?: string;
	editor_fields?: ITemplateEditorField[];
	/**
	 * Tag names to attach to the new document. Names that don't exist yet are
	 * auto-created; the template's default-document-tags are always merged in.
	 */
	tags?: string[];
}

/**
 * Item returned by `GET /documents/statuses`.
 *
 * The API uses `code` (the status name); we mirror that field. `description`
 * is documented in the table but is not currently present in the JSON payload.
 */
export interface IDocumentStatusInfo {
	code: DocumentStatus | string;
	deletable: boolean;
	description?: string;
}

/**
 * Response from `GET /documents/{signatureHash}/verify` (live-verified against
 * the sandbox). Always a `200`: an unknown/unsigned hash comes back with
 * `is_valid: false`, every other field `null` (except `hash`/`verified_at`),
 * and `message` explaining why.
 */
export interface IDocumentVerifyResponse {
	hash: string;
	id: string | null;
	status: DocumentStatus | string | null;
	page_count: string | null;
	signer_count: string | null;
	completed_count: number | null;
	completed_at: string | null;
	verified_at: string;
	is_valid: boolean;
	/** Reason when not valid; empty string on success. */
	message: string;
}

/** Item returned by `GET /public/documents/{id}`. */
export interface IPublicDocumentInfo {
	resource?: string;
	id: string;
	account_id: string;
	template_id: string | null;
	name: string;
	status: DocumentStatus | string;
	artifacts: IDocumentArtifacts;
	is_closed: boolean;
	signing_url: string | null;
	decline_reason: string | null;
	declined_by: ISigner | null;
	tags: IInlineTag[];
	assignment: IAssignment | null;
	pages: IDocumentPage[];
	created_at: string;
	updated_at: string;
	/** Live-compatible fields returned by older sandbox deployments. */
	page_count?: string | number;
	created_by?: string;
}

/** Channel accepted by the `send-token` endpoint. */
export type SendTokenChannel = 'email' | 'whatsapp' | (string & {});

/**
 * Response from `PUT /public/documents/{id}/send-token`.
 *
 * The published body is `{ email }`; the live legacy form may echo the
 * alternate `recipient` + `channel` fields that the SDK also supports.
 */
export interface ISendTokenResponse {
	/** Present for the published `{ email }` request form. */
	status?: number;
	/** Present for the published `{ email }` request form. */
	message?: string;
	/** Present for the live-compatible `{ recipient, channel }` request form. */
	document?: IPublicDocumentInfo;
	/** Present for the live-compatible `{ recipient, channel }` request form. */
	channel?: SendTokenChannel;
	/** Present for the live-compatible `{ recipient, channel }` request form. */
	recipient?: string;
	[key: string]: unknown;
}

/** Authentication: login response (also returned by social login). */
export interface IAuthUser {
	id: string;
	name: string;
	email: string;
	telephone?: string | null;
	government_id?: string | null;
	is_email_verified?: boolean;
	has_accepted_terms?: boolean;
	created_at?: string;
	to_be_deleted_at?: string | null;
}

export interface IAuthAccount {
	id: string;
	name: string;
	roles: string[];
	is_delete_allowed: boolean;
	created_at: string;
}

export interface ILoginResponse {
	access_token: string;
	user: IAuthUser;
	accounts: IAuthAccount[];
}

/**
 * `GET /users/self` is documented as a direct user, while the sandbox has also
 * returned the login-style `{ user, accounts }` object. Preserve either shape.
 */
export type IUserSelfResponse = IAuthUser | { user: IAuthUser; accounts: IAuthAccount[] };

export const NOTIFICATION_PREFERENCE_CODES = [
	'DocumentCompleted',
	'SignerDeclined',
	'DocumentCancelled',
	'DocumentAboutToExpire',
	'DocumentExpired',
	'DocumentExpirationReset',
	'DocumentProcessingFailed',
	'TemplateProcessingFailed',
	'SignerWhatsappFailed',
] as const;

export type NotificationPreferenceCode = (typeof NOTIFICATION_PREFERENCE_CODES)[number];
export type INotificationPreferences = Record<NotificationPreferenceCode, boolean>;
export type IUpdateNotificationPreferencesPayload = Partial<INotificationPreferences>;

/** Authentication: API key payload returned by `POST /users/api-keys`. */
export interface IApiKeyResponse {
	api_key: string | null;
}

/** Authentication: masked API key returned by `GET /users/api-keys` (or null when never generated). */
export type IMaskedApiKeyResponse = IApiKeyResponse | null;

/** Field definition object. */
export interface IFieldDefinition {
	resource?: string;
	id: string;
	name: string;
	type: string;
	regex?: string | null;
	is_pre_defined?: boolean;
	is_active: boolean;
	is_required?: boolean;
	is_standard?: boolean;
	is_read_only?: boolean;
	is_visible?: boolean;
}

/** Payload for creating a field definition. */
export interface ICreateFieldPayload {
	type: string;
	name: string;
	regex?: string;
	is_required?: boolean;
	/** Compatibility extension; not present in the published create schema. */
	is_active?: boolean;
}

/** Payload for updating a field definition. */
export interface IUpdateFieldPayload {
	/** Compatibility extension; not present in the published update schema. */
	type?: string;
	name?: string;
	regex?: string | null;
	/** Compatibility extension; not present in the published update schema. */
	is_required?: boolean;
	is_active?: boolean;
}

/** Field type description returned by `GET /field-types`. */
export interface IFieldType {
	type: string;
	name: string;
}

/** Single result returned by `POST /accounts/{id}/fields/{id}/validate`. */
export interface IFieldValidationResult {
	type?: string;
	field_id?: string;
	success: boolean;
	error_message: string;
}

/** Payload entry for `POST /accounts/{id}/fields/validate-multiple`. */
export interface IFieldValidateMultipleEntry {
	field_id: string;
	value: unknown;
}

/** Item returned by `GET /documents/{id}/assignments/{id}/whatsapp-notifications`. */
export interface IWhatsAppNotification {
	sent_at: number;
	header: string;
	body: string;
	buttons: Array<{ text: string; url?: string }>;
	phone_number: string;
	signer_id: string;
}

/** Body entry for the signer-side `POST /documents/{id}/assignments/{id}` sign endpoint. */
export interface ISignFieldEntry {
	itemId: string;
	fieldId: string;
	pageId: string;
	value: string;
}

/**
 * Workspace tag object. Tag names are unique per workspace (case-insensitive)
 * and `color` is an optional 6-char hex string (without the leading `#`).
 */
export interface ITag {
	resource?: string;
	id: string;
	name: string;
	color: string | null;
	created_at: string;
	updated_at: string;
}

/** Inline tag shape embedded inside documents/templates (`{ id, name, color? }`). */
export interface IInlineTag {
	id: string;
	name: string;
	color?: string | null;
}

/** Payload for `POST /accounts/{id}/tags`. */
export interface ICreateTagPayload {
	name: string;
	/** 6-char hex color, with or without a leading `#`. Omit/`null` for none. */
	color?: string | null;
}

/** Payload for `PUT /accounts/{id}/tags/{id}`. Omit a field to leave it unchanged. */
export interface IUpdateTagPayload {
	name?: string;
	/** Pass `null` to clear the color; omit to leave unchanged. */
	color?: string | null;
}

/** Confirmation returned after detaching a tag from a document. */
export interface IDetachTagResponse {
	detached: boolean;
}

/** Confirmation returned after deleting a tag. */
export interface IDeleteTagResponse {
	deleted: boolean;
}

/** RFC 9728 metadata served at the API origin (outside `/v1`). */
export interface IOAuthProtectedResource {
	resource: string;
	authorization_servers: string[];
	scopes_supported: string[];
	bearer_methods_supported: string[];
}

/** RFC 8414 metadata served by the authorization server. */
export interface IOAuthAuthorizationServer {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	revocation_endpoint?: string;
	userinfo_endpoint?: string;
	jwks_uri?: string;
	response_types_supported: string[];
	scopes_supported?: string[];
	grant_types_supported?: string[];
	code_challenge_methods_supported?: string[];
	token_endpoint_auth_methods_supported?: string[];
	authorization_response_iss_parameter_supported?: boolean;
	client_id_metadata_document_supported?: boolean;
	[key: string]: unknown;
}

/** Input to `oauth.authorize`; redirectUri must exactly match an HTTPS registered URI. */
export interface IOAuthAuthorizationOptions {
	clientId: string;
	redirectUri: string;
	scopes: string[];
}

/** Store server-side per user connection attempt; consume once when handling the callback. */
export interface IOAuthAuthorizationRequest {
	authorization_url: string;
	code_verifier: string;
	state: string;
	issuer: string;
	client_id: string;
	redirect_uri: string;
	resource: string;
	/** Generated when requesting openid. Validate it when verifying the ID token. */
	nonce?: string;
}

/** JSON request body for `POST /oauth/token`. PKCE is mandatory for all code exchanges. */
export type IOAuthTokenPayload = {
	client_id: string;
	/** Confidential applications only; public applications omit this field. */
	client_secret?: string;
	resource?: string;
} & (
	| { grant_type: 'authorization_code'; code: string; redirect_uri: string; code_verifier: string }
	| { grant_type: 'refresh_token'; refresh_token: string }
);

/** Flat OAuth response. Persist rotated tokens atomically before making further requests. */
export interface IOAuthTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	/** Present only with offline_access consent. Reusing the old token revokes the connection. */
	refresh_token?: string | null;
	/** Present only with openid. Must be verified by an OIDC library before use as identity. */
	id_token?: string | null;
}

/** JSON body for `POST /oauth/revoke`; failed client authentication still returns 401. */
export interface IOAuthRevokePayload {
	token: string;
	client_id: string;
	client_secret?: string;
	token_type_hint?: 'access_token' | 'refresh_token';
}

/** Flat `GET /oauth/userinfo` claims. Additional claims depend on consented scopes. */
export interface IOAuthUserInfo {
	sub: string;
	name?: string | null;
	email?: string | null;
	email_verified?: boolean | null;
}
