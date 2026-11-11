# TypeScript SDK reference

The Node.js SDK is published with the CLI and requires Node.js `>=22.12.0` (Node.js 26 LTS is recommended). Responses containing Assinafy's `{ status, message, data }` envelope resolve to `data`; operations with empty result data resolve to `IEmptyResult` (`unknown[]`). Responses without `data` remain unchanged, including direct `IStatusResponse` (`{ status, message }`) bodies. `sendToken` resolves to `{ document, channel, recipient }`.

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
| `webhookSecret` | `string` | Endpoint `whsec_` signing secret used by `client.webhookVerifier`; see [Webhook verification](#webhook-verification). |

| API | Result |
| --- | --- |
| `new AssinafyClient(options: AssinafyClientOptions)` | Client with `documents`, `signers`, `workspaces`, `assignments`, `webhooks`, `templates`, `tags`, `auth`, `oauth`, `fields`, `users`, `signerDocuments`, `contracts`, `envelopes`, `embed`, and `webhookVerifier`. |
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
    government_id?: string;
    metadata?: Record<string, unknown>;
    verification_method?: 'Email' | 'Whatsapp' | 'DigitalCertificate' | 'IdDocumentFaceMatchBasic';
    notification_methods?: Array<'Email' | 'Whatsapp'>;
    step?: number;
    embedded?: boolean;
  }>;
  message?: string;
  metadata?: Record<string, unknown>;
  waitForReady?: boolean;
  expiresAt?: string;
  copyReceivers?: string[];
  maxTotalCredits?: number;
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
| `details(documentId, params?)` | [`GET /documents/{documentId}`](./api-reference.md#get-document) | `IDocumentDetailsResponse` |
| `get(documentId, params?)` | Same as `details` | `IDocumentDetailsResponse` |
| `getAsSigner(documentId, accessCode)` | `GET /documents/{documentId}`, stripped owner headers | `ISignerDocumentDetailsResponse` |
| `rename(documentId, name)` | [`PATCH /documents/{documentId}`](./api-reference.md#rename-document) | `IDocumentDetailsResponse` |
| `waitUntilReady(documentId, { maxWaitMs?, pollIntervalMs? }?)` | Polls [Get document](./api-reference.md#get-document) | `IDocumentDetailsResponse`; rejects on terminal failure, permanent 4xx, or timeout |
| `download(documentId, artifactName?, options?)` | [`GET /documents/{documentId}/download/{artifact}`](./api-reference.md#download-document-artifact) | `Buffer` |
| `thumbnail(documentId, options?)` | [`GET /documents/{documentId}/thumbnail`](./api-reference.md#download-document-thumbnail) | JPEG `Buffer` |
| `downloadPage(documentId, pageId, options?)` | [`GET /documents/{documentId}/pages/{pageId}/download`](./api-reference.md#download-document-page) | JPEG `Buffer` |
| `activities(documentId, params?)` | [`GET /documents/{documentId}/activities`](./api-reference.md#list-document-activities) | `IDocumentActivity[]` |
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
| `sendToken(documentId, email, channel?)` or `sendToken(documentId, { email })` | [`PUT /public/documents/{documentId}/send-token`](./api-reference.md#send-access-token-for-public-document) | `ISendTokenResponse` (`{ document; channel; recipient }`) |
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

Uploads must be non-empty PDFs up to 25 MiB. `DocumentArtifactName` is `original | certificated | certificate-page | pades | bundle`; `bundle` is ZIP and the other document artifacts are PDF. `sendToken(documentId, 'signer@example.com')` emails a one-time access token to a signer who has not signed a pending document yet and sends `{ "channel": "email", "recipient": "signer@example.com" }`. Only the `email` channel is accepted; any other channel is rejected locally. The `{ email }` overload sends the same body.

Template document creation sends `{ signers, name?, message?, expires_at?, editor_fields?, tags?, max_total_credits? }`. Options also accept `idempotencyKey`, sent only in the `Idempotency-Key` header. Each signer is `{ role_id, id?, email?, name?, whatsapp_phone_number?, verification_method?, notification_methods?, step?, embedded? }`; supply an existing ID or an email for creation/reuse (an ID takes precedence); each editor field is `{ field_id, value: string }`. Template cost estimation publishes `{ signers: Array<{ role_id, verification_method?, notification_methods? }> }`. The optional cost-signer `id` and `step` properties remain compatibility extensions for existing integrations. A template with placed signer fields creates a `collect` assignment, so it cannot use a `DigitalCertificate` signer. For certificate-bearing template create and estimate calls, the SDK reads the template details first and rejects placed Signer-role fields with `ValidationError.errors.code` set to `digital_certificate_requires_virtual`.

Document list params are `{ page?, per_page?, status?, method?, tags?, search?, sort?, envelope_id? }`; search params omit `method`/`tags`. Supported sort values are `name`, `-name`, `updated_at`, and `-updated_at`.

In production, `replaceTags` and `addTags` accept tag names, reuse matching tags, and create missing names. Use `replaceTags(documentId, ['Contracts'])` or `addTags(documentId, ['Contracts'])`; an empty replacement removes all associations. Values are sent unchanged. Pass the tag ID from `listTags` to `detachTag`. Document-list tag filters also use IDs.

Activity queries use `IDocumentActivityListParams`: `{ page?, per_page?, 'per-page'?, sort?: 'id' | '-id' }`; the default is 20 records per page, newest first. Page until an empty array to read the complete history. Expirations accept `YYYY-MM-DD` (23:59 UTC), an offsetless datetime (UTC), or an RFC 3339 timestamp; values are forwarded unchanged. Template signing steps apply to Signer roles; CopyReceiver steps are ignored. Editor fields do not force a certificate template into collect signing. Template creation/estimation forwards role-specific verification, notification and step settings to the API, which ignores them for CopyReceiver roles. The SDK validates descriptor identity locally without fetching roles solely for validation.

Owner `get`/`details` params accept `{ expand: "envelope" | "envelope_id" | "envelope,envelope_id" }`; the expanded relation is null for a standalone document. `getAsSigner` returns only the signer-visible assignment fields. Download options accept `{ signerAccessCode? }`; thumbnail/page options also accept `{ artifact: "certificated" }` to render the signed PDF. Omit the code to use owner authentication; a supplied code strips owner credentials, and a blank code is rejected. CLI `documents get|download|thumbnail|download-page --access-code` selects the same behavior.

Document responses expose typed `IDocumentArtifacts`, `IDocumentPage`, inline tags, assignment/signing state, decline state, and creation/update timestamps. `IPublicDocumentInfo` models the complete published public-document payload while retaining the older optional `page_count` and `created_by` fields.

## Envelopes (`client.envelopes`)

An envelope groups up to 20 processed documents and 20 existing workspace signers. Each document keeps its own assignment, status, certificate, artifacts and webhooks. Creation consumes one document allowance; notifications and biometric verification are charged once per signer for the envelope, while certificate signatures are charged per document. The Envelopes feature is required for creation, adding documents and estimates. OAuth uses `documents:read`/`documents:write`.

| SDK method | HTTP operation | SDK result |
| --- | --- | --- |
| `list(params?, accountId?)` | `GET /accounts/{accountId}/envelopes`; `{ page?, per_page?, search?, status?: "open" | "closed" }` | `PaginatedResult<IDocumentEnvelope>` |
| `create(payload, options?)` | `POST /accounts/{accountId}/envelopes`; `ICreateEnvelopePayload` | `IDocumentEnvelope` |
| `estimateCost(payload, accountId?)` | `POST /accounts/{accountId}/envelopes/estimate-cost`; same creation body, no changes or charges | `IEstimateCostResponse` |
| `get(envelopeId, accountId?)` | `GET /accounts/{accountId}/envelopes/{envelopeId}` | `IDocumentEnvelope` |
| `update(envelopeId, payload, accountId?)` | `PATCH /accounts/{accountId}/envelopes/{envelopeId}`; `{ name?, message?: string | null, document_ids?: string[] }` | `IDocumentEnvelope` |
| `delete(envelopeId, accountId?)` | `DELETE /accounts/{accountId}/envelopes/{envelopeId}`; no body, requires all documents closed | `[]`; documents remain |
| `activities(envelopeId, params?, accountId?)` | `GET …/{envelopeId}/activities`; pagination and `sort: "id" | "-id"` | `PaginatedResult<IEnvelopeActivity>` |
| `download(envelopeId, artifactName?, accountId?)` | `GET …/{envelopeId}/download/{artifactName}`; defaults to certificated | ZIP `Buffer` |
| `cancel(envelopeId, accountId?)` | `PUT …/{envelopeId}/cancel`, no body | `Array<{ id, status, cancelled: boolean }>` |
| `resendNotification(envelopeId, signerId, accountId?)` | `PUT …/{envelopeId}/signers/{signerId}/resend`, no body | `{ is_sent: boolean, envelope_id: string, signer_id: string }` |
| `addDocument(envelopeId, payload, accountId?)` | `POST …/{envelopeId}/documents`; `IEnvelopeDocumentPayload & { max_total_credits?: number }` | `IDocumentEnvelope` |
| `removeDocument(envelopeId, documentId, accountId?)` | `DELETE …/{envelopeId}/documents/{documentId}`, no body | `IDocumentEnvelope` |

Complete creation body (optional controls shown):

```ts
interface ICreateEnvelopePayload {
  name: string; // 1–255 characters, no <
  message?: string | null;
  max_total_credits?: number;
  signers: Array<{
    id: string;
    verification_method?: 'Email' | 'Whatsapp' | 'DigitalCertificate' | 'IdDocumentFaceMatchBasic';
    notification_methods?: Array<'Email' | 'Whatsapp'>;
    embedded?: boolean;
  }>;
  documents: Array<{
    id: string;
    signer_ids: string[];
    method?: 'virtual' | 'collect';
    entries?: ICollectAssignmentEntry[];
    expires_at?: string | number | null;
    copy_receiver_ids?: string[];
  }>;
}
```

Signers act in parallel; `step` is not accepted. Every signer must appear on at least one document, and every document signer must be in the envelope's signer list. A certificate signer must be alone on each virtual document they sign. Collect entries use the assignment field format and exactly that document's signers. The server enforces workspace ownership, document readiness, at most 2,000 fields and 100 copy receivers across the envelope. Expiration accepts ISO dates/timestamps or Unix seconds; null, zero or empty text means no expiration. Reorder updates must name every current document exactly once; null clears only the message.

A complete SDK flow:

```ts
import { randomUUID } from 'node:crypto';
import { AssinafyClient } from '@assinafy/cli/api';

const client = new AssinafyClient({
  apiKey: process.env.ASSINAFY_API_KEY!,
  accountId: process.env.ASSINAFY_ACCOUNT_ID!,
});
const signer = await client.signers.create({ full_name: 'Example Signer', email: 'signer@example.com' });
const documents = [];
for (const filePath of ['./contract.pdf', './annex.pdf']) {
  const uploaded = await client.documents.upload({ filePath });
  // Persist uploaded.id before waiting so a failure can be resumed.
  await client.documents.waitUntilReady(uploaded.id);
  documents.push({ id: uploaded.id, signer_ids: [signer.id] });
}
const payload = {
  name: 'Service agreement',
  message: 'Please review both documents.',
  signers: [{ id: signer.id }],
  documents,
  max_total_credits: 0,
};
const estimate = await client.envelopes.estimateCost(payload);
if (!estimate.has_sufficient_resources) throw new Error('Insufficient resources');
const idempotencyKey = randomUUID(); // Persist with this business operation before sending.
const envelope = await client.envelopes.create(payload, { idempotencyKey });
// Persist envelope.id, then inspect document status and notification history.
const current = await client.envelopes.get(envelope.id);
```

The SDK result has this complete shape (the wire body wraps it in `{ status, message, data }`):

```ts
interface IDocumentEnvelope {
  resource?: string;
  id: string;
  name: string;
  message: string | null;
  documents: Array<{
    id: string;
    position: number;
    name: string;
    status: string;
    artifacts: Record<string, string>;
    signers: Array<{
      id: string;
      full_name: string;
      email: string | null;
      whatsapp_phone_number: string | null;
      completed: boolean;
      signed_at: string | null;
    }>;
  }>;
  counts: Record<string, number> | null;
  signing_urls: Array<{ signer_id: string; url: string | null; embedded?: boolean }>;
  created_at: string;
}
```

A successful creation means the envelope exists, not that every invitation arrived. Inspect assignment `notification_history` and WhatsApp delivery history. One invitation covers a signer's documents; the email/WhatsApp code carries across the envelope. `getAssignment(code, undefined, { document_id })` selects a document, and `sign`/`decline` perform that selection automatically. Biometric verification and review are shared across the signer's envelope documents; certificate signing remains one operation per document. Pass `documentId` to `startCertificate(code, documentId)` and `completeCertificate(code, token, documentId)` to select each one.

Creation options are `{ accountId?, idempotencyKey? }`. The case-sensitive key belongs to the workspace and does not expire; reusing it returns the original envelope regardless of the replacement body. Persist and deliberately reuse it after an ambiguous failure; never generate a new key for the same intended operation. `IdempotencyKeyInUse` is 409 while the first request runs. A credit ceiling refusal creates and charges nothing. There are no SDK write retries. Deleting an envelope also removes its idempotency replay result.

Adding a document uses existing envelope signers, sends updated invitations, and can charge certificate credits. Removing an open document cancels it and notifies recipients; links from it continue to open the rest. Cancel affects only cancellable documents; completed certificates stay valid. Deleting requires every document closed and leaves the documents intact. Document deletion is refused while its envelope remains open, including documents removed from it. CLI cancel/delete/remove-document confirm unless `--yes`.

## Embedded signing (`client.embed`)

The Embed feature and an owner API key or first-party user token are required to mint sessions; OAuth application tokens cannot mint them. Keep that credential on your backend. The Node SDK is not shipped in the browser or a native mobile app; the frontend displays the hosted iframe. See the [official Embedded Signing Guide](https://api.assinafy.com.br/v1/docs) for the frontend message protocol and event payloads.

| SDK method | HTTP operation and request | SDK result |
| --- | --- | --- |
| `listOrigins(accountId?)` | `GET /accounts/{accountId}/embed-origins`, no body | `IEmbedOrigin[]` |
| `createOrigin(origin, accountId?)` | `POST /accounts/{accountId}/embed-origins`; `{ origin }` | `IEmbedOrigin` |
| `updateOrigin(originId, origin, accountId?)` | `PUT …/embed-origins/{originId}`; `{ origin }` | `IEmbedOrigin` |
| `deleteOrigin(originId, accountId?)` | `DELETE …/embed-origins/{originId}`, no body | `[]` |
| `createSession(documentId, assignmentId, signerId)` | `POST /documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/embed-sessions`, no body | `IEmbedSession` |
| `exchangeSession(token, parentOrigin?)` | `POST /embed/sessions/{token}/exchange`; no body or `{ parent_origin }`, no owner headers | `IEmbedSessionExchange` |

Complete SDK response types:

```ts
interface IEmbedOrigin { id: string; origin: string; created_at: string }
interface IEmbedSession { url: string; expires_at: string }
interface IEmbedSessionExchange {
  signer_access_code: string;
  signer_id: string;
  document_id: string;
  verification_method: string;
  embed_origins: string[];
}
```

1. Register an exact HTTPS origin with `createOrigin('https://app.example.com')`. HTTP is allowed only on localhost or 127.0.0.1. Paths, credentials, wildcards, query strings and fragments are rejected; at most 10 origins are allowed. No origins means embedding is disabled.
2. Create the assignment/template/envelope signer with `embedded: true`, Email or Whatsapp verification, and the matching notification method. Invitations still deliver the OTP; `signing_urls` contains `{ signer_id, url: null, embedded: true }`.
3. Your authenticated backend verifies that the logged-in application user may act for that signer, then calls `createSession(documentId, assignmentId, signerId)`. Pass only its URL to that user's frontend. Sessions expire after five minutes and are single-use; mint a new one each time the frame is opened. Limit: 30 per signer per hour.
4. Load the URL in the iframe. On load, send `{ v: 1, type: 'assinafy:hello' }` every 500 ms for at most 10 seconds, targeting the exact Assinafy origin, until `ready` or `error`. Repeat the handshake on frame reload. Accept messages only when both `event.origin` and `event.source === iframe.contentWindow` match. Production iframe origin: `https://app.assinafy.com.br`; sandbox: `https://app-sandbox.assinafy.com.br`.
5. The hosted page exchanges the token and handles verification, terms and signing. Integrations must not call `exchangeSession` before loading the frame: it consumes the token, including on a 409. That method/CLI operation is exposed for implementing the hosted-page protocol. Unknown, expired or consumed tokens return 410/`embed_session_invalid`.
6. Treat frame events as UI hints. Confirm completion using verified webhooks or document reads before releasing goods or changing permissions. An external invitation can also complete signing; the frame reports that with `via: 'external'`.

A 409/`document_not_ready` from session creation permits a later deliberate mint after processing. Other refusal codes distinguish `already_signed`, `document_unavailable`, and `embed_origins_missing`; inspect `ApiError.responseData`. Editing the signer's contact before verification rotates the access code and expires open frames. Re-send an invitation only as an intentional notification operation. Never store/log embed URLs or exchange results in browser storage.

## Contracts (`client.contracts`)

Contract tracking (CLM / Gestão de Contratos) records terms on an existing document. It does not upload a document or request signatures. Contract tracking is included in all standard plans, including Free; writes require the feature to be active; reads remain available when the plan lapses. OAuth uses `documents:read` for reads and `documents:write` for writes.

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `list(params?, accountId?)` | [`GET /accounts/{accountId}/contracts`](./api-reference.md#list-contracts) | `PaginatedResult<IContract>` |
| `get(documentId, accountId?)` | [`GET /accounts/{accountId}/documents/{documentId}/contract`](./api-reference.md#get-a-documents-contract-terms) | `IContract \| IContractAmendment` |
| `set(documentId, payload, accountId?)` | [`PUT /accounts/{accountId}/documents/{documentId}/contract`](./api-reference.md#set-a-documents-contract-terms) | `IContract \| IContractAmendment` |
| `related(documentId, accountId?, params?)` | [`GET …/contract/related`](./api-reference.md#list-the-contracts-related-to-a-document) | `IContract`, including `amendments` |
| `renew(documentId, payload, accountId?)` | [`POST …/contract/renew`](./api-reference.md#renew-a-contract) | `IContract` |
| `terminate(documentId, payload?, accountId?)` | [`POST …/contract/terminate`](./api-reference.md#terminate-a-contract) | `IContract` |

`IContractListParams` accepts `{ page?, per_page?, 'per-page'?, status?, counterparty?, search?, end_date_from?, end_date_to?, ending_within_days?, external_system?, external_id?, sort?, expand? }`. Status is `draft`, `active`, `expired` or `terminated`, supplied singly, as a comma-separated string, or an array. `sort` is `end_date`, `-end_date`, `updated_at` or `-updated_at` (the default). `expand: 'document'` embeds the document. Date filters use `YYYY-MM-DD`; `ending_within_days` is an integer from 0 to 3650 and includes today in Brasília when zero. External reference IDs are forwarded unchanged. Results use the shared `{ data, meta? }` pagination contract.

The complete `ISetContractPayload` is:

```ts
{
  status?: 'draft' | 'active' | 'expired' | 'terminated';
  counterparty_name?: string | null;
  counterparty_taxpayer_id?: string | null;
  value?: number | null;
  currency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  auto_renew?: boolean | null;
  renewal_term_months?: number | null;
  notice_period_days?: number | null;
  owner_id?: string | null;
  metadata?: Record<string, string> | null;
  external_references?: Array<{ system: string; id: string }> | null;
  parent_document_id?: string | null;
  relation_type?: 'amendment' | 'renewal' | 'termination';
  updated_at?: string | null;
}
```

Send at least one attribute. Omitted fields stay unchanged. `null` clears a root term, except `auto_renew` resets to false and `currency` returns to BRL while a value exists; status cannot be null. Sending `external_references` replaces the entire list; `[]` or `null` clears it. An amount is from 0 to 9999999999999.99 with at most two decimal places; currency is three letters. Stored dates start at year 1000 and the end cannot precede the start. Renewal terms are 1–600 months (12 when unset), notice periods 0–3650 days. Metadata accepts up to 50 keys of 1–40 letters, digits, `_`, `-` or `.`, each with plain text up to 500 characters. External references allow up to 20 `{ system, id }` entries, with a 1–64-character system using those same characters and a nonempty ID up to 255 characters without four-byte characters. CPF/CNPJ and workspace membership are validated by the API; the SDK forwards their values unchanged.

Create a draft, then activate it when its terms should enter the hourly lifecycle:

```ts
const uploaded = await client.documents.upload({ filePath: './contract.pdf' });
// Persist uploaded.id before setting terms; it remains valid if the next call fails.
const terms = await client.contracts.set(uploaded.id, {
  status: 'draft',
  counterparty_name: 'Example Company',
  value: 1200.50,
  currency: 'BRL',
  start_date: '2027-01-01',
  end_date: '2027-12-31',
  auto_renew: false,
  renewal_term_months: 12,
  notice_period_days: 30,
  metadata: { crm_stage: 'won' },
  external_references: [{ system: 'erp', id: 'example-contract' }],
});
await client.contracts.set(uploaded.id, { status: 'active', updated_at: terms.updated_at });
```

The unwrapped root response (`IContract`) is:

```json
{
  "resource": "document_contract",
  "document_id": "example-document",
  "status": "active",
  "counterparty_name": "Example Company",
  "counterparty_taxpayer_id": null,
  "value": 1200.5,
  "currency": "BRL",
  "start_date": "2027-01-01",
  "end_date": "2027-12-31",
  "auto_renew": false,
  "renewal_term_months": 12,
  "notice_period_days": 30,
  "term": 1,
  "owner_id": null,
  "metadata": { "crm_stage": "won" },
  "external_references": [{ "system": "erp", "id": "example-contract" }],
  "amendments": [],
  "created_at": "2026-10-23T12:00:00Z",
  "updated_at": "2026-10-23T12:00:00Z"
}
```

`document` is optional and uses `IDocumentListItem`; `amendments` is returned on root/family reads. `resource` may be omitted in lists or embedded objects. Owner document details expose `has_contract?: boolean`; absence means unknown, not false. Missing terms produce `ApiError` 404; `responseData.code: 'NoContractTerms'` distinguishes them from a missing document.

For a signed instrument, upload a separate document and set its link:

```ts
await client.contracts.set('example-amendment', {
  parent_document_id: 'example-document',
  relation_type: 'amendment',
  value: 1500,
  end_date: '2028-12-31',
});
const family = await client.contracts.related('example-amendment');
```

`get` and `set` on an instrument return `IContractAmendment`:

```json
{
  "resource": "document_contract_amendment",
  "document_id": "example-amendment",
  "document_name": "Example amendment.pdf",
  "parent_document_id": "example-document",
  "relation_type": "amendment",
  "number": null,
  "status": "pending",
  "document_status": "metadata_ready",
  "apply_error": null,
  "currency": "BRL",
  "terms": { "value": 1500, "end_date": "2028-12-31" },
  "changes": {
    "value": { "from": 1200.5, "to": 1500 },
    "end_date": { "from": "2027-12-31", "to": "2028-12-31" },
    "term": { "from": 1, "to": 2 }
  },
  "applied_at": null,
  "created_at": "2026-10-23T12:00:00Z",
  "updated_at": "2026-10-23T12:00:00Z"
}
```

Use `'parent_document_id' in result` to distinguish an instrument from root terms. A link may target any document in the family; the API resolves the root. `amendment` changes value, currency, start/end dates, renewal settings, counterparty and metadata; `renewal` changes only end date/value, and `termination` only end date. Pending updates merge into `terms`, where null removes a proposed change. `parent_document_id: null` unlinks a pending instrument. Once certificated, instruments apply in signing order; `status` becomes `applied`, `number` is assigned, `applied_at` is set, and the recorded changes become read-only. Inspect `apply_error` when an instrument remains pending. `terms` and `changes` can be null.

Renewal input (`IRenewContractPayload`) is `{ term?: number; end_date?: string | null; value?: number | null; updated_at?: string | null }`. Supply the current `term` or an explicit later end date. An omitted/empty/null end date uses the configured renewal period and requires `term`. A null value clears the amount. Renewal advances `term`, can reopen expired terms, and rejects terminated contracts. A repeat cannot silently renew twice: a stale term/date yields 400, or a stale timestamp yields 409. The SDK never retries writes automatically.

Termination input (`ITerminateContractPayload`) is `{ reason?: string | null; updated_at?: string | null }`; the default is `{}`. The reason allows up to 500 Unicode characters and is stored in the event. The response is the complete root contract with status `terminated`. For either write, send the `updated_at` from the latest read; on `409 ContractChanged`, re-read and decide whether the change still applies. On an ambiguous network error, inspect current terms before repeating anything.

The hourly lifecycle uses Brasília calendar days: notice-period alerts, warnings 45/30 days before expiry, then renewal or expiry the day after the end date. Owner notification preferences include `ContractRenewalNotice`, `ContractExpiring`, `ContractExpired` and `ContractRenewed`. Contract activities include `document_contract_updated`, `document_contract_amendment_updated`, `document_contract_amended`, `document_contract_renewal_notice`, `document_contract_expiring`, `document_contract_expired`, `document_contract_renewed` and `document_contract_terminated`. Subscribe explicitly to the event types needed; webhook defaults do not add these events. Reconcile missed events by paging `list({ sort: '-updated_at' })` until older than the last sync, and page `documents.activities(documentId, { page, sort: 'id' })` for history. A lapsed plan pauses lifecycle changes and pending amendments; restoration catches up without sending alerts whose windows have passed.

`related` accepts `{ expand: "document" }` to include document details, also available as `contracts related --expand document`.

## Assignments (`client.assignments`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `list(params?, accountId?)` | [`GET /assignments?accountId=…`](./api-reference.md#list-assignments) | `PaginatedResult<IAssignment>` |
| `create(documentId, payload)` | [`POST /documents/{documentId}/assignments`](./api-reference.md#create-assignment-request-signatures) | `IAssignment` |
| `estimateCost(documentId, payload)` | [`POST /documents/{documentId}/assignments/estimate-cost`](./api-reference.md#estimate-assignment-cost) | `IEstimateCostResponse` |
| `resetExpiration(documentId, assignmentId, expiresAt)` | [`PUT …/reset-expiration`](./api-reference.md#reset-assignment-expiration) | `IAssignment`; accepts a date, datetime or `null` to clear the deadline |
| `resendNotification(documentId, assignmentId, signerId)` | [`PUT …/signers/{signerId}/resend`](./api-reference.md#resend-signature-request) | `IResendEmailResponse` |
| `estimateResendCost(documentId, assignmentId, signerId)` | [`POST …/estimate-resend-cost`](./api-reference.md#estimate-resend-cost) | `IResendCostEstimate` |
| `listWhatsAppNotifications(documentId, assignmentId)` | [`GET …/whatsapp-notifications`](./api-reference.md#list-whatsapp-notifications) | `IWhatsAppNotification[]` |
| `getIdentityVerification(documentId, assignmentId, signerId)` | [`GET …/signers/{signerId}/identity-verification`](./api-reference.md#signer-identity-review) | `ISignerIdentityReview` |
| `downloadIdentityVerificationImage(documentId, assignmentId, signerId, name)` | [`GET …/identity-verification/images/{name}`](./api-reference.md#signer-identity-review-image) | `Buffer` (JPEG, PNG or PDF) |
| `reviewIdentityVerification(documentId, assignmentId, signerId, payload)` | [`POST …/identity-verification/review`](./api-reference.md#decide-signer-identity-review) | `ISignerIdentityReview`; payload is `IIdentityReviewPayload` |

Assignment payload:

```ts
{
  method?: 'virtual' | 'collect';
  signers?: Array<string | {
    id?: string;
    signer_id?: string;
    verification_method?: 'Email' | 'Whatsapp' | 'DigitalCertificate' | 'IdDocumentFaceMatchBasic';
    notification_methods?: Array<'Email' | 'Whatsapp'>;
    step?: number;
    embedded?: boolean;
  }>;
  signer_ids?: string[]; // compatibility alias
  signerIds?: string[];  // compatibility alias
  message?: string;
  expires_at?: string;
  copy_receivers?: string[];
  max_total_credits?: number;
  entries?: ICollectAssignmentEntry[];
}
```

`max_total_credits` is a finite non-negative ceiling; `0` allows only a free request. A higher live price returns `409`/`CreditCeilingExceeded` before creation or charging. The high-level helper calls this option `maxTotalCredits`; CLI `send`, `assignments create`, and `documents create-from-template` expose `--max-total-credits`. A null balance means unlimited, not zero. `embedded: true` requires Email or Whatsapp verification and the workspace Embed feature; signing links return `url: null`.

Production defaults `notification_methods: []` to `['Email']` and sends an invitation. An empty array is not a way to disable delivery. Choose the intended supported channel explicitly before creating an assignment.

`buildAssignmentPayload(payload, options?)` is exported for callers that need the same normalization. It resolves synchronously to the JSON assignment body above; no HTTP call occurs. Options are `{ allowSignersWithoutId?: boolean; skipDigitalCertificateStepValidation?: boolean }`, both false by default. Both support cost estimation: the first accepts signer descriptors without an `id`, and the second bypasses signing-order and certificate-step checks for estimates. An empty signer list always throws `ValidationError('At least one signer is required')`, in `virtual` and `collect` modes and in cost estimates alike. `DigitalCertificate` signers require `method: 'virtual'`: `create` and `estimateCost` reject `collect` before sending a request with `ValidationError.errors.code` set to `digital_certificate_requires_virtual`. `create` also enforces complete contiguous signing steps from 1 when supplied and requires each digital-certificate signer to be alone in its step. The estimate schema has no `step`, so `estimateCost` passes `skipDigitalCertificateStepValidation` to skip that create-only rule. Assignment list params are pagination plus the compatible `sort?: 'created_at' | '-created_at'`; the runtime endpoint requires the SDK's `accountId` query even though the published parameter table omits it. Assignment `search` is unsupported and rejected locally.

`estimateResendCost(documentId, assignmentId, signerId)` sends a POST without a body. Its production result is:

```json
{
  "total": 0,
  "breakdown": [{ "code": "NotificationEmailResend", "name": "Email Notification Resend", "cost": 0 }],
  "credit_balance": 0,
  "has_sufficient_credits": true
}
```

`credit_balance` can be null for unlimited plans. `IResendCostEstimate` also accepts the published `IEstimateCostResponse` shape. Check `'total' in estimate` to select the production shape; use its `has_sufficient_credits` before resending. The published shape uses `total_credits` and `has_sufficient_resources`.

## Signers (`client.signers`)

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `create(payload, accountId?)` | [`POST /accounts/{accountId}/signers`](./api-reference.md#create-signer) | `ISigner` |
| `get(signerId, accountId?)` | [`GET /accounts/{accountId}/signers/{signerId}`](./api-reference.md#get-signer) | `ISigner` |
| `list(params?, accountId?)` | [`GET /accounts/{accountId}/signers`](./api-reference.md#list-signers) | `ISignerListResponse` |
| `update(signerId, payload, accountId?)` | [`PUT /accounts/{accountId}/signers/{signerId}`](./api-reference.md#update-signer) | `ISigner` |
| `delete(signerId, accountId?)` | [`DELETE /accounts/{accountId}/signers/{signerId}`](./api-reference.md#delete-signer) | `IEmptyResult` (`unknown[]`) |
| `findByEmail(email, accountId?)` | SDK helper over `list({ search: email })` | `ISigner | null` |

Create payload: `{ full_name: string; email?; whatsapp_phone_number?; government_id?; phone?; cpf?; metadata? }`. Update payload: `{ full_name?; email?; whatsapp_phone_number?; phone?; government_id?; cpf? }`. `government_id` accepts CPF or numeric/alphanumeric CNPJ and is forwarded unchanged for server normalization. `phone`, create-time `cpf`/`metadata`, and update-time `cpf` are compatibility extensions; the `cpf` alias retains its digit-only normalization. New integrations should use the published fields. Creation is idempotent by exact case-insensitive email when email is supplied; full-name-only signers are valid. Existing email matches are reused without updating their government ID; call `update` explicitly when needed. Update `email`, `whatsapp_phone_number` and `government_id` with `null` or `""` to clear them; omitted values stay unchanged. `findByEmail` requests the server maximum of 50 records per page so a capped page cannot end its search early. List params support published `search` and compatible `sort?: 'full_name' | '-full_name'`; ignored sort fields are rejected locally.

## Signer-side flows (`client.signerDocuments`)

These methods use the private `signer-access-code` and strip the workspace API key or bearer header. Token-based certified-copy downloads use the private download token instead. `listAsOwner` and `searchAsOwner` call the same routes with the client's API key or bearer token instead; the signer must belong to that workspace. For email or WhatsApp verification, obtain the access code from the verification link and the OTP from the same message. An invitation containing only a document ID and recipient is not an access code. Call `self` and `getAssignment` to confirm the signer and document before submitting a decision; keep each document's verification credentials together.

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `getCurrent(signerId, accessCode, params?)` | [`GET /signers/{signerId}/document`](./api-reference.md#get-signers-document) | `ISigningDocument` |
| `list(signerId, accessCode, params?)` | [`GET /signers/{signerId}/documents`](./api-reference.md#list-signers-documents) | `IDocumentListResponse` |
| `listAsOwner(signerId, params?)` | [`GET /signers/{signerId}/documents`](./api-reference.md#list-signers-documents) with owner credentials | `IDocumentListResponse` |
| `search(signerId, search, accessCode, params?)` | [`GET /signers/{signerId}/documents/search`](./api-reference.md#search-signers-documents) | `IDocumentListResponse` |
| `searchAsOwner(signerId, search, params?)` | [`GET /signers/{signerId}/documents/search`](./api-reference.md#search-signers-documents) with owner credentials | `IDocumentListResponse` |
| `download(signerId, documentId, artifact, accessCode?)` | [`GET /signers/{signerId}/documents/{documentId}/download/{artifact}`](./api-reference.md#download-the-document-to-sign) | `Buffer` |
| `signMultiple(documentIds, accessCode)` | [`PUT /signers/documents/sign-multiple`](./api-reference.md#sign-multiple-documents) | `unknown[]` |
| `declineMultiple(documentIds, reason, accessCode)` | [`PUT /signers/documents/decline-multiple`](./api-reference.md#decline-multiple-documents) | `unknown[]` |
| `self(accessCode)` | [`GET /signers/self`](./api-reference.md#get-current-signer) | `ISignerSelf` |
| `acceptTerms(accessCode)` | [`PUT /signers/accept-terms`](./api-reference.md#accept-terms-signer) | `ISignerTermsAcceptance \| IStatusResponse` |
| `verifyCode(payload: IVerifySignerCodePayload)` | [`POST /verify`](./api-reference.md#verify-signer-code-otp); email or WhatsApp OTP | `IEmptyResult \| IStatusResponse` |
| `verifyEmail(payload: IVerifySignerCodePayload)` | Compatibility alias for `verifyCode` | `IEmptyResult \| IStatusResponse` |
| `getIdentityVerification(accessCode)` | [`GET /signers/identity-verification`](./api-reference.md#identity-document-verification-status) | `IIdentityVerificationState` |
| `startIdentityVerification(accessCode, payload)` | [`POST /signers/identity-verification`](./api-reference.md#start-identity-document-verification) | `IIdentityVerificationSession`; payload is `{ consent: true }` |
| `startCertificate(accessCode, documentId?)` | [`POST /signers/certificate/start`](#icp-brasil-a1a3-certificates) | `ICertificateStartResponse` (`{ token: string }`) |
| `completeCertificate(accessCode, token, documentId?)` | [`POST /signers/certificate/complete`](#icp-brasil-a1a3-certificates) | `ICertificateCompleteResponse` (`{ signerName: string }`) |
| `confirmData(documentId, accessCode, payload)` | [`PUT /documents/{documentId}/signers/confirm-data`](./api-reference.md#confirm-signer-data) | `ISigner \| IEmptyResult` |
| `uploadSignature(accessCode, image, options?)` | [`POST /signature`](./api-reference.md#upload-signature-image) | `IEmptyResult \| IStatusResponse` |
| `downloadSignature(accessCode, imageType?)` | [`GET /signature/{type}`](./api-reference.md#download-signature-image) | `Buffer` |
| `getAssignment(accessCode, hasAcceptedTerms?, params?)` | [`GET /sign`](./api-reference.md#view-document-to-sign) | `ISigningDocument` |
| `sign(documentId, assignmentId, accessCode, entries)` | [`POST /documents/{documentId}/assignments/{assignmentId}`](./api-reference.md#sign-assignment-items) | `Record<string, unknown>` |
| `decline(documentId, assignmentId, accessCode, reason)` | [`PUT …/reject`](./api-reference.md#reject-decline-assignment) | `unknown[]` |

`confirmData` accepts `{ full_name?, email?, government_id?, whatsapp_phone_number?, has_accepted_terms? }`. `uploadSignature` accepts a non-empty image `Buffer` plus `{ imageType?: 'signature' | 'initial'; contentType?: string; reuse?: boolean }`. Each signing entry is `{ itemId, fieldId, pageId, value }`.

`confirmData` preflights `GET /documents/{documentId}` with the signer code: `/sign` is blocked until certificate data and terms are confirmed. `sign` and `decline` preflight `getAssignment(accessCode, undefined, { document_id: documentId })`, enabling selection of another document of the same envelope and checking the returned document/assignment IDs before writing. These methods make one additional GET request. For virtual assignments, confirm the signer's data and then call `sign(documentId, assignmentId, accessCode, [])`. Collect assignments require a non-empty array with the actual assignment item, field, and page IDs. Signing resolves to the server's assignment result; poll document details until `certificated` before downloading final artifacts.

Each request below includes `?signer-access-code=<private-access-code>`. These are complete example bodies and SDK results for production:

| Operation | Request body | SDK result |
| --- | --- | --- |
| `PUT /signers/accept-terms` | No body; submit only after the signer accepts the terms. | `{ "full_name": "Ana Lima", "email": "ana@example.com", "has_accepted_terms": true }` (`email` may be `null`) |
| `POST /verify` | `{ "verification-code": "123456" }` | `[]` |
| `PUT /documents/{documentId}/signers/confirm-data` | `{ "full_name": "Ana Lima", "email": "ana@example.com" }` | `[]` |
| `POST /signature` | Raw PNG bytes with `Content-Type: image/png`; also pass `type=signature&reuse=false` in the query. | `[]` |

An empty result is successful acknowledgement, not a signer profile. Use `self(accessCode)` afterward when you need the updated profile, terms acceptance, or signature flags. The response types retain the published status/profile alternatives without converting or fabricating response fields.

`getCurrent` accepts `{ expand: "envelope" }`; `getAssignment` additionally accepts `document_id` for another document of the same envelope. List/search params accept `envelope_id` and pagination. The API carries email/WhatsApp verification across documents of that envelope. `ISigningDocument` exposes `current_signer`, `is_signer_access_closed`, and `certified_copy`; closed links return only identity and copy state, and other signer operations return 410. Code closure occurs 30 minutes after this signer's work is done across the envelope. Assignment details contain only this signer's items, without other signers or their private links.

The legacy `download` signature is retained, but the current API permits only `original` with an access code; without one it redirects to an expired-link page, which the SDK rejects rather than following. Supplied codes get a `/signers/self` identity preflight. Use `downloadCertifiedCopy` for completed PDFs.

| SDK method | HTTP operation and request | SDK response |
| --- | --- | --- |
| `getTheme(accessCode)` | `GET /sign/theme`, no body | `IAccountTheme` |
| `downloadLogo(accessCode)` | `GET /sign/logo`, no body | Image `Buffer`; 404 if absent |
| `resendCertifiedCopy(accessCode, documentId?)` | `POST /sign/certified-copy`; no body or `{ document_id }` for an envelope document | `ICertifiedCopyResponse` |
| `downloadCertifiedCopy(token, artifact?)` | `GET /signers/downloads/{token}`; `artifact: "pades"` selects `/pades`; default `"certificated"` | PDF `Buffer` |
| `resendDownloadLink(token)` | `POST /signers/downloads/{token}/resend`, no body | `ICertifiedCopyResponse` |

Certified-copy requests deliver to the original signing contact, never an arbitrary recipient. The result is `{ available: boolean, notification_method: "Email" | "Whatsapp", sent_to: string, resends_left: number | null }`. Links last 30 minutes. Email allows one resend every two minutes and ten per 24 hours; WhatsApp allows one resend per signature request. `sent_to` is masked. See the [HTTP reference](./api-reference.md) for refusal payloads. Expired download URLs return 302, surfaced as `ApiError`; the SDK never follows the redirect. CLI `signer certified-copy`, `download-copy`, and `resend-download-link` use `ASSINAFY_SIGNER_ACCESS_CODE` or `ASSINAFY_DOWNLOAD_TOKEN`. Theme and logo need no owner credential. Protect download URLs and the resulting files as private documents.

### Email and WhatsApp verification

Assignment and template signer descriptors use the same combinations:

| `verification_method` | `notification_methods` | Signer requirement |
| --- | --- | --- |
| `Email` | `["Email"]` | Email address |
| `Whatsapp` | `["Whatsapp"]` | `whatsapp_phone_number` and an eligible paid workspace |
| `DigitalCertificate` (A1 or A3) | `["Email"]` or `["Whatsapp"]` | CPF/CNPJ in `government_id`, matching certificate, delivery contact, and the Digital Certificate workspace feature |
| `IdDocumentFaceMatchBasic` | `["Email"]` or `["Whatsapp"]` | Valid CPF in `government_id`, delivery contact, the ID Document + Face Match feature, and explicit biometric consent |

Choose one notification channel. With neither field specified, the API defaults to Email; with only one specified, it infers the other. Estimate cost before creating assignments, including those created from templates: WhatsApp notifications and certificate signatures consume credits. Each certificate signer must be alone in its signing step.

`IVerifySignerCodePayload` is `{ signerAccessCode: string; verificationCode: string }`. Keep the OTP as a string to preserve leading zeroes. Email and WhatsApp use the same verification endpoint and response; the access code identifies the channel and document.

```ts
// Optional: email a new one-time access token (email channel only; sends a message).
await client.documents.sendToken('example_document', 'signer@example.com');

// Use the private link and OTP from the selected channel's same message.
await client.signerDocuments.verifyCode({
  signerAccessCode: 'example_access_code',
  verificationCode: '012345',
}); // [] on production success
```

The token request body is `{ "channel": "email", "recipient": "signer@example.com" }` and the response data is `{ "document": { "resource": "document", "id": "example_document", "name": "Contract.pdf", "page_count": 3, "created_by": "Example User" }, "channel": "email", "recipient": "signer@example.com" }`. WhatsApp-verified signers receive their code in the WhatsApp invitation itself. Verification sends `{ "verification-code": "012345" }` with `?signer-access-code=example_access_code`; a successful envelope `{ "status": 200, "message": "", "data": [] }` resolves to `[]`. Invalid codes surface as `ApiError` with the server's status and message. `verifyEmail` remains a compatible alias. Continue with data confirmation and virtual/collect signing as described above.

### Biometric identity verification

Use `IdDocumentFaceMatchBasic` for government-ID photos, a photo of the signer holding the ID, and liveness. Create or explicitly update the signer with a valid CPF in `government_id`, estimate cost, and create the assignment with either notification channel. Assignment, template, estimate, and `uploadAndRequestSignatures` signer descriptors accept this method. The provider collects biometric data on its hosted page; these SDK endpoints do not upload biometric images.

1. Read `signerDocuments.self(accessCode)` and its `verification_method`. Present the document, terms and biometric consent to the signer.
2. Read `getIdentityVerification(accessCode)`. Start only when `can_start` is true and the signer consents, using `startIdentityVerification(accessCode, { consent: true })`.
3. Open the returned `url` exactly as received, including any `#t=` fragment. It is a private bearer link: never log it or persist it in browser storage. Read status again after capture.
4. `Pending` retains the existing capture link. Only `Expired` permits another session; `Declined` and `Abandoned` require a new document and assignment. Resending an invitation does not replace a live session; restarts do not charge a second per-signer fee.
5. `Approved` and `InReview` let the signer continue to data confirmation and virtual/collect signing. `InReview` holds certification, not signing; when everyone has signed, the document remains `pending_identity_review` until the account decides.
6. The account reads `assignments.getIdentityVerification(documentId, assignmentId, signerId)`. While `InReview`, `downloadIdentityVerificationImage(..., name)` accepts `document_front`, `document_back`, `document_pdf` or `face` from the review's `images`. It returns JPEG/PNG/PDF bytes; images return 404 after the review closes. Protect downloaded evidence under your retention policy.
7. Submit `reviewIdentityVerification(..., { decision: 'Approved' | 'Rejected', note?: string | null })`. Notes allow at most 2,000 Unicode characters, are recorded and sent to the provider, and stay hidden from the signer. Approval allows certification after all signatures and reviews complete. Rejection cancels the document as `rejected_by_user` and notifies signers and copy receivers. Writes are never retried automatically.

Signer requests and complete unwrapped responses:

```http
GET /v1/signers/identity-verification?signer-access-code=example_access_code
```

```json
{ "can_start": true, "status": null, "url": null, "expires_at": null, "completed_at": null }
```

```http
POST /v1/signers/identity-verification?signer-access-code=example_access_code
Content-Type: application/json

{ "consent": true }
```

```json
{ "id": "example_verification", "url": "https://example.com/capture#t=example_secret", "expires_at": null }
```

`status` is `Pending`, `InReview`, `Approved`, `Declined`, `Expired`, `Abandoned` or `null`. `url` is the existing capture URL only while Pending, otherwise null; `expires_at` and `completed_at` are nullable timestamps. Missing consent, a live session, invalid access codes, or unavailable features surface through the shared `ValidationError`/`ApiError` contract. Both signer methods strip owner headers.

Account GET/review responses resolve to this complete `ISignerIdentityReview` shape (all sensitive values below are synthetic):

```json
{
  "id": "example_verification",
  "status": "InReview",
  "provider": "AssinafyVerify",
  "verification_method": "IdDocumentFaceMatchBasic",
  "reason_codes": [{ "code": "NAME_MISMATCH", "description": "Name differs" }],
  "evidence_available": true,
  "expected": { "name": "Example Signer", "cpf": "00000000000" },
  "document": { "type": "CNH", "name": "Example Name", "cpf": "00000000000" },
  "matches": { "cpf": true, "name": 0.52, "birth_date": null },
  "checks": [{ "name": "name", "result": "review", "score": 0.52, "reasons": ["NAME_MISMATCH"] }],
  "images": ["document_front", "document_back", "face"],
  "ruleset_version": "example-rules",
  "evidence_sha256": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "review_note": null,
  "completed_at": null
}
```

`expected`, `document`, `matches`, `reviewed_by`, timestamps, ruleset and evidence hash can be null. `reviewed_by` becomes `{ id, name }` after a review. Unknown provider reason codes retain their descriptions. `evidence_available: false` means the provider has no summary or it has not been fetched; direct approvals expose evidence on the `signer_identity_verified` activity instead. The [published review operation](./api-reference.md#decide-signer-identity-review) gives full HTTP envelopes and error responses.

CLI: `signer identity-status`, `signer identity-start --consent`, `assignments identity-verification <documentId> <assignmentId> <signerId>`, `assignments identity-image … --name face --output evidence.bin`, and `assignments review-identity … --decision Approved|Rejected [--note ...]`. Review decisions require confirmation or `--yes`; evidence downloads require an explicit output path and `--force` to overwrite.

### ICP-Brasil A1/A3 certificates

Both A1 and A3 use `verification_method: "DigitalCertificate"`; they are not separate API method names. Assinafy's [signing documentation](https://api.assinafy.com.br/v1/docs) directs these signers to the certificate handshake. The two routes below follow the deployed [Assinafy signing application](https://app.assinafy.com.br), which supplies their request and response shapes; they are not yet OpenAPI paths and availability on other deployments may differ.

1. Create or select the signer and set their CPF/CNPJ with `signers.update(signerId, { government_id })`. An existing signer returned by `create` is reused without updating their data. Configure an eligible workspace, estimate cost, then create a `virtual` assignment with `DigitalCertificate` and one delivery channel. Use contiguous steps beginning at `1`, with each certificate signer alone in their step. The same descriptor works for template roles only when the template has no placed signer fields.
2. Obtain the private signer access code through the delivered link. Load `self` and `getAssignment` to confirm the identity and document. Present the document and terms; call `acceptTerms` only after the signer agrees.
3. Call `startCertificate(accessCode, documentId?)` and retain its operation token with that signer session.
4. On the signer's device, use an initialized Web PKI browser client to select their A1 certificate or A3 device and execute `pki.signWithRestPki({ thumbprint, token })`. Wait for its success callback. The private key, PFX password, and device PIN stay with the local certificate provider.
5. Call `completeCertificate(accessCode, token, documentId?)` with the **same operation token**, only after Web PKI succeeds. This returns the certificate signer's name. The API validates the certificate against the required CPF/CNPJ; normal `sign` and `signMultiple` do not perform certificate signing.
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
| `get(accountId, params?)` | [`GET /accounts/{accountId}`](./api-reference.md#get-account) | `IWorkspaceResponse` |
| `usage(accountId)` | `GET /accounts/{accountId}/usage`, no body | `IAccountUsage` |
| `getNotificationPolicy(accountId)` | `GET /accounts/{accountId}/notification-policy`, no body | `INotificationPolicy` |
| `updateNotificationPolicy(accountId, payload)` | `PUT /accounts/{accountId}/notification-policy` | `INotificationPolicy` |
| `getTheme(accountId)` | [`GET /accounts/{accountId}/theme`](./api-reference.md#get-account-theme) | `IAccountTheme` |
| `downloadLogo(accountId)` | [`GET /accounts/{accountId}/logo`](./api-reference.md#download-account-logo) | image `Buffer` |
| `uploadLogo(accountId, logo, options?)` | [`POST /accounts/{accountId}/logo`](./api-reference.md#upload-account-logo) | `IStatusResponse` |
| `deleteLogo(accountId)` | [`DELETE /accounts/{accountId}/logo`](./api-reference.md#delete-account-logo) | `IStatusResponse` |
| `stats(accountId, params?)` | [`GET /accounts/{accountId}/stats`](./api-reference.md#account-document-kpis) | `IDocumentStatsRow[]` |
| `update(accountId, payload)` | [`PUT /accounts/{accountId}`](./api-reference.md#update-account) | `IWorkspaceResponse` |
| `delete(accountId, { force? }?)` | [`DELETE /accounts/{accountId}`](./api-reference.md#delete-account) | `IEmptyResult` (`unknown[]`) |

Create/update payloads use `name` and `notification_sender_type?: 'User' | 'Account'`; legacy color fields remain accepted for compatibility. List/detail responses include `resource`, `id`, `name`, nullable colors, `notification_sender_type`, roles, delete permission, and `created_at`. `IAccountTheme` is `{ account_name; primary_color; secondary_color: string | null; logo: string | null }`. Logo options are `{ fileName?, contentType? }`. Statistics params are `{ granularity?: 'monthly' | 'daily'; month?: 'YYYY-MM' }`; `month` is required for daily data.

`get(accountId, { expand: "signing_features" })` adds the available verification, notification and Embed features. `usage` returns `{ plan: string | null, documents_renewal_date: string | null, balances: { documents: { balance: number | null, limit: number | null, spent: number }, credits: { balance: number | null, limit: number | null, spent: number } } }`. Treat null balances as unlimited. These reads are also CLI `workspaces get <id> --expand signing_features` and `workspaces usage <id>`. Usage is unavailable to third-party OAuth application tokens.

Notification policy GET returns `{ editable: boolean, owners_receive_all: boolean, events: INotificationPolicyEvents }`. PUT accepts a non-empty partial `{ owners_receive_all?: boolean, events?: Partial<INotificationPolicyEvents> }`; omitted settings stay unchanged and explicit false disables that setting. The 16 event keys are the union of the email and push preference keys below. Only owners may edit. Workspace false overrides a user's preference, while `owners_receive_all` still respects each owner's preferences. Identity review email is always sent; the corresponding policy key affects only push. CLI `workspaces notification-policy update example_account --data '{"owners_receive_all":false,"events":{"SignerViewed":false}}'` sends that exact body.

OAuth `account:read` permits workspace statistics; user statistics still require an endpoint-supported owner or first-party credential.

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
| `getPushPreferences()` | `GET /users/self/push-preferences`, no body | `IPushPreferences` |
| `updatePushPreferences(payload)` | `PUT /users/self/push-preferences` | `IPushPreferences` |
| `getNotificationPreferences()` | [`GET /users/self/notification-preferences`](./api-reference.md#get-my-notification-preferences) | `INotificationPreferences` |
| `updateNotificationPreferences(payload)` | [`PUT /users/self/notification-preferences`](./api-reference.md#update-my-notification-preferences) | `INotificationPreferences` |

`IUserSelfResponse` accepts the published user object and the compatible `{ user, accounts }` envelope. Preference payloads are a non-empty partial mapping of the exported `NOTIFICATION_PREFERENCE_CODES` to booleans. The production OpenAPI publishes these routes; a lagging sandbox deployment may return route-level 404s for statistics/preferences.

Email keys: `DocumentCompleted`, `SignerDeclined`, `DocumentCancelled`, `DocumentAboutToExpire`, `DocumentExpired`, `DocumentExpirationReset`, `DocumentProcessingFailed`, `TemplateProcessingFailed`, `SignerWhatsappFailed`, `ContractRenewalNotice`, `ContractExpiring`, `ContractExpired`, `ContractRenewed`. Push keys (`PUSH_PREFERENCE_CODES`): `SignerViewed`, `SignerSigned`, `DocumentCompleted`, `SignerDeclined`, `DocumentAboutToExpire`, `DocumentExpired`, `SignerIdentityReviewRequired`, `SignerWhatsappFailed`.

Push reads/writes return all eight booleans. Update accepts a non-empty partial map, for example `{ "SignerViewed": false }`; CLI `users push-preferences update --set '{"SignerViewed":false}'` sends that body. These are user phone preferences, separate from email. Delivery also requires the mobile app's device registration; this Node SDK does not manage devices or implement a mobile client. OAuth application tokens cannot access user preferences; use endpoint-supported owner/first-party authentication.

## Authentication (`client.auth`)

| SDK method | HTTP operation | Request / result |
| --- | --- | --- |
| `login(email, password)` | [`POST /login`](./api-reference.md#login) | `{ email, password }` → `ILoginResponse \| IMfaChallengeResponse` |
| `socialLogin({ provider, token, has_accepted_terms })` | [`POST /authentication/social-login`](./api-reference.md#social-login) | Google token → `ILoginResponse` |
| `linkSocialLogin({ provider, token })` | [`POST /auth/link-social-login`](./api-reference.md#link-social-login) | Google token → `IStatusResponse` |
| `changePassword({ email, password, new_password })` | [`PUT /authentication/change-password`](./api-reference.md#change-password) | `{ email }` |
| `requestPasswordReset(email)` | [`PUT /authentication/request-password-reset`](./api-reference.md#request-password-reset) | `{ email }` |
| `resetPassword({ email, token?, new_password })` | [`PUT /authentication/reset-password`](./api-reference.md#reset-password) | `{ email }` |
| `createApiKey(password)` | [`POST /users/api-keys`](./api-reference.md#create-api-key) | `IApiKeyResponse` |
| `getApiKey()` | [`GET /users/api-keys`](./api-reference.md#get-api-key) | `IMaskedApiKeyResponse`; 404 means no key |
| `deleteApiKey()` | [`DELETE /users/api-keys`](./api-reference.md#delete-api-key) | `IEmptyResult` (`unknown[]`) |
| `verifyMfa({ mfa_token, code })` | [`POST /authentication/mfa/verify`](./api-reference.md#complete-a-two-factor-login) | `IMfaVerifyPayload` → `ILoginResponse` |
| `listMfaMethods()` | [`GET /users/self/mfa`](./api-reference.md#list-two-factor-methods) | `IMfaStatus` (`{ methods, recovery_codes_remaining }`) |
| `startTotpEnrollment(label?)` | [`POST /users/self/mfa/totp`](./api-reference.md#start-authenticator-enrollment) | `{ label? }` → `ITotpEnrollment` (`{ id, secret, provisioning_uri }`) |
| `confirmTotpEnrollment({ id, code, password?, reauth_code? })` | [`PUT /users/self/mfa/totp/confirm`](./api-reference.md#confirm-authenticator-enrollment) | `ITotpConfirmPayload` → `IMfaRecoveryCodes` |
| `regenerateRecoveryCodes({ password?, code? })` | [`POST /users/self/mfa/recovery-codes`](./api-reference.md#regenerate-recovery-codes) | `IMfaReauthPayload` → `IMfaRecoveryCodes` |
| `removeMfaMethod(methodId, { password?, code? })` | [`DELETE /users/self/mfa/{methodId}`](./api-reference.md#remove-a-two-factor-method) | JSON body `IMfaReauthPayload` → `{ is_mfa_enabled }` |

### Two-factor authentication

When the user has a confirmed authenticator, `login` returns `IMfaChallengeResponse` (`{ mfa_token: string }`) instead of `ILoginResponse` (`{ access_token, user, accounts }`). The challenge has no session fields; narrow the result before reading them. Exchange it within 5 minutes, once, with a 6-digit authenticator code or a recovery code:

```ts
let session = await client.auth.login('user@example.com', password);
if (!session.access_token && session.mfa_token) {
  session = await client.auth.verifyMfa({ mfa_token: session.mfa_token, code: '123456' });
}
```

Enrollment is `startTotpEnrollment` (show `provisioning_uri` as a QR code; the secret is returned only once) followed by `confirmTotpEnrollment({ id, code })`, which returns ten one-time recovery codes. Replacing a confirmed method also needs `password` or `reauth_code`. `regenerateRecoveryCodes` and `removeMfaMethod` require the current password or a live/recovery `code`; the SDK rejects a payload with neither before sending. `verifyMfa` strips owner credentials.

Login/social/reset/two-factor-verify bootstrap calls can use an unauthenticated client. The published authenticated user endpoints permit either a bearer JWT or `X-Api-Key`; use the credential type appropriate to the account and endpoint policy.

## OAuth (`client.oauth`)

| SDK method | HTTP operation / behavior | Resolves to |
| --- | --- | --- |
| `metadata()` | [`GET /.well-known/oauth-protected-resource`](./api-reference.md#oauth-20-protected-resource-metadata), at the API origin outside `/v1` | `IOAuthProtectedResource` |
| `discovery(issuer)` | `GET {issuer}/.well-known/oauth-authorization-server`; requires HTTPS and matching issuer | `IOAuthAuthorizationServer` |
| `authorize({ clientId, redirectUri, scopes })` | Discover resource/server and generate a fresh S256 verifier, state, and optional OIDC nonce | `IOAuthAuthorizationRequest` |
| `exchangeCode(callbackUrl, request, clientSecret?)` | Validate callback URI/state/issuer and submit the authorization code | `IOAuthTokenResponse` |
| `token(payload)` | [`POST /oauth/token`](./api-reference.md#exchange-a-code-refresh-token-or-subject-token-for-an-access-token), with code, refresh, or `urn:ietf:params:oauth:grant-type:token-exchange` grant (internal-service confidential clients only; requires `client_secret`, `resource`, `subject_token`, and `subject_token_type: urn:ietf:params:oauth:token-type:access_token`; issues no refresh token) | `IOAuthTokenResponse` |
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

Published create payload: `{ type: string; name: string; regex?; is_required? }`. Published update payload: `{ name?; regex?: string | null; is_active? }`. The SDK retains create-time `is_active` and update-time `type`/`is_required` as compatibility extensions. List params are `{ include_inactive?, include_standard? }`. Validation options are `{ signerAccessCode?, accountId? }`; multiple entries are `{ field_id, value }[]`. When a signer code is supplied, the SDK removes any configured owner API-key/bearer headers from that request. An explicitly empty or blank code raises `ValidationError` before any request; omit the option for owner-authenticated validation.

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

An account can register 1 webhook endpoint, or up to 3 on paid plans. Each endpoint has its own URL, events, active flag, and signing setting; every active endpoint subscribed to an event receives it independently. The `subscriptions` operations remain and act on the account's oldest endpoint.

| SDK method | HTTP operation | Resolves to |
| --- | --- | --- |
| `listEndpoints(accountId?, params?)` | [`GET /accounts/{accountId}/webhooks/endpoints`](./api-reference.md#list-webhook-endpoints), with optional `{ url: string }` exact-match filter | `IWebhookEndpoint[]`, oldest first |
| `createEndpoint(payload, accountId?)` | [`POST /accounts/{accountId}/webhooks/endpoints`](./api-reference.md#create-webhook-endpoint) | `IWebhookEndpointCreatePayload` → `IWebhookEndpointCreateResponse` (endpoint plus optional `secret`) |
| `getEndpoint(endpointId, accountId?)` | [`GET /accounts/{accountId}/webhooks/endpoints/{endpointId}`](./api-reference.md#get-webhook-endpoint) | `IWebhookEndpoint` |
| `updateEndpoint(endpointId, payload, accountId?)` | [`PUT /accounts/{accountId}/webhooks/endpoints/{endpointId}`](./api-reference.md#update-webhook-endpoint) | `IWebhookEndpointUpdatePayload` → `IWebhookEndpointUpdateResponse` |
| `deleteEndpoint(endpointId, accountId?)` | [`DELETE /accounts/{accountId}/webhooks/endpoints/{endpointId}`](./api-reference.md#delete-webhook-endpoint) | `IEmptyResult` (`[]`) |
| `deleteEndpointByUrl(url, accountId?)` | [`DELETE /accounts/{accountId}/webhooks/endpoints?url=…`](./api-reference.md#delete-webhook-endpoint-by-url) | `IEmptyResult` (`[]`); exact registered URL required |
| `getEndpointSecret(endpointId, accountId?)` | [`GET /accounts/{accountId}/webhooks/endpoints/{endpointId}/secret`](./api-reference.md#get-webhook-endpoint-signing-secret) | `IWebhookEndpointSecret` (`{ secret }`) |
| `rotateEndpointSecret(endpointId, accountId?, options?)` | [`POST /accounts/{accountId}/webhooks/endpoints/{endpointId}/secret/rotate`](./api-reference.md#rotate-webhook-endpoint-signing-secret) | `IWebhookEndpointSecret` |
| `register(payload, accountId?)` | [`PUT /accounts/{accountId}/webhooks/subscriptions`](./api-reference.md#update-webhook-subscription) | `IWebhookSubscription` (oldest endpoint) |
| `get(accountId?)` | [`GET /accounts/{accountId}/webhooks/subscriptions`](./api-reference.md#get-webhook-subscription) | `IWebhookSubscription | null` |
| `inactivate(accountId?)` | [`PUT /accounts/{accountId}/webhooks/inactivate`](./api-reference.md#inactivate-webhook-subscription) | `IWebhookSubscription` |
| `listEventTypes()` | [`GET /webhooks/event-types`](./api-reference.md#list-webhook-event-types) | `IWebhookEventTypeInfo[]` |
| `listDispatches(params?, accountId?)` | [`GET /accounts/{accountId}/webhooks`](./api-reference.md#list-webhook-deliveries) | `PaginatedResult<IWebhookDispatch>` |
| `testEndpoint(endpointId, accountId?)` | `POST /accounts/{accountId}/webhooks/endpoints/{endpointId}/test`, no body | `IWebhookDispatch` |
| `retryDispatch(dispatchId, accountId?)` | [`POST /accounts/{accountId}/webhooks/{dispatchId}/retry`](./api-reference.md#retry-webhook-delivery) | `IWebhookDispatch` |

Endpoint payload: `{ url: string; email: string; events?: string[]; name?: string; is_active?: boolean; signing_enabled?: boolean }`. Update sends only the given fields and requires at least one. New or changed URLs must be HTTPS and unique within the workspace (`400`); legacy HTTP URLs remain usable for exact lookup/deletion; creating past the plan limit returns `403`. Enabling signing creates a `whsec_` secret if none exists; disabling it discards the secret. Secret read and rotation return `400` when signing is disabled. OAuth applications cannot read an existing secret, but `webhooks:write` permits rotation; rotation invalidates the previous secret immediately unless `{ keep_previous: true }` is passed. That option signs deliveries with both secrets for 24 hours and returns `previous_secret_expires_at`; another rotation replaces the one retained secret. CLI `rotate-secret --keep-previous` exposes the overlap. `testEndpoint` sends a synthetic event to the registered receiver and records its delivery; it is a write, not a connectivity read. CLI: `webhooks endpoints test <endpointId>`. Dispatches include `duration_ms` when measured.

```ts
const endpoint = await client.webhooks.createEndpoint({
  url: 'https://example.com/assinafy/webhooks',
  email: 'ops@example.com',
  name: 'ERP',
  events: ['document_ready', 'signer_signed_document'],
  signing_enabled: true,
});
const { secret } = endpoint;
// Store `secret` in your receiver's secret manager.
```

When signing is enabled, endpoint creation returns `secret` once, including to OAuth applications. Enabling signing on an existing endpoint also returns its new secret once (`IWebhookEndpointUpdateResponse`); list/get responses omit it. OAuth applications can rotate a lost secret with `webhooks:write`. The CLI prints returned secrets in human and JSON output; store that output securely. `webhooks endpoints list --url <url>` and `delete-by-url --url <url> [--yes]` match the exact registered URL, including its query string. Deletion returns 404 if no endpoint matches. Existing endpoint-ID and subscription methods remain supported.

Registration payload: `{ url: string; email: string; events?: string[]; is_active?: boolean }`. When `events` is omitted on `register` or `createEndpoint`, the SDK uses `document_ready`, `document_prepared`, `signer_signed_document`, `signer_rejected_document`, and `document_processing_failed`; pass `[]` deliberately for none. Dispatch filters extend pagination with `{ endpoint_id?, event?, delivered?, from?, to?, sort?: 'created_at' | '-created_at' }`; sort is a compatibility extension. Dispatch records include `endpoint_id`. Dispatch `search` is unsupported and rejected locally. Retrying re-sends only to that entry's endpoint and requires the endpoint to be active. There is no delete-subscription operation; delete a specific endpoint with `deleteEndpoint` or deactivate the oldest with `inactivate`.

Decline operations require a non-empty reason of at most 2,000 Unicode characters. `signers.findByEmail` follows pagination metadata until an exact case-insensitive email match is found or the search is exhausted; when a response carries no pagination metadata a partial page ends the search, and the scan is bounded at 100 pages.

Biometric identity status can be read with OAuth `documents:read`. Evidence downloads and review decisions are unavailable to OAuth applications; use the supported owner credential for those operations. CLI downloads create and replace files with owner-only POSIX permissions (`0600`).

## Responses, pagination, errors, and binary data

- JSON responses with `data` are unwrapped from the API envelope; direct status bodies remain `IStatusResponse`. Paginated calls resolve to `{ data: T[]; meta?: { current_page?, last_page?, per_page?, total? } }`; metadata comes from `X-Pagination-*` headers.
- Binary methods resolve to Node.js `Buffer`; the SDK is not a browser package. It never writes downloaded data to disk.
- `ValidationError` means local input validation failed before a request. `ApiError` exposes `statusCode`, `responseData`, `wwwAuthenticate`, `retryAfter` and `rateLimit` (`{ limit?, remaining?, reset? }` from `X-Rate-Limit-*`); a `429` carries `Retry-After` seconds to wait before retrying, and the SDK never retries automatically. OAuth errors use `error: error_description` as the message; binary JSON error bodies are decoded before normalization. OAuth responses are flat JSON, and OAuth revocation resolves to `undefined`. `NetworkError` covers timeout/DNS/transport failures. `PartialWorkflowError` reports `documents upload --wait` or a multi-step helper that failed after creating resources and exposes `documentId` and `signerIds`. All extend `AssinafyError`, which exposes `context` and preserves `cause` where available.
- `normalizeBaseUrl(url)` is exported and removes one trailing slash. The CLI-facing guards `requireDocumentArtifactName(name)` and `requireSignerImageType(type)` are also exported.

Exported error constructors/helpers are `new AssinafyError(message, context?, { cause? }?)`, `new ApiError(message, statusCode, responseData?, { cause?, wwwAuthenticate?, retryAfter?, rateLimit? }?)`, `ApiError.fromResponse(statusCode, responseData, headers?)`, `new ValidationError(message?, errors?)`, `new NetworkError(message, { cause? }?)`, and `new PartialWorkflowError(message, { documentId?, signerIds? }, { cause? }?)`. Resource classes and all named request/response types are also exported for dependency injection and type annotations; normal applications should obtain resource instances from `AssinafyClient`.

```ts
try {
  await client.documents.get('document-id');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.statusCode, error.responseData);
  }
}
```

## Webhook verification

Deliveries are `POST` requests with `Content-Type: application/json`, a `webhook-id` (stable across retries of the same event to the same endpoint; use it to deduplicate), a `webhook-timestamp` (Unix seconds), and, when the endpoint has `signing_enabled`, a `webhook-signature` following [Standard Webhooks](https://www.standardwebhooks.com). Any `2xx` is success. Connection failures, timeouts, `408`, `429` and `5xx` are retried up to six total attempts, about ten minutes apart; other statuses are final. Ten consecutive failed deliveries pause the endpoint. Probes run after 3, 15 and 60 minutes, then every six hours; a successful probe resumes missed events oldest first. Editing the URL or setting `is_active: true` also clears the pause. `retryDispatch` sends a manual attempt even while paused. `IWebhookEndpoint` and `IWebhookSubscription` expose `is_held`/`held_since`; dispatches include `webhook_id`, `attempt`, `kind` and `will_retry`. Delivery history is kept for seven days.

| API | Result |
| --- | --- |
| `new WebhookVerifier(secret?, { algorithm?, encoding? }?)` | Verifier keyed with an endpoint's `whsec_` secret. The options apply only to the deprecated `verify`. |
| `verifyDelivery(rawBody, headers, { toleranceSeconds?, now? }?)` | `boolean`. Checks `v1` HMAC-SHA256 over `{webhook-id}.{webhook-timestamp}.{rawBody}` with the base64-decoded secret, constant-time, against every space-separated signature entry, and rejects timestamps more than `toleranceSeconds` (default 300) from `now` (ms, default `Date.now()`). `headers` may be Node `IncomingHttpHeaders`, a plain record (case-insensitive), or Fetch `Headers`; repeated headers are rejected. |
| `verify(rawBody, signature)` | Deprecated body-only HMAC kept for existing callers; Assinafy deliveries do not use it. |
| `extractEvent(rawBody)` | Parsed `IWebhookPayload`, or `null` for invalid JSON/non-object data. |
| `getEventType(event)` | `event`/`type` string, or `null`. |
| `getEventData(event)` | First object found at `payload`, `data`, or `object`; otherwise `{}`. |

`client.webhookVerifier` uses the `webhookSecret` client option. Each endpoint has its own secret, so construct one verifier per signed endpoint.

```ts
import express from 'express';
import { WebhookVerifier } from '@assinafy/cli/api';

const verifier = new WebhookVerifier(process.env.ASSINAFY_WEBHOOK_SECRET);
const app = express();

app.post('/assinafy/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verifier.verifyDelivery(req.body, req.headers)) return res.sendStatus(401);
  const event = verifier.extractEvent(req.body);
  // Deduplicate by req.headers['webhook-id'], enqueue the work, and answer quickly.
  res.sendStatus(204);
});
```

Verify the raw bytes before parsing; re-serialized JSON does not match. The envelope is `{ id, event, message, payload, origin, created_at, subject, object, account_id }`; `subject` and `object` carry a `type` of `User`, `Signer`, `Account`, `Document`, or `Template`. Unknown fields are forward-compatible additions. Confirm business state (for example a document's status) through the API before irreversible actions.

## Contract boundaries

- Production OpenAPI currently publishes 147 operations. Some sandbox deployments lag it; account/user statistics and user notification-preference routes may return route-level 404s even though production documentation includes them.
- Certificate start/complete are deployed production extensions, exposed by `startCertificate` and `completeCertificate` with the signing application's payloads. They supplement the 147 OpenAPI operations; the API manifest contains only published paths.
- The SDK retains the two template compatibility routes above. Both `sendToken` call forms send the email-only production body.
- Original signer artifacts require a signer code. Completed copies use private expiring download tokens. Older download call forms remain callable for compatibility; server authorization and lifecycle rules apply.
