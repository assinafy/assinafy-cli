# TypeScript SDK reference

The Node.js SDK is published with the CLI and requires Node.js `>=22.12.0` (Node.js 24 LTS is recommended). Responses containing Assinafy's `{ status, message, data }` envelope resolve to `data`; documented delete responses therefore resolve to `IEmptyResult` (`unknown[]`). Operations whose response has no `data` preserve the direct `IStatusResponse` (`{ status, message }`) body. `sendToken` preserves either that published body or the live legacy `{ document, channel, recipient }` body.

The [API request/response reference](./api-reference.md) is the canonical source for every published HTTP payload and example. Complete TypeScript declarations are exported and packaged with `@assinafy/cli/api`.

## Install and import

```bash
npm install @assinafy/cli
```

ES modules:

```ts
import { AssinafyClient, ApiError } from '@assinafy/cli/api';

const client = new AssinafyClient({
  apiKey: process.env.ASSINAFY_API_KEY!,
  accountId: process.env.ASSINAFY_ACCOUNT_ID!,
});
```

CommonJS:

```js
const { AssinafyClient, ApiError } = require('@assinafy/cli/api');

const client = AssinafyClient.create(
  process.env.ASSINAFY_API_KEY,
  process.env.ASSINAFY_ACCOUNT_ID,
);
```

For the sandbox, add `baseUrl: 'https://sandbox.assinafy.com.br/v1'`. Create an unauthenticated client only for public or signer-access-code endpoints:

```ts
const publicClient = new AssinafyClient({ allowUnauthenticated: true });
```

## Client

`AssinafyClientOptions`:

