# @assinafy/cli

*[Leia em português](README.md) · English*

The official command-line interface and Node.js SDK for the [Assinafy API](https://api.assinafy.com.br/v1/docs), a Brazilian digital-signature platform. Upload PDFs, manage signers, request signatures, track the audit trail, and download certified documents — from a terminal, a shell script, or an application.

The CLI is a single self-contained executable. It prints human-readable tables by default and structured JSON with `--json`, so the same commands serve both interactive use and automation. The same package exposes a fully typed SDK at `@assinafy/cli/api` covering all 93 published API operations.

This document reads top to bottom: install, authenticate, send your first signature request, then understand the model well enough to automate it. The [command reference](#command-reference) and [SDK](#nodejs-sdk) sections near the end are lookup tables you can jump to once the flow makes sense.

## Contents

1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Authentication](#authentication)
4. [Quick start](#quick-start)
5. [How signing works](#how-signing-works)
6. [The complete owner workflow](#the-complete-owner-workflow)
7. [The signer side](#the-signer-side)
8. [Webhooks](#webhooks)
9. [Output and scripting](#output-and-scripting)
10. [Configuration](#configuration)
11. [Command reference](#command-reference)
12. [Node.js SDK](#nodejs-sdk)
13. [Security](#security)
14. [Development](#development)
15. [Release](#release)
16. [Contract boundaries](#contract-boundaries)
17. [License](#license)

## Requirements

- Node.js `>=22.12.0`. Node.js 24 LTS is recommended and is what CI publishes with; CI also tests 22 and 26.
- HTTPS with TLS 1.2 or higher to reach the Assinafy API; supported Node.js versions use that minimum by default.
- An Assinafy account and an API key (see [Authentication](#authentication)).
- Linux, macOS, or Windows. Release archives ship for `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, `windows-x64`, and `windows-arm64`.

## Installation

### From npm

```bash
npm install -g @assinafy/cli@<version>
assinafy --help
```

Pin `@<version>` in anything reproducible; omit it only when you deliberately want the newest published release.

### From a GitHub release

Download and read the installer from the same immutable version tag you are installing, then run it:

```bash
ASSINAFY_VERSION=vX.Y.Z # replace with a published release tag
curl -fsSLo assinafy-install.sh \
  "https://raw.githubusercontent.com/assinafy/assinafy-cli/${ASSINAFY_VERSION}/install.sh"
less assinafy-install.sh
bash assinafy-install.sh "$ASSINAFY_VERSION"
```

Windows PowerShell:

```powershell
$Version = 'vX.Y.Z' # replace with a published release tag
Invoke-WebRequest "https://raw.githubusercontent.com/assinafy/assinafy-cli/$Version/install.ps1" -OutFile .\assinafy-install.ps1
Get-Content .\assinafy-install.ps1
& .\assinafy-install.ps1 -Version $Version
```

The installers fetch the matching release archive and verify it against that release's `SHA256SUMS` before replacing the executable. They install to `~/.assinafy/bin`; set `ASSINAFY_INSTALL` to choose another directory, or `ASSINAFY_NO_PATH_UPDATE=1` to leave `PATH` untouched.

### Without installing

```bash
npx @assinafy/cli whoami
```

## Authentication

Use an API key for direct owner integrations, OAuth for customer-consented marketplace connections, or a user JWT for user-session operations.

| Credential | Header sent | Use it for |
| --- | --- | --- |
| API key | `X-Api-Key: <key>` | Direct owner integrations and permitted account operations. |
| OAuth access token | `Authorization: Bearer <token>` | Marketplace connections, limited to granted scopes and one workspace. |
| User JWT | `Authorization: Bearer <jwt>` | User sessions and permitted account operations. |

Generate an API key from the Assinafy dashboard, or from the CLI with an existing session:

```bash
assinafy auth login you@example.com          # returns a JWT
assinafy auth api-keys create --token <jwt>  # generates (and rotates) the key
```

Store the key once, then confirm it works:

```bash
assinafy login    # prompts for the API key and default workspace ID
assinafy whoami   # lists the workspaces the credential can reach
```

`whoami` lists accessible workspaces and validates the credential and base URL. Confirm that your configured account ID appears in that list. Most commands are workspace-scoped, so set a default account ID during `login` (or pass `--account-id` per command) to avoid repeating it.

Credentials resolve with a fixed precedence — **CLI flag → environment variable → config file** — which is covered in full under [Configuration](#configuration).

### OAuth marketplace connections

The CLI includes the official application's public client ID and uses PKCE S256 without a client secret. Automatic browser return uses this exact HTTPS redirect URI, without an extension or trailing slash, served by `integrations-generic-callback`:

```text
https://integrations.assinafy.com.br/assinafy-cli/oauth-callback
```

The CLI requests all ten published scopes by default: `account:read documents:read documents:write templates:read templates:write webhooks:write openid profile email offline_access`, including template read/write access and `webhooks:write` for the webhook write commands. The application registration must permit all ten; existing connections need fresh consent to gain additional permissions. An explicit `--scope` requests a smaller set.

No `ASSINAFY_OAUTH_CLIENT_ID` configuration is needed for the official application. For your own application or another environment, use `--client-id` or that variable; the flag takes precedence. Register the callback URI and scopes for the selected application. In a private directory outside the repository:

```bash
umask 077
assinafy oauth connect --json > tokens.json
unset ASSINAFY_API_KEY
export ASSINAFY_TOKEN="$(jq -er '.access_token' tokens.json)"
assinafy workspaces list --json
```

The command opens the system browser and waits for consent. The HTTPS return page forwards the authorization response to a temporary listener on `127.0.0.1`. The CLI validates state and issuer, closes the listener, and exchanges the code using its local PKCE verifier. Use a browser on the same computer as the CLI. Tokens travel directly between the CLI and Assinafy.

Return pages use the visual identity hosted at `integrations.assinafy.com.br` and distinguish a received response, failed authorization, and an invalid return. Check the final result in your terminal. If it reports `invalid_scope`, verify the application's registered permissions, including `offline_access`.

Use `--no-browser` to open the URL printed to stderr manually while keeping automatic callback reception. `--timeout` sets the browser wait from 1 to 600 seconds (default 180), `--scope` selects permissions, and `--redirect-uri` selects another registered HTTPS page implementing the relay protocol. Ctrl+C cancels the wait. Token JSON goes to stdout; protect it from logs. `connect` does not modify a profile or automatically refresh tokens.

Select the single workspace returned and set `ASSINAFY_ACCOUNT_ID`. Keep refreshes serialized per connection and store each rotated result atomically. The existing `oauth authorize` and `oauth exchange` commands also support applications with their own callbacks and confidential server credentials. The [OAuth guide](./docs/oauth-guide.md#cli-flow) documents both flows, complete payloads, token rotation, identity validation, and disconnect behavior.

## Quick start

```bash
assinafy send contract.pdf \
  --signer "Ana Lima <ana@example.com>" \
  --signer "Bruno Souza <+5548999990000>" \
  --message "Please sign this contract"
```

`send` is the whole happy path in one command: it uploads the PDF, waits for the platform to finish processing it, creates or reuses each signer, and creates the signature assignment that sends out the invitations. A signer given only a phone number defaults to WhatsApp verification and notification; otherwise the platform's own defaults apply. Pass `--signers '<json>'` to set them explicitly.

It prints the document ID, the assignment ID, and the signer IDs — the three handles every later command needs.

If a step fails after the upload, the error names the document and signers that were created or reused, so nothing is left orphaned in your workspace without a handle:

```text
error: Saldo insuficiente. (document doc_abc123 exists; 2 signer(s) created or reused)
  (HTTP 402)
```

Under `--json` the same information is machine-readable in `error.details`.

## How signing works

Four resources make up the model:

- **Document** — an uploaded PDF. It moves through `uploading` → `uploaded` → `metadata_processing` → `metadata_ready`, then `pending_signature` once an assignment exists, and finally `certificating` → `certificated`. Terminal failure states are `expired`, `failed`, `rejected_by_signer`, and `rejected_by_user`. Run `assinafy documents statuses` for the authoritative list and which states allow deletion.
- **Signer** — a person in your workspace, identified by name plus an email address and/or a WhatsApp number. Signers are reusable across documents, and creating one with an email address that already exists reuses the existing record rather than duplicating it.
- **Assignment** — the request that binds signers to a document and sends the invitations. `--method virtual` (the default) collects signatures; `--method collect` also gathers custom field values and requires `--entries` describing where each field sits on the page.
- **Artifact** — the downloadable output. `original` is what you uploaded; `certificated` is the signed PDF; `certificate-page` is the signature-certificate sheet; `pades` is the PAdES-conformant PDF; `bundle` is a ZIP of everything. Only `original` exists before signing completes.

Two side notes worth knowing before you script anything:

- Processing is asynchronous. Wait for `metadata_ready` with `documents upload --wait` or `documents wait` before referencing pages in a collect assignment. Virtual assignments can also be submitted during processing. The `document_ready` webhook signals the last signature, not initial upload processing.
- Assignments cost credits. `assignments estimate-cost` and `documents estimate-template-cost` tell you the price, your balance, and any blocking reason before you commit.

## The complete owner workflow

`send` is the shortcut. When you need explicit control over signing order, verification methods, tags, or expiration, run the steps yourself:

```bash
# 1. Create (or find) each signer. Creation is idempotent by email address.
SIGNER_ID=$(assinafy signers create \
  --name "Ana Lima" --email ana@example.com --json | jq -r '.id')

# 2. Upload the PDF and wait for the platform to finish processing it.
DOCUMENT_ID=$(assinafy documents upload contract.pdf \
  --name "Service agreement" --wait --json | jq -r '.id')

# 3. Check the price before spending credits.
assinafy assignments estimate-cost "$DOCUMENT_ID" --signer-ids "$SIGNER_ID" --json

# 4. Request the signatures. This is what sends the invitations.
assinafy assignments create "$DOCUMENT_ID" \
  --signer-ids "$SIGNER_ID" \
  --message "Please review and sign" \
  --expires-at "2026-12-31T23:59:59Z"

# 5. Track it.
assinafy documents progress "$DOCUMENT_ID" --json
assinafy documents activities "$DOCUMENT_ID" --json

# 6. Collect the record once every signer has completed.
assinafy documents download "$DOCUMENT_ID" --artifact certificated -o signed-contract.pdf
assinafy documents download "$DOCUMENT_ID" --artifact bundle -o signed-contract-bundle.zip
```

For ordered signing or mixed verification methods, replace `--signer-ids` with `--signers` and pass the full objects:

```bash
assinafy assignments create "$DOCUMENT_ID" --signers '[
  {"id":"sig_1","verification_method":"Email","notification_methods":["Email"],"step":1},
  {"id":"sig_2","verification_method":"Whatsapp","notification_methods":["Whatsapp"],"step":2}
]'
```

Steps must form a contiguous sequence starting at `1`, and a `DigitalCertificate` signer must be alone in its step — both are validated locally before the request is sent. `--copy-receivers` takes **signer IDs** (people who only receive a copy of the finished document), not arbitrary email addresses.

Email verification uses `["Email"]` notifications; WhatsApp uses `["Whatsapp"]`. ICP-Brasil A1 and A3 both use `DigitalCertificate`, with either delivery channel, a matching CPF/CNPJ in `government_id`, an eligible workspace, and sufficient credits. Select one notification channel per signer. These same options work for template roles. A1/A3 signing uses `startCertificate`, the signer's local Web PKI operation, and `completeCertificate`; [complete payloads and the signing sequence](docs/sdk-reference.md#icp-brasil-a1a3-certificates) are in the SDK reference.

In production, `notification_methods: []` defaults to `['Email']` and sends an invitation. Select the intended channel explicitly; an empty array does not disable notifications.

To start from a saved template instead of a PDF:

```bash
assinafy templates list --json
assinafy documents create-from-template tmpl_123 --signers '[
  {"role_id":"role_1","id":"sig_1","verification_method":"Email","notification_methods":["Email"]}
]' --name "Q1 NDA"
```

If a signer needs chasing, `assignments resend <documentId> <assignmentId> <signerId>` re-sends their invitation (priced by `assignments estimate-resend-cost`), and `assignments reset-expiration` moves the deadline.

Keep the certified PDF, the certificate page, the bundle, and the `documents activities` output together as the document record. Delete only disposable documents, and only once their retention obligations are satisfied.

## The signer side

Signers do not use your API key. The `assinafy signer` commands use a private **access code** from the signing verification link. For email verification, use the link and six-digit code from the same email; an invitation containing only a document ID and recipient does not contain this credential. Confirm the signer and document before submitting a decision:

```bash
export ASSINAFY_SIGNER_ACCESS_CODE=<code-from-the-verification-link>

assinafy signer self                              # who the code belongs to
assinafy signer assignment                        # the document as the signer sees it
assinafy signer accept-terms
assinafy signer upload-signature --file signature.png
assinafy signer sign <documentId> <assignmentId> --entries '[
  {"itemId":"item_1","fieldId":"field_1","pageId":"page_1","value":"..."}
]'
```

Where email or WhatsApp verification is configured, the signer also confirms a 6-digit code. `documents send-token <documentId> --recipient <email> --channel email` sends it by email; use `--recipient <phone> --channel whatsapp` for WhatsApp. Both use `signer verify-code`; `verify-email` remains an alias. Set `ASSINAFY_VERIFICATION_CODE` to keep the OTP out of command arguments and preserve leading zeroes. `signer decline` (or `decline-multiple`) rejects with a reason, and `sign-multiple` completes several documents in one call.

For A1/A3 certificates, use Assinafy's hosted signing page or integrate Web PKI with the SDK. After document review and terms acceptance, `signer certificate-start --json` returns `{ "token": "..." }`. Have the browser sign that operation on the signer's device, then set `ASSINAFY_CERTIFICATE_TOKEN` to the same token and run `signer certificate-complete --json`; it returns `{ "signerName": "..." }`. Private keys and passwords/PINs stay on the device. Wait for `certificated` status and download `--artifact pades` or `bundle`. The ordinary `sign` command does not perform this handshake. These two production routes use the signing application's payloads and are not yet OpenAPI paths.

Verification, data confirmation, and signature upload may return `[]` on success. Fetch `signer self` for the updated profile and check document progress and certified artifacts after signing. Full request and response examples are in the [signer SDK reference](docs/sdk-reference.md#signer-side-flows-clientsignerdocuments).

For a virtual assignment, confirm the signer's data and submit an empty entry array:

```bash
assinafy signer confirm-data <documentId> --full-name 'Ana Lima' --email ana@example.com
assinafy signer sign <documentId> <assignmentId> --entries '[]'
```

Single-document confirmation, signing, and decline commands verify that the access code matches the requested document and assignment before writing.

Owner API credentials are stripped from every public and signer-side request, so an access-code flow can never leak your workspace key. The published signer artifact download is public; passing `--access-code` adds an identity preflight that confirms the code belongs to the signer being downloaded for.

## Webhooks

Polling works, but webhooks are the right way to react to signing events:

```bash
assinafy webhooks event-types                       # what the platform can send
assinafy webhooks register \
  --url https://example.com/hooks/assinafy \
  --email ops@example.com \
  --events document_ready,signer_signed_document,signer_rejected_document

assinafy webhooks dispatches --delivered false      # what failed to deliver
assinafy webhooks retry <dispatchId>                # redeliver one event
assinafy webhooks get                               # current subscription
assinafy webhooks inactivate                        # stop deliveries
```

One subscription exists per workspace; `register` replaces it. Omitting `--events` subscribes to `document_ready`, `document_prepared`, `signer_signed_document`, `signer_rejected_document`, and `document_processing_failed`. The API has no delete-subscription operation — use `inactivate` to stop deliveries, and note that `retry` only works while the subscription is active.

Assinafy does not publish a webhook signing scheme, so the SDK's `WebhookVerifier` is experimental. See [Contract boundaries](#contract-boundaries).

## Output and scripting

Human output goes to **stdout**; spinners and status lines go to **stderr**, so pipes stay clean.

- `--json` — structured JSON on stdout, with errors as JSON on stderr. Always machine-readable.
- `-q, --quiet` — suppress spinners and status messages.

Exit codes are `0` on success, `1` on error, and `130` on Ctrl-C. Paginated JSON keeps both the rows and the metadata:

```bash
# IDs of every pending document
assinafy documents list --status pending_signature --json | jq -r '.data[].id'

# Page through a large workspace
assinafy documents list --page 2 --per-page 50 --json | jq '.meta'

# Upload and capture the new document ID
DOC=$(assinafy documents upload contract.pdf --json | jq -r '.id')

# Attach an existing tag by its ID
TAG_ID=$(assinafy tags list --search legal --json | jq -r '.[0].id')
assinafy documents tags-add "$DOC" "$TAG_ID"
```

JSON errors carry a stable shape:

```json
{
  "error": {
    "message": "Saldo insuficiente. (document doc_abc123 exists; 2 signer(s) created or reused)",
    "code": "api_error",
    "statusCode": 402,
    "details": { "documentId": "doc_abc123", "signerIds": ["sig_1", "sig_2"] }
  }
}
```

Destructive commands prompt for confirmation and refuse to run unattended unless you pass `-y, --yes`.

## Configuration

### Precedence

Every setting resolves as **CLI flag → environment variable → config-file profile → built-in default**. Credentials are selected together from the first level that supplies either type; an API key wins only when both types are supplied at that same level. Saving one credential type with `config set` clears the other from that profile. The CLI reads process environment variables; it does not automatically load `.env` files. The OAuth variables are listed in [.env.example](./.env.example).

| What | Flag | Environment variable |
| --- | --- | --- |
| API key (sent as `X-Api-Key`) | `--api-key` | `ASSINAFY_API_KEY` |
| OAuth access token or user JWT (sent as `Bearer`) | `--token` | `ASSINAFY_TOKEN` |
| Default account / workspace ID | `--account-id` | `ASSINAFY_ACCOUNT_ID` |
| API base URL | `--base-url` | `ASSINAFY_BASE_URL` |
| Config profile | `-p, --profile` | `ASSINAFY_PROFILE` |
| Config directory | — | `ASSINAFY_CONFIG_DIR` |
| Experimental webhook-verifier secret | _(config only)_ | `ASSINAFY_WEBHOOK_SECRET` |
| Password / new password | `--password` / `--new-password` | `ASSINAFY_PASSWORD` / `ASSINAFY_NEW_PASSWORD` |
| Social provider / reset token | `--provider-token` / `--reset-token` | `ASSINAFY_PROVIDER_TOKEN` / `ASSINAFY_RESET_TOKEN` |
| Signer access code / email or WhatsApp OTP | `--access-code` / `--code` | `ASSINAFY_SIGNER_ACCESS_CODE` / `ASSINAFY_VERIFICATION_CODE` |
| Web PKI operation token | `--certificate-token` | `ASSINAFY_CERTIFICATE_TOKEN` |

`.env.example` documents every CLI and installer environment variable.

Public document verification and lookup, password reset, login and social login, and all signer access-code flows work without stored credentials.

### Config file and profiles

`assinafy login` and `assinafy config set` write a JSON config file with owner-only (`0600`) permissions:

- Linux / macOS: `~/.config/assinafy/config.json` (honours `XDG_CONFIG_HOME`)
- Windows: `%APPDATA%\assinafy\config.json`
- Anywhere: `ASSINAFY_CONFIG_DIR`

Writes go through a temp file and a rename, so an interrupted write can never truncate the file. Read-only commands warn about and ignore a malformed config; `login`, `logout`, and profile mutations refuse to overwrite it, so its contents stay recoverable.

Profiles keep separate credentials — production and sandbox, or one per client:

```bash
assinafy --profile sandbox \
  --base-url "https://sandbox.assinafy.com.br/v1" \
  login                       # prompts for that profile's key and account ID

assinafy config use sandbox   # make it the default
assinafy config list          # list profiles
assinafy config get           # effective config, secrets masked
assinafy config path          # where the file lives
```

### Sandbox

Assinafy runs a **separate sandbox** at `https://sandbox.assinafy.com.br/v1`. It has its own accounts and its own keys: a sandbox key returns `401` against production and vice versa. Target it per command with `--base-url`, for a session with `ASSINAFY_BASE_URL`, or permanently by storing it in a profile as shown above.

## Command reference

Run `assinafy <command> --help` for the full flags of any command. Every command's help output is mirrored under [`docs/`](./docs), the [API reference](./docs/api-reference.md) holds the official request/response payloads for all 93 published operations, and the [SDK reference](./docs/sdk-reference.md) maps each SDK method to its operation.

Global flags accepted by every command: `--api-key`, `--token`, `--account-id`, `--base-url`, `-p, --profile`, `--json`, `-q, --quiet`. `assinafy -v` prints the version.

### `send` — upload and request signatures

```bash
assinafy send contract.pdf \
  --signer "Ana <ana@example.com>" \
  --signer "Bruno <+5548999990000>" \
  --message "Please sign" \
  --expires-at "2026-12-31T23:59:59Z" \
  --copy-receivers sig_abc123,sig_def456
```

`--signers '<json>'` replaces `--signer` when you need verification methods or signing order; `--no-wait` skips waiting for processing; `--metadata '<json>'` attaches integration data to the document.

### `documents`

| Command | Description |
| --- | --- |
| `documents upload <file> [--name] [--metadata] [--wait]` | Upload a PDF (max 25 MiB) |
| `documents list [--status] [--method] [--tags] [--page] [--per-page] [--search] [--sort]` | List documents |
| `documents search [query] [--status] [--page] [--per-page] [--sort]` | Lightweight type-ahead search |
| `documents get <id>` | Show document details |
| `documents rename <id> <name>` | Rename a document (before signing starts) |
| `documents download <id> [--artifact] [-o] [--force]` | Download an artifact (`original`/`certificated`/`certificate-page`/`pades` PDFs, or `bundle` ZIP) |
| `documents thumbnail <id> [-o] [--force]` | Download the thumbnail (JPEG) |
| `documents download-page <id> <pageId> [-o] [--force]` | Download one page (JPEG) |
| `documents activities <id>` | Activity log |
| `documents delete <id> [-y]` | Delete a document |
| `documents tags <id>` | List attached tags |
| `documents tags-set <id> [tags...]` | Replace the tag set by name (none detaches all) |
| `documents tags-add <id> <tags...>` | Attach tags by name |
| `documents tags-remove <id> <tagId>` | Detach one tag |
| `documents create-from-template <templateId> --signers <json> [...]` | Create from a template |
| `documents estimate-template-cost <templateId> --signers <json>` | Estimate template cost |
| `documents verify <hash>` | Verify by signature hash (public) |
| `documents statuses` | List every document status and whether it is deletable |
| `documents public <id>` | Public unauthenticated lookup |
| `documents send-token <id> --recipient <email> --channel email` | Send a verification token in production |
| `documents progress <id>` | Signing progress |
| `documents wait <id> [--timeout] [--interval]` | Poll until ready, failed, or timed out |

### `signers`

`create` · `list` · `get <id>` · `update <id>` · `delete <id> [-y]` · `find-by-email <email>`

```bash
assinafy signers create --name "Ana Lima" --email ana@example.com --cpf 000.000.000-00
```

Only `--name` is required. `--cpf` strips non-digits. `list` supports `--search`, `--page`, `--per-page`, and `--sort full_name|-full_name`.

### `assignments`

`list` · `create <documentId>` · `estimate-cost <documentId>` · `reset-expiration <documentId> <assignmentId>` · `resend <documentId> <assignmentId> <signerId>` · `estimate-resend-cost <documentId> <assignmentId> <signerId>` · `whatsapp-notifications <documentId> <assignmentId>`

```bash
assinafy assignments create doc_123 --signer-ids sig_1,sig_2 --message "Please sign"
assinafy assignments reset-expiration doc_123 asg_1 --expires-at "2026-12-31T23:59:59Z"
```

`reset-expiration --clear` removes the expiration where the deployment supports it.

### `templates`

`list [--search] [--sort]` · `get <id>` · `download-page <templateId> <pageId> [-o] [--force]`

### `tags`

`list [--search]` · `create --name [--color]` · `update <id> [--name] [--color] [--clear-color]` · `delete <id> [--force] [-y]`

Deleting a tag that is still attached to documents fails until you pass `--force`, which detaches it everywhere first.

### `fields`

`create --type --name [--regex] [--required] [--inactive]` · `list [--include-inactive] [--include-standard]` · `get <id>` · `update <id> [...]` · `delete <id> [-y]` · `validate <id> <value> [--signer-access-code]` · `validate-multiple --entries <json> [--signer-access-code]` · `types`

Field definitions are what `--method collect` assignments gather. Run `fields types` for the supported types.

### `webhooks`

`register --url --email [--events] [--inactive]` · `get` · `inactivate` · `event-types` · `dispatches [--event] [--delivered] [--from] [--to] [--page] [--per-page] [--sort]` · `retry <dispatchId>`

### `workspaces` (alias `accounts`)

`create --name [--notification-sender] [--primary-color] [--secondary-color]` · `list` · `get <id>` · `theme <id>` · `stats <id> [--granularity] [--month]` · `logo download|upload|delete` · `update <id> [...]` · `delete <id> [--force] [-y]`

### `users`

`self` · `stats [--granularity] [--month]` · `notification-preferences get|update`

`--granularity daily` requires `--month YYYY-MM`.

### `signer` — signer-side flows

`document <signerId>` · `documents <signerId>` · `search <signerId> <query>` · `download <signerId> <documentId> <artifact>` · `self` · `accept-terms` · `verify-code --code` (alias `verify-email`) · `certificate-start` · `certificate-complete --certificate-token` · `confirm-data <documentId>` · `upload-signature --file` · `download-signature` · `assignment` · `sign <documentId> <assignmentId> --entries` · `decline <documentId> <assignmentId> --reason` · `sign-multiple --document-ids` · `decline-multiple --document-ids --reason`

Every signer command except the public artifact `download` requires `--access-code <code>`; `download` accepts it optionally for an identity preflight. Use `ASSINAFY_SIGNER_ACCESS_CODE` to keep the code out of process arguments.

### `auth`

`login <email>` · `social-login` · `link-social-login` · `change-password` · `request-password-reset <email>` · `reset-password --reset-token` · `api-keys create|get|delete`

For server-to-server use, prefer an API key (`assinafy login` or `--api-key`) and skip this group. `auth login`, `auth social-login`, `auth request-password-reset`, and `auth reset-password` run without stored credentials; the rest accept the API key or JWT documented for their endpoint.

### `oauth`

`connect` · `metadata` · `discovery <issuer>` · `authorize --redirect-uri --scope` · `exchange --request --callback-url` · `refresh --refresh-token` · `revoke --revoke-token` · `userinfo`

`connect`, `authorize`, `refresh`, and `revoke` use the bundled public client ID unless overridden by `--client-id` or `ASSINAFY_OAUTH_CLIENT_ID`. Client secrets and sensitive callback/token flags have environment-variable alternatives. The [OAuth guide](./docs/oauth-guide.md) documents every method and payload.

### Meta

`login` · `logout` · `whoami` · `config set|get|list|use|remove|path` · `docs [--open]`

## Node.js SDK

The same package ships a typed SDK. It covers every published operation, unwraps the API envelope, and validates input before a request leaves the process.

```ts
import { AssinafyClient, ApiError, PartialWorkflowError } from '@assinafy/cli/api';

const client = AssinafyClient.create(
  process.env.ASSINAFY_API_KEY!,
  process.env.ASSINAFY_ACCOUNT_ID!,
);

const { data, meta } = await client.documents.list({ status: 'pending_signature' });

const document = await client.documents.upload(
  { filePath: './contract.pdf' },
  { name: 'Service agreement', metadata: { external_id: 'order-123' } },
);
await client.documents.waitUntilReady(document.id);
```

CommonJS uses `require('@assinafy/cli/api')`. JSON `data` envelopes are unwrapped, paginated calls resolve to `{ data, meta }` built from the `X-Pagination-*` headers, downloads resolve to a `Buffer`, and status-only responses keep their documented object.

Errors are typed: `ValidationError` for local input, `ApiError` (with `statusCode`, `responseData`, `wwwAuthenticate`, and `retryAfter`) for HTTP failures, `NetworkError` for transport failures, and `PartialWorkflowError` when `uploadAndRequestSignatures` fails after creating resources — it exposes the `documentId` and `signerIds` that already exist so you can inspect and resume. Never automatically delete these signers: they may have been reused from other documents. For example:

```ts
try {
  await client.uploadAndRequestSignatures({ source: { filePath: './contract.pdf' }, signers });
} catch (error) {
  if (error instanceof PartialWorkflowError) {
    console.error({ documentId: error.documentId, signerIds: error.signerIds });
    // Inspect the document before resuming; signer IDs can belong to reused records.
  }
  throw error;
}
```

Full method signatures, payload types, binary formats, and runtime caveats are in the [SDK reference](./docs/sdk-reference.md); every underlying HTTP payload is in the [API reference](./docs/api-reference.md).

## Security

- **Transport.** Clients require HTTPS, reject redirects, and reject base URLs carrying credentials, a query string, or a fragment. The SDK's `allowInsecureHttp` escape hatch is limited to loopback hosts (`localhost`, `127.0.0.0/8`, `[::1]`), so an API key can never be sent in cleartext to a remote host.
- **Credential scope.** Owner credentials are stripped from every public and signer-access-code request. Axios request configuration — which carries auth headers and bodies — is never attached to a thrown error.
- **At rest.** The config file is written `0600` inside a `0700` directory, atomically, and re-`chmod`ed on every write so a previously loose file cannot keep loose permissions.
- **On the command line.** Secret-bearing flags are visible in shell history and process listings. Prefer the hidden `login` prompt, the config file, or the environment variables listed under [Configuration](#configuration). Never put API keys, tokens, passwords, reset or provider tokens, or signer access codes in shared scripts or logs.
- **Terminal output.** Values echoed from the API are stripped of control and bidirectional-override characters before they reach a terminal line.

Report vulnerabilities per [SECURITY.md](./SECURITY.md).

## Development

```bash
npm ci                   # install exactly from package-lock.json
npm run dev -- --help    # run from source with tsx
npm run dev:watch        # run from source, restart on change
npm run typecheck        # tsc --noEmit
npm run lint             # biome check
npm test                 # vitest
npm run build            # bundle dist/cli.cjs plus the SDK ESM/CJS/types
npm run verify:bundle    # verify the bundled executable and packed SDK
npm run docs             # regenerate docs/ from CLI --help output
npm run docs:api         # regenerate the HTTP payload reference from the live OpenAPI
npm run verify:api-docs  # assert every published operation is documented and implemented
npm run pack:release     # build reproducible release archives in dist/release/
```

`npm test` checks SDK contracts, validation, CLI behavior, and OAuth callbacks with synthetic data, controlled transports, and local servers. It requires no Assinafy credentials. Release verification also checks the current public API documentation and packaged artifacts.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the contribution workflow.

## Release

CI runs typecheck, lint, tests, bundle verification, generated-file checks, installer checks, reproducible-archive checks, and package-content checks on Node 22, 24, and 26 across Linux, macOS, and Windows.

This repository is hosted directly on GitHub. Push changes to `main` and publish an annotated `vX.Y.Z` tag to run a two-stage release: `verify` rebuilds and checks the tagged commit, automated tests, current public API contract, and packaged artifacts, then uploads a single verified payload; `publish` consumes that payload, uploads the release assets, and publishes to both registries through the protected release environment.

The [release runbook](./docs/releasing.md) covers tags, trusted publishing, and recovery.

## Contract boundaries

- The production OpenAPI publishes 93 operations and the SDK implements all of them. Sandbox deployments can lag individual routes — account/user statistics and user notification preferences may return route-level 404s there despite being documented in production.
- The SDK keeps two platform-compatible template routes (`GET /accounts/{id}/templates/{id}` and its page download) that are absent from the published OpenAPI paths.
- Certificate start/complete are deployed production extensions of the public signing frontend, exposed as `signerDocuments.startCertificate(accessCode)` and `signerDocuments.completeCertificate(accessCode, token)`. Start posts `{ "signer-access-code": code }` and returns `{ token }`; complete posts `{ "signer-access-code": code, token }` and returns `{ signerName }`. Both also carry the access code in the query string and strip owner credentials. They supplement, but are not part of, the 93 OpenAPI operations.
- Both the published and legacy `send-token` payloads are supported for compatible deployments.
- `WebhookVerifier` is **experimental**. Assinafy does not publish the signature header, algorithm, encoding, timestamp, or replay-protection scheme, so it is not a production trust boundary until the exact scheme is published or independently verified against real deliveries.

## License

MIT © Assinafy
