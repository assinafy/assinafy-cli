# TypeScript SDK reference

The Node.js SDK is published with the CLI and requires Node.js `>=22.12.0` (Node.js 24 LTS is recommended). Responses containing Assinafy's `{ status, message, data }` envelope resolve to `data`; operations with empty result data resolve to `IEmptyResult` (`unknown[]`). Responses without `data` remain unchanged, including direct `IStatusResponse` (`{ status, message }`) bodies. `sendToken` preserves either that published body or the production `{ document, channel, recipient }` body.

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

For the sandbox, add `baseUrl: 'https://sandbox.assinafy.com.br/v1'`. Create an unauthenticated client for public, OAuth bootstrap, or signer-access-code endpoints:

```ts
const publicClient = new AssinafyClient({ allowUnauthenticated: true });
```

## Client

`AssinafyClientOptions`:

| Field | Type | Behavior |
| --- | --- | --- |
| `apiKey` | `string` | Direct owner credential; sent as `X-Api-Key`. |
| `token` | `string` | OAuth access token or user JWT; sent as `Authorization: Bearer`. `apiKey` wins when both are set. |
| `accountId` | `string` | Default for account-scoped methods; most methods also accept an override. |
| `baseUrl` | `string` | HTTPS URL; defaults to `https://api.assinafy.com.br/v1`. Redirects are rejected. |
| `allowInsecureHttp` | `boolean` | Opt-in for a plaintext `http://` base URL. Restricted to loopback hosts (`localhost`, `127.0.0.0/8`, `[::1]`); any other host is rejected even with this enabled, so the API key can never travel in cleartext. |
| `timeout` | `number` | Request timeout in milliseconds; default `30_000`. |
| `logger` | `Logger` | Optional `debug`/`info`/`warn`/`error` functions; otherwise no-op. |
| `allowUnauthenticated` | `boolean` | Permit construction without `apiKey`/`token`; use only for public, OAuth bootstrap, and signer-code flows. |
| `webhookSecret` | `string` | Used only by the experimental `webhookVerifier`; see [Webhook verification](#webhook-verification-experimental). |

| API | Result |
| --- | --- |
| `new AssinafyClient(options: AssinafyClientOptions)` | Client with `documents`, `signers`, `workspaces`, `assignments`, `webhooks`, `templates`, `tags`, `auth`, `oauth`, `fields`, `users`, `signerDocuments`, and `webhookVerifier`. |
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

It resolves to `{ document: IDocumentUploadResponse; assignment: IAssignment; signer_ids: string[] }`. A phone-only signer defaults to WhatsApp verification and notification unless those controls are supplied explicitly.

The workflow is not transactional. Once the upload succeeds, any later failure rejects with a `PartialWorkflowError` naming everything that already exists, so cleanup or a resume never needs to search the workspace for orphans. Nothing is deleted automatically. Signer IDs include reused records; never delete them as an automatic rollback. Validate local signer options before uploading, then inspect the document state before resuming a partially completed workflow.

```ts
import { PartialWorkflowError } from '@assinafy/cli/api';

try {
  await client.uploadAndRequestSignatures({ source, signers });
} catch (error) {
  if (error instanceof PartialWorkflowError) {
    console.error(error.message, error.cause); // original API/validation failure
    console.error({ documentId: error.documentId, signerIds: error.signerIds });
    // Inspect before resuming: these signers may be shared with existing documents.
  }
  throw error;
}
```

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

Uploads must be non-empty PDFs up to 25 MiB. `DocumentArtifactName` is `original | certificated | certificate-page | pades | bundle`; `bundle` is ZIP and the other document artifacts are PDF. For production email delivery, use `sendToken(documentId, 'signer@example.com', 'email')`, which sends `{ recipient, channel }`. The `{ email }` overload preserves the published request form for deployments that support it.

Template document creation sends `{ signers, name?, message?, expires_at?, editor_fields?, tags? }`. Each signer is `{ role_id, id, verification_method?, notification_methods?, step? }`; each editor field is `{ field_id, value: string }`. Template cost estimation publishes `{ signers: Array<{ role_id, verification_method?, notification_methods? }> }`. The optional cost-signer `id` and `step` properties remain compatibility extensions for existing integrations.

Document list params are `{ page?, per_page?, status?, method?, tags?, search?, sort? }`; search params omit `method`/`tags`. Supported sort values are `name`, `-name`, `updated_at`, and `-updated_at`.

In production, `replaceTags` and `addTags` accept tag names, reuse matching tags, and create missing names. Use `replaceTags(documentId, ['Contracts'])` or `addTags(documentId, ['Contracts'])`; an empty replacement removes all associations. Values are sent unchanged. Pass the tag ID from `listTags` to `detachTag`. Document-list tag filters also use IDs.

Document responses expose typed `IDocumentArtifacts`, `IDocumentPage`, inline tags, assignment/signing state, decline state, and creation/update timestamps. `IPublicDocumentInfo` models the complete published public-document payload while retaining the older optional `page_count` and `created_by` fields.

## Assignments (`client.assignments`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `list(params?, accountId?)` | [`GET /assignments?accountId=…`](./api-reference.md#list-assignments) | `PaginatedResult<IAssignment>` |
| `create(documentId, payload)` | [`POST /documents/{documentId}/assignments`](./api-reference.md#create-assignment-request-signatures) | `IAssignment` |
| `estimateCost(documentId, payload)` | [`POST /documents/{documentId}/assignments/estimate-cost`](./api-reference.md#estimate-assignment-cost) | `IEstimateCostResponse` |
| `resetExpiration(documentId, assignmentId, expiresAt)` | [`PUT …/reset-expiration`](./api-reference.md#reset-assignment-expiration) | `IAssignment`; the published API accepts an ISO 8601 timestamp, and deployments that support clearing also accept `null` |
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

Production defaults `notification_methods: []` to `['Email']` and sends an invitation. An empty array is not a way to disable delivery. Choose the intended supported channel explicitly before creating an assignment.

`buildAssignmentPayload(payload, options?)` is exported for callers that need the same normalization. It resolves synchronously to the JSON assignment body above; no HTTP call occurs. Options are `{ allowSignersWithoutId?: boolean; allowEmptySigners?: boolean; skipDigitalCertificateStepValidation?: boolean }`, all false by default. The first two support cost estimation; the third bypasses signing-order and certificate-step checks for estimates. `allowEmptySigners` applies only to `collect`. `create` requires at least one signer, enforces complete contiguous signing steps from 1 when supplied, and requires each digital-certificate signer to be alone in its step. The estimate schema has no `step`, so `estimateCost` does not apply that create-only rule and permits zero signers for `collect`. Assignment list params are pagination plus the compatible `sort?: 'created_at' | '-created_at'`; the runtime endpoint requires the SDK's `accountId` query even though the published parameter table omits it. Assignment `search` is unsupported and rejected locally.

`estimateResendCost(documentId, assignmentId, signerId)` sends a POST without a body. Its production result is:

```json
{
  "total": 0,
  "breakdown": [{ "code": "NotificationEmailResend", "name": "Email Notification Resend", "cost": 0 }],
  "credit_balance": 0,
  "has_sufficient_credits": true
}
```

`IResendCostEstimate` also accepts the published `IEstimateCostResponse` shape. Check `'total' in estimate` to select the production shape; use its `has_sufficient_credits` before resending. The published shape uses `total_credits` and `has_sufficient_resources`.

## Signers (`client.signers`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `create(payload, accountId?)` | [`POST /accounts/{accountId}/signers`](./api-reference.md#create-signer) | `ISigner` |
| `get(signerId, accountId?)` | [`GET /accounts/{accountId}/signers/{signerId}`](./api-reference.md#get-signer) | `ISigner` |
| `list(params?, accountId?)` | [`GET /accounts/{accountId}/signers`](./api-reference.md#list-signers) | `ISignerListResponse` |
| `update(signerId, payload, accountId?)` | [`PUT /accounts/{accountId}/signers/{signerId}`](./api-reference.md#update-signer) | `ISigner` |
| `delete(signerId, accountId?)` | [`DELETE /accounts/{accountId}/signers/{signerId}`](./api-reference.md#delete-signer) | `IEmptyResult` (`unknown[]`) |
| `findByEmail(email, accountId?)` | SDK helper over `list({ search: email })` | `ISigner | null` |

Create payload: `{ full_name: string; email?; whatsapp_phone_number?; phone?; cpf?; metadata? }`. Update payload: `{ full_name?; email?; whatsapp_phone_number?; phone?; government_id?; cpf? }`. `phone`, create-time `cpf`/`metadata`, and update-time `cpf` are compatibility extensions; new integrations should use the published fields. Creation is idempotent by exact case-insensitive email when email is supplied; full-name-only signers are valid. List params support published `search` and compatible `sort?: 'full_name' | '-full_name'`; ignored sort fields are rejected locally.

## Signer-side flows (`client.signerDocuments`)

These methods use the private `signer-access-code`, not the workspace API key, except for the artifact download that the API publishes as a public route. For email verification, obtain the access code from the verification link and the OTP from the same email. An invitation containing only a document ID and recipient is not an access code. Call `self` and `getAssignment` to confirm the signer and document before submitting a decision; keep each document's verification credentials together.

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `getCurrent(signerId, accessCode)` | [`GET /signers/{signerId}/document`](./api-reference.md#get-signers-document) | `IDocumentDetailsResponse` |
| `list(signerId, accessCode, params?)` | [`GET /signers/{signerId}/documents`](./api-reference.md#list-signers-documents) | `IDocumentListResponse` |
| `search(signerId, search, accessCode)` | [`GET /signers/{signerId}/documents/search`](./api-reference.md#search-signers-documents) | `IDocumentListResponse` |
| `download(signerId, documentId, artifact, accessCode?)` | [`GET /signers/{signerId}/documents/{documentId}/download/{artifact}`](./api-reference.md#download-signers-document-artifact) | `Buffer` |
| `signMultiple(documentIds, accessCode)` | [`PUT /signers/documents/sign-multiple`](./api-reference.md#sign-multiple-documents) | `unknown[]` |
| `declineMultiple(documentIds, reason, accessCode)` | [`PUT /signers/documents/decline-multiple`](./api-reference.md#decline-multiple-documents) | `unknown[]` |
| `self(accessCode)` | [`GET /signers/self`](./api-reference.md#get-current-signer) | `ISignerSelf` |
| `acceptTerms(accessCode)` | [`PUT /signers/accept-terms`](./api-reference.md#accept-terms-signer) | `ISignerTermsAcceptance \| IStatusResponse` |
| `verifyCode(payload: IVerifySignerCodePayload)` | [`POST /verify`](./api-reference.md#verify-signer-code-otp); email or WhatsApp OTP | `IEmptyResult \| IStatusResponse` |
| `verifyEmail(payload: IVerifySignerCodePayload)` | Compatibility alias for `verifyCode` | `IEmptyResult \| IStatusResponse` |
| `startCertificate(accessCode)` | [`POST /signers/certificate/start`](#icp-brasil-a1a3-certificates) | `ICertificateStartResponse` (`{ token: string }`) |
| `completeCertificate(accessCode, token)` | [`POST /signers/certificate/complete`](#icp-brasil-a1a3-certificates) | `ICertificateCompleteResponse` (`{ signerName: string }`) |
| `confirmData(documentId, accessCode, payload)` | [`PUT /documents/{documentId}/signers/confirm-data`](./api-reference.md#confirm-signer-data) | `ISigner \| IEmptyResult` |
| `uploadSignature(accessCode, image, options?)` | [`POST /signature`](./api-reference.md#upload-signature-image) | `IEmptyResult \| IStatusResponse` |
| `downloadSignature(accessCode, imageType?)` | [`GET /signature/{type}`](./api-reference.md#download-signature-image) | `Buffer` |
| `getAssignment(accessCode, hasAcceptedTerms?)` | [`GET /sign`](./api-reference.md#view-document-to-sign) | `IDocumentDetailsResponse` |
| `sign(documentId, assignmentId, accessCode, entries)` | [`POST /documents/{documentId}/assignments/{assignmentId}`](./api-reference.md#sign-assignment-items) | `Record<string, unknown>` |
| `decline(documentId, assignmentId, accessCode, reason)` | [`PUT …/reject`](./api-reference.md#reject-decline-assignment) | `unknown[]` |

`confirmData` accepts `{ full_name?, email?, government_id?, whatsapp_phone_number?, has_accepted_terms? }`. `uploadSignature` accepts a non-empty image `Buffer` plus `{ imageType?: 'signature' | 'initial'; contentType?: string; reuse?: boolean }`. Each signing entry is `{ itemId, fieldId, pageId, value }`.

`confirmData`, `sign`, and `decline` first load `getAssignment(accessCode)` and reject a mismatched document or assignment before writing. These methods make one additional GET request. For virtual assignments, confirm the signer's data and then call `sign(documentId, assignmentId, accessCode, [])`. Collect assignments require a non-empty array with the actual assignment item, field, and page IDs. Signing resolves to the server's assignment result; poll document details until `certificated` before downloading final artifacts.

Each request below includes `?signer-access-code=<private-access-code>`. These are complete example bodies and SDK results for production:

| Operation | Request body | SDK result |
| --- | --- | --- |
| `PUT /signers/accept-terms` | No body; submit only after the signer accepts the terms. | `{ "full_name": "Ana Lima", "email": "ana@example.com", "has_accepted_terms": true }` (`email` may be `null`) |
| `POST /verify` | `{ "verification-code": "123456" }` | `[]` |
| `PUT /documents/{documentId}/signers/confirm-data` | `{ "full_name": "Ana Lima", "email": "ana@example.com" }` | `[]` |
| `POST /signature` | Raw PNG bytes with `Content-Type: image/png`; also pass `type=signature&reuse=false` in the query. | `[]` |

An empty result is successful acknowledgement, not a signer profile. Use `self(accessCode)` afterward when you need the updated profile, terms acceptance, or signature flags. The response types retain the published status/profile alternatives without converting or fabricating response fields.

The artifact `download` route is public in the published API. If `accessCode` is supplied, the SDK first verifies it through `/signers/self` and confirms that it belongs to the requested signer before downloading.

### Email and WhatsApp verification

Assignment and template signer descriptors use the same combinations:

| `verification_method` | `notification_methods` | Signer requirement |
| --- | --- | --- |
| `Email` | `["Email"]` | Email address |
| `Whatsapp` | `["Whatsapp"]` | `whatsapp_phone_number` and an eligible paid workspace |
| `DigitalCertificate` (A1 or A3) | `["Email"]` or `["Whatsapp"]` | CPF/CNPJ in `government_id`, matching certificate, delivery contact, and the Digital Certificate workspace feature |

Choose one notification channel. With neither field specified, the API defaults to Email; with only one specified, it infers the other. Estimate cost before creating assignments, including those created from templates: WhatsApp notifications and certificate signatures consume credits. Each certificate signer must be alone in its signing step.

`IVerifySignerCodePayload` is `{ signerAccessCode: string; verificationCode: string }`. Keep the OTP as a string to preserve leading zeroes. Email and WhatsApp use the same verification endpoint and response; the access code identifies the channel and document.

```ts
// Choose the channel configured for this signer; these calls send messages.
await client.documents.sendToken('example_document', 'signer@example.com', 'email');
await client.documents.sendToken('example_document', '+5500000000000', 'whatsapp');

// Use the private link and OTP from the selected channel's same message.
await client.signerDocuments.verifyCode({
  signerAccessCode: 'example_access_code',
  verificationCode: '012345',
}); // [] on production success
```

The delivery request bodies are `{ "recipient": "signer@example.com", "channel": "email" }` and `{ "recipient": "+5500000000000", "channel": "whatsapp" }`. `sendToken` preserves the response forms documented in [Documents](#documents-clientdocuments). Verification sends `{ "verification-code": "012345" }` with `?signer-access-code=example_access_code`; a successful envelope `{ "status": 200, "message": "", "data": [] }` resolves to `[]`. Invalid codes surface as `ApiError` with the server's status and message. `verifyEmail` remains a compatible alias. Continue with data confirmation and virtual/collect signing as described above.

### ICP-Brasil A1/A3 certificates

Both A1 and A3 use `verification_method: "DigitalCertificate"`; they are not separate API method names. Assinafy's [signing documentation](https://api.assinafy.com.br/v1/docs) directs these signers to the certificate handshake. The two routes below follow the deployed [Assinafy signing application](https://app.assinafy.com.br), which supplies their request and response shapes; they are not yet OpenAPI paths and availability on other deployments may differ.

1. Create or select the signer and set their CPF/CNPJ with `signers.update(signerId, { government_id })`. An existing signer returned by `create` is reused without updating their data. Configure an eligible workspace, estimate cost, then create the assignment with `DigitalCertificate` and one delivery channel. Use contiguous steps beginning at `1`, with each certificate signer alone in their step. The same descriptor works for template roles.
2. Obtain the private signer access code through the delivered link. Load `self` and `getAssignment` to confirm the identity and document. Present the document and terms; call `acceptTerms` only after the signer agrees.
3. Call `startCertificate(accessCode)` and retain its operation token with that signer session.
4. On the signer's device, use an initialized Web PKI browser client to select their A1 certificate or A3 device and execute `pki.signWithRestPki({ thumbprint, token })`. Wait for its success callback. The private key, PFX password, and device PIN stay with the local certificate provider.
5. Call `completeCertificate(accessCode, token)` with the **same operation token**, only after Web PKI succeeds. This returns the certificate signer's name. The API validates the certificate against the required CPF/CNPJ; normal `sign` and `signMultiple` do not perform certificate signing.
6. Track document status until `certificated`, then download `pades` or `bundle`. The PAdES artifact exists only for documents with certificate signatures.

The SDK exposes the server handshake. Browser certificate selection, the Web PKI extension/native component, and signer approval belong to the signing application. For the hosted experience, use the Assinafy signing page reached through the invitation; no separate CLI certificate driver is required.

`startCertificate` sends this complete request, with no owner API key or bearer token:

```http
POST /v1/signers/certificate/start?signer-access-code=example_access_code
Content-Type: application/json

{ "signer-access-code": "example_access_code" }
```

Example HTTP 200 response:

```json
{ "status": 200, "message": "", "data": { "token": "example_operation_token" } }
```

The SDK unwraps it to `ICertificateStartResponse`: `{ token: "example_operation_token" }`.

After the browser signs the operation, `completeCertificate` sends:

```http
POST /v1/signers/certificate/complete?signer-access-code=example_access_code
Content-Type: application/json

{ "signer-access-code": "example_access_code", "token": "example_operation_token" }
```

Example HTTP 200 response:

```json
{ "status": 200, "message": "", "data": { "signerName": "Example Signer" } }
```

The SDK unwraps it to `ICertificateCompleteResponse`: `{ signerName: "Example Signer" }`. Both methods reject empty credentials locally and propagate server errors through the shared `ApiError` contract. They do not retry the operation automatically. An expired access code, unsigned token, certificate mismatch, unavailable feature, or failed signing step must be resolved before continuing; inspect the document after an ambiguous network failure.

CLI equivalents use `ASSINAFY_SIGNER_ACCESS_CODE` and `ASSINAFY_CERTIFICATE_TOKEN` to keep credentials out of command arguments:

```bash
assinafy signer certificate-start --json
# Let Web PKI sign the returned token, then supply that same token securely.
assinafy signer certificate-complete --json
assinafy documents download example_document --artifact pades -o signed-pades.pdf
```

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

Both account and user statistics resolve to the complete published row:

```ts
interface IDocumentStatsRow {
  period: string; // YYYY-MM or YYYY-MM-DD
  documents_uploaded: number;
  documents_sent: number;
  signature_requests: number;
  signature_requests_notification_email: number;
  signature_requests_notification_whatsapp: number;
  signature_requests_notification_bypass: number;
  signature_requests_verification_email: number;
  signature_requests_verification_whatsapp: number;
  signature_requests_verification_bypass: number;
  signature_requests_verification_digital_certificate: number;
  signature_requests_viewed: number;
  signature_requests_completed: number;
  documents_certified: number;
}
```

Notification counters can overlap when a request uses multiple delivery channels. The four verification counters are mutually exclusive and add up to `signature_requests`.

## Users (`client.users`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `self()` | [`GET /users/self`](./api-reference.md#get-the-authenticated-user) | `IUserSelfResponse` |
| `stats(params?)` | [`GET /users/self/stats`](./api-reference.md#my-cross-account-document-kpis) | `IDocumentStatsRow[]` |
| `getNotificationPreferences()` | [`GET /users/self/notification-preferences`](./api-reference.md#get-my-notification-preferences) | `INotificationPreferences` |
| `updateNotificationPreferences(payload)` | [`PUT /users/self/notification-preferences`](./api-reference.md#update-my-notification-preferences) | `INotificationPreferences` |

`IUserSelfResponse` accepts the published user object and the compatible `{ user, accounts }` envelope. Preference payloads are a non-empty partial mapping of the exported `NOTIFICATION_PREFERENCE_CODES` to booleans. The production OpenAPI publishes these routes; a lagging sandbox deployment may return route-level 404s for statistics/preferences.

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

## OAuth (`client.oauth`)

| SDK method | HTTP operation / behavior | Resolves to |
| --- | --- | --- |
| `metadata()` | [`GET /.well-known/oauth-protected-resource`](./api-reference.md#oauth-20-protected-resource-metadata), at the API origin outside `/v1` | `IOAuthProtectedResource` |
| `discovery(issuer)` | `GET {issuer}/.well-known/oauth-authorization-server`; requires HTTPS and matching issuer | `IOAuthAuthorizationServer` |
| `authorize({ clientId, redirectUri, scopes })` | Discover resource/server and generate a fresh S256 verifier, state, and optional OIDC nonce | `IOAuthAuthorizationRequest` |
| `exchangeCode(callbackUrl, request, clientSecret?)` | Validate callback URI/state/issuer and submit the authorization code | `IOAuthTokenResponse` |
| `token(payload)` | [`POST /oauth/token`](./api-reference.md#exchange-a-code-refresh-token-or-subject-token-for-an-access-token), with code or refresh grant | `IOAuthTokenResponse` |
| `revoke(payload)` | [`POST /oauth/revoke`](./api-reference.md#revoke-a-token) | `void` |
| `userinfo()` | `GET /oauth/userinfo`, using the current OAuth bearer token with `openid` | `IOAuthUserInfo` |

All request types, full payload examples and response shapes are in the [OAuth guide](./oauth-guide.md). `IOAuthTokenPayload` is a discriminated union: code exchange requires `code`, `redirect_uri`, and `code_verifier`; refresh requires `refresh_token`; both require `client_id` and optionally accept `client_secret` and `resource`. `IOAuthRevokePayload` requires `token` and `client_id`, with optional `client_secret` and `token_type_hint`.

Metadata, discovery, token, and revoke calls remove owner headers. UserInfo uses the configured credential; construct the client with `token` for OAuth. OAuth bodies have no Assinafy envelope. The SDK returns credentials to the caller and does not persist, retry, or automatically refresh them. A refresh response without a new `refresh_token`, or with the submitted one, throws `ValidationError` with `errors.field` set to `'refresh_token'`; do not reuse the submitted token, reconnect instead. Store authorization requests in a single-use session; serialize refreshes across workers and atomically save the rotated result. Use an OIDC library to validate ID tokens before relying on identity claims.

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

Published create payload: `{ type: string; name: string; regex?; is_required? }`. Published update payload: `{ name?; regex?: string | null; is_active? }`. The SDK retains create-time `is_active` and update-time `type`/`is_required` as compatibility extensions. List params are `{ include_inactive?, include_standard? }`. Validation options are `{ signerAccessCode?, accountId? }`; multiple entries are `{ field_id, value }[]`. When a signer code is supplied, the SDK removes any configured owner API-key/bearer headers from that request.

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

The last two routes are retained for platform compatibility although they are not in the published OpenAPI. Neither sends a request body. `get` unwraps the normal Assinafy envelope and returns:

```ts
interface ITemplateDetailsResponse {
  resource?: string;
  id: string;
  name: string;
  document_name?: string | null;
  message?: string | null;
  status: string;
  account_id?: string;
  pages?: Array<{
    id: string;
    number: number;
    height: number;
    width: number;
    download_url: string;
    fields: Array<{
      id: string;
      field_id: string;
      role_id: string;
      label: string;
      display_settings: IDisplaySettings | unknown[] | null;
      created_at: string;
      updated_at: string;
    }>;
  }>;
  roles?: ITemplateRole[];
  tags?: IInlineTag[];
  default_document_tags?: IInlineTag[];
  created_at: string;
  updated_at?: string;
}
```

`downloadPage` returns the raw JPEG response as a Node.js `Buffer`; it does not unwrap JSON.

Template list params support pagination, published `search`, and compatible `sort?: 'name' | '-name'`; ignored sort fields are rejected locally. `ITemplatePage` contains document page dimensions/URL plus typed `ITemplateField[]` entries (`id`, `field_id`, `role_id`, `label`, `display_settings`, and timestamps). Template document creation accepts `editor_fields?: Array<{ field_id: string; value: string }>`.

## Webhooks (`client.webhooks`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `register(payload, accountId?)` | [`PUT /accounts/{accountId}/webhooks/subscriptions`](./api-reference.md#update-webhook-subscription) | `IWebhookSubscription` |
| `get(accountId?)` | [`GET /accounts/{accountId}/webhooks/subscriptions`](./api-reference.md#get-webhook-subscription) | `IWebhookSubscription | null` |
| `inactivate(accountId?)` | [`PUT /accounts/{accountId}/webhooks/inactivate`](./api-reference.md#inactivate-webhook-subscription) | `IWebhookSubscription` |
| `listEventTypes()` | [`GET /webhooks/event-types`](./api-reference.md#list-webhook-event-types) | `IWebhookEventTypeInfo[]` |
| `listDispatches(params?, accountId?)` | [`GET /accounts/{accountId}/webhooks`](./api-reference.md#list-webhook-deliveries) | `PaginatedResult<IWebhookDispatch>` |
| `retryDispatch(dispatchId, accountId?)` | [`POST /accounts/{accountId}/webhooks/{dispatchId}/retry`](./api-reference.md#retry-webhook-delivery) | `IWebhookDispatch` |

Registration payload: `{ url: string; email: string; events?: string[]; is_active?: boolean }`. When `events` is omitted the SDK uses `document_ready`, `document_prepared`, `signer_signed_document`, `signer_rejected_document`, and `document_processing_failed`; pass `[]` deliberately for none. Dispatch filters extend pagination with `{ event?, delivered?, from?, to?, sort?: 'created_at' | '-created_at' }`; sort is a compatibility extension. Dispatch `search` is unsupported and rejected locally. The API does not expose a delete-subscription operation; use `inactivate`.

Decline operations require a non-empty reason of at most 2,000 Unicode characters. `signers.findByEmail` follows pagination metadata until an exact case-insensitive email match is found or the search is exhausted.

## Responses, pagination, errors, and binary data

- JSON responses with `data` are unwrapped from the API envelope; direct status bodies remain `IStatusResponse`. Paginated calls resolve to `{ data: T[]; meta?: { current_page?, last_page?, per_page?, total? } }`; metadata comes from `X-Pagination-*` headers.
- Binary methods resolve to Node.js `Buffer`; the SDK is not a browser package. It never writes downloaded data to disk.
- `ValidationError` means local input validation failed before a request. `ApiError` exposes `statusCode`, `responseData`, `wwwAuthenticate` and `retryAfter`; binary JSON error bodies are decoded before normalization. OAuth responses are flat JSON, and OAuth revocation resolves to `undefined`. `NetworkError` covers timeout/DNS/transport failures. `PartialWorkflowError` reports `documents upload --wait` or a multi-step helper that failed after creating resources and exposes `documentId` and `signerIds`. All extend `AssinafyError`, which exposes `context` and preserves `cause` where available.
- `normalizeBaseUrl(url)` is exported and removes one trailing slash.

Exported error constructors/helpers are `new AssinafyError(message, context?, { cause? }?)`, `new ApiError(message, statusCode, responseData?, { cause?, wwwAuthenticate?, retryAfter? }?)`, `ApiError.fromResponse(statusCode, responseData, headers?)`, `new ValidationError(message?, errors?)`, `new NetworkError(message, { cause? }?)`, and `new PartialWorkflowError(message, { documentId?, signerIds? }, { cause? }?)`. Resource classes and all named request/response types are also exported for dependency injection and type annotations; normal applications should obtain resource instances from `AssinafyClient`.

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

- Production OpenAPI currently publishes 93 operations. Some sandbox deployments lag it; account/user statistics and user notification-preference routes may return route-level 404s even though production documentation includes them.
- Certificate start/complete are deployed production extensions, exposed by `startCertificate` and `completeCertificate` with the signing application's payloads. They supplement the 93 OpenAPI operations; the API manifest contains only published paths.
- The SDK retains the two template compatibility routes above and both published/legacy public `sendToken` payloads for compatible deployments.
- Signer artifact downloads are public in the published contract. Supplying a signer access code opts into an SDK identity preflight; it does not change the server route into a private endpoint.