| Field | Type | Behavior |
| --- | --- | --- |
| `apiKey` | `string` | Preferred credential; sent as `X-Api-Key`. |
| `token` | `string` | JWT fallback; sent as `Authorization: Bearer`. `apiKey` wins when both are set. |
| `accountId` | `string` | Default for account-scoped methods; most methods also accept an override. |
| `baseUrl` | `string` | HTTPS URL; defaults to `https://api.assinafy.com.br/v1`. Redirects are rejected. |
| `allowInsecureHttp` | `boolean` | Explicit opt-in for isolated local development only. |
| `timeout` | `number` | Request timeout in milliseconds; default `30_000`. |
| `logger` | `Logger` | Optional `debug`/`info`/`warn`/`error` functions; otherwise no-op. |
| `allowUnauthenticated` | `boolean` | Permit construction without `apiKey`/`token`; use only for public and signer-code flows. |
| `webhookSecret` | `string` | Used only by the experimental `webhookVerifier`; see [Webhook verification](#webhook-verification-experimental). |

| API | Result |
| --- | --- |
| `new AssinafyClient(options: AssinafyClientOptions)` | Client with `documents`, `signers`, `workspaces`, `assignments`, `webhooks`, `templates`, `tags`, `auth`, `fields`, `users`, `signerDocuments`, and `webhookVerifier`. |
| `AssinafyClient.create(apiKey, accountId, options?)` | Convenience constructor. |
| `AssinafyClient.fromConfig(config: ClientConfigInput)` | Accepts snake-case or camel-case configuration keys. |
| `client.uploadAndRequestSignatures(options)` | Uploads a PDF, optionally waits for processing, creates/reuses signers, and creates a virtual assignment; returns `IUploadAndRequestSignaturesResult`. |
| `client.getAxiosInstance()` | Underlying `AxiosInstance` for interceptors or endpoints not represented by the SDK. |

`uploadAndRequestSignatures` accepts:

```ts
{
  source: DocumentUploadSource;
  signers: Array<{
    name: string;
    email?: string;
    whatsapp_phone_number?: string;
    phone?: string;
    cpf?: string;
    metadata?: Record<string, unknown>;
    verification_method?: 'Email' | 'Whatsapp' | 'DigitalCertificate';
    notification_methods?: Array<'Email' | 'Whatsapp'>;
    step?: number;
  }>;
  message?: string;
  metadata?: Record<string, unknown>;
  waitForReady?: boolean;
  expiresAt?: string;
  copyReceivers?: string[];
  accountId?: string;
}
```

It resolves to `{ document: IDocumentUploadResponse; assignment: IAssignment; signer_ids: string[] }`. A phone-only signer defaults to WhatsApp verification and notification unless those controls are supplied explicitly. The workflow is not transactional: if a later step fails, previously created documents/signers remain available for caller-directed cleanup.

## Documents (`client.documents`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `upload(source, options?)` | [`POST /accounts/{accountId}/documents`](./api-reference.md#upload-and-create-document) | `IDocumentUploadResponse` |
| `list(params?, accountId?)` | [`GET /accounts/{accountId}/documents`](./api-reference.md#list-documents) | `IDocumentListResponse` |
| `search(params?, accountId?)` | [`GET /accounts/{accountId}/documents/search`](./api-reference.md#search-documents-lightweight) | `IDocumentListResponse` |
| `details(documentId)` | [`GET /documents/{documentId}`](./api-reference.md#get-document) | `IDocumentDetailsResponse` |
| `get(documentId)` | Same as `details` | `IDocumentDetailsResponse` |
| `rename(documentId, name)` | [`PATCH /documents/{documentId}`](./api-reference.md#rename-document) | `IDocumentDetailsResponse` |
| `waitUntilReady(documentId, { maxWaitMs?, pollIntervalMs? }?)` | Polls [Get document](./api-reference.md#get-document) | `IDocumentDetailsResponse`; rejects on terminal failure, permanent 4xx, or timeout |
| `download(documentId, artifactName?)` | [`GET /documents/{documentId}/download/{artifact}`](./api-reference.md#download-document-artifact) | `Buffer` |
| `thumbnail(documentId)` | [`GET /documents/{documentId}/thumbnail`](./api-reference.md#download-document-thumbnail) | JPEG `Buffer` |
| `downloadPage(documentId, pageId)` | [`GET /documents/{documentId}/pages/{pageId}/download`](./api-reference.md#download-document-page) | JPEG `Buffer` |
| `activities(documentId)` | [`GET /documents/{documentId}/activities`](./api-reference.md#list-document-activities) | `IDocumentActivity[]` |
| `delete(documentId)` | [`DELETE /documents/{documentId}`](./api-reference.md#delete-document) | `IEmptyResult` (`unknown[]`) |
| `listTags(documentId, accountId?)` | [`GET /accounts/{accountId}/documents/{documentId}/tags`](./api-reference.md#list-document-tags) | `ITag[]` |
| `replaceTags(documentId, tags, accountId?)` | [`PUT /accounts/{accountId}/documents/{documentId}/tags`](./api-reference.md#replace-document-tags) | `ITag[]` |
| `addTags(documentId, tags, accountId?)` | [`POST /accounts/{accountId}/documents/{documentId}/tags`](./api-reference.md#attach-document-tags) | `ITag[]` |
| `detachTag(documentId, tagId, accountId?)` | [`DELETE /accounts/{accountId}/documents/{documentId}/tags/{tagId}`](./api-reference.md#detach-document-tag) | `IDetachTagResponse` (`{ detached: boolean }`) |
| `createFromTemplate(templateId, signers, options?, accountId?)` | [`POST /accounts/{accountId}/templates/{templateId}/documents`](./api-reference.md#create-document-from-template) | `IDocumentDetailsResponse` |
| `estimateCostFromTemplate(templateId, signers, accountId?)` | [`POST /accounts/{accountId}/templates/{templateId}/documents/estimate-cost`](./api-reference.md#estimate-document-from-template-cost) | `IEstimateCostResponse` |
| `verify(hash)` | [`GET /documents/{signatureHash}/verify`](./api-reference.md#verify-a-signed-document) | `IDocumentVerifyResponse` |
| `statuses()` | [`GET /documents/statuses`](./api-reference.md#list-document-statuses) | `IDocumentStatusInfo[]` |
| `getPublic(documentId)` | [`GET /public/documents/{documentId}`](./api-reference.md#view-public-document) | `IPublicDocumentInfo` |
| `sendToken(documentId, { email })` or `sendToken(documentId, recipient, channel?)` | [`PUT /public/documents/{documentId}/send-token`](./api-reference.md#send-access-token-for-public-document) | `ISendTokenResponse` (`{ status; message }` or `{ document; channel; recipient }`) |
| `isFullySigned(documentId)` | SDK helper over `details` | `boolean` |
| `getSigningProgress(documentId)` | SDK helper over `details` | `{ signed; total; pending; percentage }` |

Upload input and options:

```ts
type DocumentUploadSource =
  | { filePath: string; fileName?: string }
  | { buffer: Buffer; fileName: string };

interface IDocumentUploadOptions {
  name?: string; // display name, independent of the physical .pdf file name
  metadata?: Record<string, unknown>;
  accountId?: string;
}
```

Uploads must be non-empty PDFs up to 25 MiB. `DocumentArtifactName` is `original | certificated | certificate-page | pades | bundle`; `bundle` is ZIP and the other document artifacts are PDF. Prefer the published `sendToken(documentId, { email })` form. The string overload sends the live-compatible legacy `{ recipient, channel }` body for email or WhatsApp integrations that still require it.

Document list params are `{ page?, per_page?, status?, method?, tags?, search?, sort? }`; search params omit `method`/`tags`. Supported sort values are `name`, `-name`, `updated_at`, and `-updated_at`.

Document responses expose typed `IDocumentArtifacts`, `IDocumentPage`, inline tags, assignment/signing state, decline state, and creation/update timestamps. `IPublicDocumentInfo` models the complete published public-document payload while retaining the older optional `page_count` and `created_by` fields.

## Assignments (`client.assignments`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `list(params?, accountId?)` | [`GET /assignments?accountId=…`](./api-reference.md#list-assignments) | `PaginatedResult<IAssignment>` |
| `create(documentId, payload)` | [`POST /documents/{documentId}/assignments`](./api-reference.md#create-assignment-request-signatures) | `IAssignment` |
| `estimateCost(documentId, payload)` | [`POST /documents/{documentId}/assignments/estimate-cost`](./api-reference.md#estimate-assignment-cost) | `IEstimateCostResponse` |
| `resetExpiration(documentId, assignmentId, expiresAt)` | [`PUT …/reset-expiration`](./api-reference.md#reset-assignment-expiration) | `IAssignment`; pass `null` to remove expiration |
| `resendNotification(documentId, assignmentId, signerId)` | [`PUT …/signers/{signerId}/resend`](./api-reference.md#resend-signature-request) | `IResendEmailResponse` |
| `estimateResendCost(documentId, assignmentId, signerId)` | [`POST …/estimate-resend-cost`](./api-reference.md#estimate-resend-cost) | `IResendCostEstimate` |
| `listWhatsAppNotifications(documentId, assignmentId)` | [`GET …/whatsapp-notifications`](./api-reference.md#list-whatsapp-notifications) | `IWhatsAppNotification[]` |

Assignment payload:

```ts
{
  method?: 'virtual' | 'collect';
  signers?: Array<string | {
    id?: string;
    signer_id?: string;
    verification_method?: 'Email' | 'Whatsapp' | 'DigitalCertificate';
    notification_methods?: Array<'Email' | 'Whatsapp'>;
    step?: number;
  }>;
  signer_ids?: string[]; // compatibility alias
  signerIds?: string[];  // compatibility alias
  message?: string;
  expires_at?: string;
  copy_receivers?: string[];
  entries?: ICollectAssignmentEntry[];
}
```

`buildAssignmentPayload(payload, options?)` is exported for callers that need the same normalization. `create` requires at least one signer; `estimateCost` permits zero signers for `collect`. Assignment list params are pagination plus the live-verified `sort?: 'created_at' | '-created_at'`; the runtime endpoint requires the SDK's `accountId` query even though the published parameter table omits it. The sandbox ignored an assignment `search` query, so the SDK does not expose it.

## Signers (`client.signers`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `create(payload, accountId?)` | [`POST /accounts/{accountId}/signers`](./api-reference.md#create-signer) | `ISigner` |
| `get(signerId, accountId?)` | [`GET /accounts/{accountId}/signers/{signerId}`](./api-reference.md#get-signer) | `ISigner` |
| `list(params?, accountId?)` | [`GET /accounts/{accountId}/signers`](./api-reference.md#list-signers) | `ISignerListResponse` |
| `update(signerId, payload, accountId?)` | [`PUT /accounts/{accountId}/signers/{signerId}`](./api-reference.md#update-signer) | `ISigner` |
| `delete(signerId, accountId?)` | [`DELETE /accounts/{accountId}/signers/{signerId}`](./api-reference.md#delete-signer) | `IEmptyResult` (`unknown[]`) |
| `findByEmail(email, accountId?)` | SDK helper over `list({ search: email })` | `ISigner | null` |

Create payload: `{ full_name: string; email?; whatsapp_phone_number?; phone?; cpf?; metadata? }`. Update payload: `{ full_name?; email?; whatsapp_phone_number?; phone?; government_id?; cpf? }`. `phone` and update-time `cpf` are compatibility aliases. Creation is idempotent by exact case-insensitive email when email is supplied; full-name-only signers are valid. List params support published `search` and live-verified `sort?: 'full_name' | '-full_name'`; ignored sort fields are rejected locally.

## Signer-side flows (`client.signerDocuments`)

These methods use the one-time `signer-access-code`, not the workspace API key.

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `getCurrent(signerId, accessCode)` | [`GET /signers/{signerId}/document`](./api-reference.md#get-signers-document) | `IDocumentDetailsResponse` |
| `list(signerId, accessCode, params?)` | [`GET /signers/{signerId}/documents`](./api-reference.md#list-signers-documents) | `IDocumentListResponse` |
| `search(signerId, search, accessCode)` | [`GET /signers/{signerId}/documents/search`](./api-reference.md#search-signers-documents) | `IDocumentListResponse` |
| `download(signerId, documentId, artifact, accessCode)` | [`GET /signers/{signerId}/documents/{documentId}/download/{artifact}`](./api-reference.md#download-signers-document-artifact) | `Buffer` |
| `signMultiple(documentIds, accessCode)` | [`PUT /signers/documents/sign-multiple`](./api-reference.md#sign-multiple-documents) | `unknown[]` |
| `declineMultiple(documentIds, reason, accessCode)` | [`PUT /signers/documents/decline-multiple`](./api-reference.md#decline-multiple-documents) | `unknown[]` |
| `self(accessCode)` | [`GET /signers/self`](./api-reference.md#get-current-signer) | `ISignerSelf` |
| `acceptTerms(accessCode)` | [`PUT /signers/accept-terms`](./api-reference.md#accept-terms-signer) | `IStatusResponse` |
| `verifyEmail({ signerAccessCode, verificationCode })` | [`POST /verify`](./api-reference.md#verify-signer-code-otp) | `IStatusResponse` |
| `confirmData(documentId, accessCode, payload)` | [`PUT /documents/{documentId}/signers/confirm-data`](./api-reference.md#confirm-signer-data) | `ISigner` |
| `uploadSignature(accessCode, image, options?)` | [`POST /signature`](./api-reference.md#upload-signature-image) | `IStatusResponse` |
| `downloadSignature(accessCode, imageType?)` | [`GET /signature/{type}`](./api-reference.md#download-signature-image) | `Buffer` |
| `getAssignment(accessCode, hasAcceptedTerms?)` | [`GET /sign`](./api-reference.md#view-document-to-sign) | `IDocumentDetailsResponse` |
| `sign(documentId, assignmentId, accessCode, entries)` | [`POST /documents/{documentId}/assignments/{assignmentId}`](./api-reference.md#sign-assignment-items) | `Record<string, unknown>` |
| `decline(documentId, assignmentId, accessCode, reason)` | [`PUT …/reject`](./api-reference.md#reject-decline-assignment) | `unknown[]` |

`confirmData` accepts `{ full_name?, email?, government_id?, whatsapp_phone_number?, has_accepted_terms? }`. `uploadSignature` accepts a non-empty image `Buffer` plus `{ imageType?: 'signature' | 'initial'; contentType?: string; reuse?: boolean }`. Each signing entry is `{ itemId, fieldId, pageId, value }`.

`download` first verifies the access code through `/signers/self` and confirms that it belongs to the requested signer. This SDK-side check mitigates a sandbox defect where the raw artifact route returned a document for an invalid access code; the upstream route must still be fixed before it can be treated as a secure trust boundary.

## Workspaces (`client.workspaces`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `create(payload)` | [`POST /accounts`](./api-reference.md#create-account) | `IWorkspaceResponse` |
| `list()` | [`GET /accounts`](./api-reference.md#list-my-accounts) | `IWorkspaceListResponse` |
| `get(accountId)` | [`GET /accounts/{accountId}`](./api-reference.md#get-account) | `IWorkspaceResponse` |
| `getTheme(accountId)` | [`GET /accounts/{accountId}/theme`](./api-reference.md#get-account-theme) | `IAccountTheme` |
| `downloadLogo(accountId)` | [`GET /accounts/{accountId}/logo`](./api-reference.md#download-account-logo) | image `Buffer` |
| `uploadLogo(accountId, logo, options?)` | [`POST /accounts/{accountId}/logo`](./api-reference.md#upload-account-logo) | `IStatusResponse` |
| `deleteLogo(accountId)` | [`DELETE /accounts/{accountId}/logo`](./api-reference.md#delete-account-logo) | `IStatusResponse` |
| `stats(accountId, params?)` | [`GET /accounts/{accountId}/stats`](./api-reference.md#account-document-kpis) | `IDocumentStatsRow[]` |
| `update(accountId, payload)` | [`PUT /accounts/{accountId}`](./api-reference.md#update-account) | `IWorkspaceResponse` |
| `delete(accountId, { force? }?)` | [`DELETE /accounts/{accountId}`](./api-reference.md#delete-account) | `IEmptyResult` (`unknown[]`) |

Create/update payloads use `name` and `notification_sender_type?: 'User' | 'Account'`; legacy color fields remain accepted for compatibility. List/detail responses include `resource`, `id`, `name`, nullable colors, `notification_sender_type`, roles, delete permission, and `created_at`. `IAccountTheme` is `{ account_name; primary_color; secondary_color: string | null; logo: string | null }`. Logo options are `{ fileName?, contentType? }`. Statistics params are `{ granularity?: 'monthly' | 'daily'; month?: 'YYYY-MM' }`; `month` is required for daily data.

## Users (`client.users`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `self()` | [`GET /users/self`](./api-reference.md#get-the-authenticated-user) | `IUserSelfResponse` |
| `stats(params?)` | [`GET /users/self/stats`](./api-reference.md#my-cross-account-document-kpis) | `IDocumentStatsRow[]` |
| `getNotificationPreferences()` | [`GET /users/self/notification-preferences`](./api-reference.md#get-my-notification-preferences) | `INotificationPreferences` |
| `updateNotificationPreferences(payload)` | [`PUT /users/self/notification-preferences`](./api-reference.md#update-my-notification-preferences) | `INotificationPreferences` |

`IUserSelfResponse` accepts the published user object and the sandbox-observed `{ user, accounts }` envelope. Preference payloads are a non-empty partial mapping of the exported `NOTIFICATION_PREFERENCE_CODES` to booleans. The production OpenAPI publishes these routes; a lagging sandbox deployment may return route-level 404s for statistics/preferences.

## Authentication (`client.auth`)

| SDK method | HTTP operation | Request / result |
| --- | --- | --- |
| `login(email, password)` | [`POST /login`](./api-reference.md#login) | `{ email, password }` → `ILoginResponse` |
| `socialLogin({ provider, token, has_accepted_terms })` | [`POST /authentication/social-login`](./api-reference.md#social-login) | Google token → `ILoginResponse` |
| `linkSocialLogin({ provider, token })` | [`POST /auth/link-social-login`](./api-reference.md#link-social-login) | Google token → `IStatusResponse` |
| `changePassword({ email, password, new_password })` | [`PUT /authentication/change-password`](./api-reference.md#change-password) | `{ email }` |
| `requestPasswordReset(email)` | [`PUT /authentication/request-password-reset`](./api-reference.md#request-password-reset) | `{ email }` |
| `resetPassword({ email, token?, new_password })` | [`PUT /authentication/reset-password`](./api-reference.md#reset-password) | `{ email }` |
| `createApiKey(password)` | [`POST /users/api-keys`](./api-reference.md#create-api-key) | `IApiKeyResponse` |
| `getApiKey()` | [`GET /users/api-keys`](./api-reference.md#get-api-key) | `IApiKeyResponse | null`; 404 means no key |
| `deleteApiKey()` | [`DELETE /users/api-keys`](./api-reference.md#delete-api-key) | `IEmptyResult` (`unknown[]`) |

Login/social/reset bootstrap calls can use an unauthenticated client. The published authenticated user endpoints permit either a bearer JWT or `X-Api-Key`; use the credential type appropriate to the account and endpoint policy.

## Fields (`client.fields`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `create(payload, accountId?)` | [`POST /accounts/{accountId}/fields`](./api-reference.md#create-field) | `IFieldDefinition` |
| `list(params?, accountId?)` | [`GET /accounts/{accountId}/fields`](./api-reference.md#list-fields) | `IFieldDefinition[]` |
| `get(fieldId, accountId?)` | [`GET /accounts/{accountId}/fields/{fieldId}`](./api-reference.md#get-field) | `IFieldDefinition` |
| `update(fieldId, payload, accountId?)` | [`PUT /accounts/{accountId}/fields/{fieldId}`](./api-reference.md#update-field) | `IFieldDefinition` |
| `delete(fieldId, accountId?)` | [`DELETE /accounts/{accountId}/fields/{fieldId}`](./api-reference.md#delete-field) | `IEmptyResult` (`unknown[]`) |
| `validate(fieldId, value, options?)` | [`POST …/fields/{fieldId}/validate`](./api-reference.md#validate-field-value) | `IFieldValidationResult` |
| `validateMultiple(entries, options?)` | [`POST …/fields/validate-multiple`](./api-reference.md#validate-multiple-field-values) | `IFieldValidationResult[]` |
| `listTypes()` | [`GET /field-types`](./api-reference.md#list-field-types) | `IFieldType[]` |

Create payload: `{ type: string; name: string; regex?; is_required?; is_active? }`. Update makes each field optional and allows `regex: null`. List params are `{ include_inactive?, include_standard? }`. Validation options are `{ signerAccessCode?, accountId? }`; multiple entries are `{ field_id, value }[]`. When a signer code is supplied, the SDK removes any configured owner API-key/bearer headers from that request.

## Tags (`client.tags`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `list({ search? }?, accountId?)` | [`GET /accounts/{accountId}/tags`](./api-reference.md#list-tags) | `ITag[]` |
| `create({ name, color? }, accountId?)` | [`POST /accounts/{accountId}/tags`](./api-reference.md#create-tag) | `ITag` |
| `update(tagId, { name?, color? }, accountId?)` | [`PUT /accounts/{accountId}/tags/{tagId}`](./api-reference.md#update-tag) | `ITag`; `color: null` clears it |
| `delete(tagId, { force?, accountId? }?)` | [`DELETE /accounts/{accountId}/tags/{tagId}`](./api-reference.md#delete-tag) | `IDeleteTagResponse` (`{ deleted: boolean }`) |

## Templates (`client.templates`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `list(params?, accountId?)` | [`GET /accounts/{accountId}/templates`](./api-reference.md#list-templates) | `ITemplateListResponse` |
| `get(templateId, accountId?)` | `GET /accounts/{accountId}/templates/{templateId}` | `ITemplateDetailsResponse` |
| `downloadPage(templateId, pageId, accountId?)` | `GET /accounts/{accountId}/templates/{templateId}/pages/{pageId}/download` | JPEG `Buffer` |

The last two compatibility routes are supported by the platform/official PHP SDK but are absent from the published OpenAPI document, so they have no generated payload section.

Template list params support pagination, published `search`, and live-verified `sort?: 'name' | '-name'`; ignored sort fields are rejected locally. `ITemplatePage` contains document page dimensions/URL plus typed `ITemplateField[]` entries (`id`, `field_id`, `role_id`, `label`, `display_settings`, and timestamps). Template document creation accepts `editor_fields?: Array<{ field_id: string; value: unknown }>`.

## Webhooks (`client.webhooks`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `register(payload, accountId?)` | [`PUT /accounts/{accountId}/webhooks/subscriptions`](./api-reference.md#update-webhook-subscription) | `IWebhookSubscription` |
| `get(accountId?)` | [`GET /accounts/{accountId}/webhooks/subscriptions`](./api-reference.md#get-webhook-subscription) | `IWebhookSubscription | null` |
| `inactivate(accountId?)` | [`PUT /accounts/{accountId}/webhooks/inactivate`](./api-reference.md#inactivate-webhook-subscription) | `IWebhookSubscription` |
| `listEventTypes()` | [`GET /webhooks/event-types`](./api-reference.md#list-webhook-event-types) | `IWebhookEventTypeInfo[]` |
| `listDispatches(params?, accountId?)` | [`GET /accounts/{accountId}/webhooks`](./api-reference.md#list-webhook-deliveries) | `PaginatedResult<IWebhookDispatch>` |
| `retryDispatch(dispatchId, accountId?)` | [`POST /accounts/{accountId}/webhooks/{dispatchId}/retry`](./api-reference.md#retry-webhook-delivery) | `IWebhookDispatch` |

Registration payload: `{ url: string; email: string; events?: string[]; is_active?: boolean }`. When `events` is omitted the SDK uses `document_ready`, `document_prepared`, `signer_signed_document`, `signer_rejected_document`, and `document_processing_failed`; pass `[]` deliberately for none. Dispatch filters extend pagination with `{ event?, delivered?, from?, to?, sort?: 'created_at' | '-created_at' }`; sort is a live-verified extension. The sandbox ignored dispatch `search`, so it is rejected locally. The API does not expose a delete-subscription operation; use `inactivate`.

## Responses, pagination, errors, and binary data

- JSON responses with `data` are unwrapped from the API envelope; direct status bodies remain `IStatusResponse`. Paginated calls resolve to `{ data: T[]; meta?: { current_page?, last_page?, per_page?, total? } }`; metadata comes from `X-Pagination-*` headers.
- Binary methods resolve to Node.js `Buffer`; the SDK is not a browser package. It never writes downloaded data to disk.
- `ValidationError` means local input validation failed before a request. `ApiError` exposes `statusCode` and `responseData`. `NetworkError` covers timeout/DNS/transport failures. All extend `AssinafyError`, which exposes `context` and preserves `cause` where available.
- `normalizeBaseUrl(url)` is exported and removes one trailing slash.

Exported error constructors/helpers are `new AssinafyError(message, context?, { cause? }?)`, `new ApiError(message, statusCode, responseData?, { cause? }?)`, `ApiError.fromResponse(statusCode, responseData)`, `new ValidationError(message?, errors?)`, and `new NetworkError(message, { cause? }?)`. Resource classes and all named request/response types are also exported for dependency injection and type annotations; normal applications should obtain resource instances from `AssinafyClient`.

```ts
try {
  await client.documents.get('document-id');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.statusCode, error.responseData);
  }
}
```

## Webhook verification (experimental)

| API | Result |
| --- | --- |
| `new WebhookVerifier(secret?, { algorithm?, encoding? }?)` | Compatibility verifier; defaults to `sha256` and `hex`. |
| `verify(rawBody, signature)` | `boolean`; HMAC comparison under the configured, assumed scheme. |
| `extractEvent(rawBody)` | Parsed `IWebhookPayload`, or `null` for invalid JSON/non-object data. |
| `getEventType(event)` | `event`/`type` string, or `null`. |
| `getEventData(event)` | First object found at `payload`, `data`, or `object`; otherwise `{}`. |

Assinafy's published API does **not** define a signature header, algorithm, digest encoding, timestamp, or replay-protection scheme. Therefore this helper is experimental and unverified; do not use it as a production trust boundary until Assinafy publishes the scheme or you validate every detail against real deliveries. Preserve the exact raw request bytes for any future verification.

## Contract boundaries

- Production OpenAPI currently publishes 89 operations. Some sandbox deployments lag it; account/user statistics and user notification-preference routes may return route-level 404s even though production documentation includes them.
- The API's digital-certificate description mentions certificate start/complete routes that are not defined as OpenAPI paths. The SDK does not invent undocumented request/response contracts for them.
- The SDK retains the two template compatibility routes above and both published/legacy public `sendToken` payloads until the upstream contract converges.
- The sandbox raw signer-artifact route ignored an invalid access code during sandbox verification. The SDK adds the identity preflight described above, but direct HTTP consumers remain exposed until Assinafy fixes the route.
