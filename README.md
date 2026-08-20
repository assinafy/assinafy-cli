# @assinafy/cli

The command-line interface and Node.js SDK for the [Assinafy API](https://api.assinafy.com.br/v1/docs) — a Brazilian digital-signature platform. Upload PDFs, manage signers, request signatures, and automate documented API workflows from a terminal or application.

The self-contained CLI prints human-readable tables by default and supports `--json` for scripting. The package also exposes a typed SDK at `@assinafy/cli/api`; see the [SDK reference](./docs/sdk-reference.md).

## Requirements

- Node.js `>=22.12.0`; Node.js 24 LTS is recommended

## Installation

```bash
npm install -g @assinafy/cli@<version>
# then
assinafy --help
```

Omit `@<version>` only when you deliberately want the newest published release. For a GitHub release install, download and inspect the installer from the same immutable version tag you are installing:

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

The installers fetch the matching release archive and verify it against that release's `SHA256SUMS` before replacing the executable. They place the CLI in `~/.assinafy/bin` by default; set `ASSINAFY_INSTALL` to choose another directory or `ASSINAFY_NO_PATH_UPDATE=1` to leave `PATH` unchanged.

Or run without installing:

```bash
npx @assinafy/cli whoami
```

## Quick start

```bash
# 1. Store your credentials (interactive)
assinafy login

# 2. Verify them
assinafy whoami

# 3. Upload a PDF and request signatures in one step
assinafy send contract.pdf \
  --signer "Ana Lima <ana@example.com>" \
  --signer "Bruno Souza <+5548999990000>" \
  --message "Please sign this contract"
```

## Authentication & configuration

The CLI resolves every credential with this precedence: **CLI flag → environment variable → config file**.

### Credentials

| What | Flag | Environment variable |
| --- | --- | --- |
| API key (preferred, sent as `X-Api-Key`) | `--api-key` | `ASSINAFY_API_KEY` |
| Legacy JWT token (sent as `Bearer`) | `--token` | `ASSINAFY_TOKEN` |
| Default account / workspace ID | `--account-id` | `ASSINAFY_ACCOUNT_ID` |
| API base URL | `--base-url` | `ASSINAFY_BASE_URL` |
| Experimental webhook-verifier secret | _(config only)_ | `ASSINAFY_WEBHOOK_SECRET` |
| Config profile | `-p, --profile` | `ASSINAFY_PROFILE` |
| Password / new password | `--password` / `--new-password` | `ASSINAFY_PASSWORD` / `ASSINAFY_NEW_PASSWORD` |
| Social provider / reset token | `--provider-token` / `--reset-token` | `ASSINAFY_PROVIDER_TOKEN` / `ASSINAFY_RESET_TOKEN` |
| Signer access code / email OTP | `--access-code` / `--code` | `ASSINAFY_SIGNER_ACCESS_CODE` / `ASSINAFY_VERIFICATION_CODE` |

Public document verification/lookup, password reset, login/social-login, and signer access-code flows do not require stored credentials. Authenticated operations accept the API key or bearer token documented for their endpoint.

Secret-bearing flags can be visible in shell history and process listings. Prefer the hidden `login` prompt, the owner-only config file, or environment variables; do not put API keys, tokens, passwords, reset/provider tokens, or signer access codes in shared scripts or logs.

### Config file & profiles

`assinafy login` / `assinafy config set` write to a JSON config file with owner-only (`0600`) permissions:

- Linux / macOS: `~/.config/assinafy/config.json` (honours `XDG_CONFIG_HOME`)
- Windows: `%APPDATA%\assinafy\config.json`
- Override anywhere with `ASSINAFY_CONFIG_DIR`

Writes are atomic. Read-only commands warn and ignore a malformed config, while
login/logout and profile mutations refuse to overwrite it so its contents remain
available for recovery.

Profiles let you keep separate credentials (e.g. production vs. sandbox):

```bash
assinafy --profile sandbox \
  --base-url "https://sandbox.assinafy.com.br/v1" \
  login # prompts for the API key and account ID

assinafy config use sandbox       # make it the default
assinafy config list              # list profiles
assinafy config get               # show the effective config (secrets masked)
```

### Sandbox

Assinafy runs a **separate sandbox** at `https://sandbox.assinafy.com.br/v1`. A sandbox key only works against that base URL. Target it per-command with `--base-url`, via `ASSINAFY_BASE_URL`, or by storing it in a profile.

## Output

By default commands print friendly tables / key-value blocks to **stdout**, with spinners and status lines on **stderr**. For scripting:

- `--json` — emit structured JSON on stdout (errors become JSON on stderr). Always machine-readable.
- `-q, --quiet` — suppress spinners and status messages.

Commands exit `0` on success and `1` on error (`130` on Ctrl-C). Paginated JSON preserves both records and metadata: `assinafy documents list --json | jq -r '.data[].id'`.

## Command reference

Run `assinafy <command> --help` for full flag details on any command. Per-command help is mirrored under [`docs/`](./docs), the [API reference](./docs/api-reference.md) contains the official request/response payloads for all 89 published operations, and the [SDK reference](./docs/sdk-reference.md) maps every public SDK method to those operations.

### `send` — upload + request signatures (headline workflow)

```bash
assinafy send contract.pdf \
  --signer "Ana <ana@example.com>" \
  --signer "Bruno <+5548999990000>" \
  --message "Please sign" \
  --expires-at 2026-12-31T23:59:59Z \
  --copy-receivers sig_abc123,sig_def456
```

Use `--signers '<json>'` for full control (verification methods, signing order/`step`), and `--no-wait` to skip waiting for processing. Per the API, `--copy-receivers` takes **signer IDs** (people who only receive a copy of the finished document), not arbitrary email addresses.

### `documents`

| Command | Description |
| --- | --- |
| `documents upload <file> [--name] [--metadata] [--wait]` | Upload a PDF |
| `documents list [--status] [--method] [--tags] [--page] [--per-page] [--search] [--sort]` | List documents |
| `documents search [query] [--status] [--page] [--per-page]` | Lightweight type-ahead search |
| `documents get <id>` | Show document details |
| `documents rename <id> <name>` | Rename a document (before signing starts) |
| `documents download <id> [--artifact] [-o] [--force]` | Download an artifact (`original`/`certificated`/`certificate-page`/`pades` PDFs or `bundle` ZIP) |
| `documents thumbnail <id> [-o] [--force]` | Download the thumbnail (JPEG) |
| `documents download-page <id> <pageId> [-o] [--force]` | Download one page (JPEG) |
| `documents activities <id>` | Activity log |
| `documents delete <id> [-y]` | Delete a document |
| `documents tags <id>` | List attached tags |
| `documents tags-set <id> [names...]` | Replace the tag set |
| `documents tags-add <id> <names...>` | Attach tags by name |
| `documents tags-remove <id> <tagId>` | Detach one tag |
| `documents create-from-template <templateId> --signers <json> [...]` | Create from a template |
| `documents estimate-template-cost <templateId> --signers <json>` | Estimate template cost |
| `documents verify <hash>` | Verify by signature hash |
| `documents statuses` | List all document statuses |
| `documents public <id>` | Public unauthenticated lookup |
| `documents send-token <id> --email <email>` | Send a verification token with the published payload (`--recipient`/`--channel` remains for the live legacy form) |
| `documents progress <id>` | Signing progress |
| `documents wait <id> [--timeout] [--interval]` | Poll until ready |

### `signers`

`create` · `list` · `get <id>` · `update <id>` · `delete <id>` · `find-by-email <email>`

```bash
assinafy signers create --name "Ana Lima" --email ana@example.com --cpf 123.456.789-00
```

### `assignments`

`list` · `create <documentId>` · `estimate-cost <documentId>` · `reset-expiration <documentId> <assignmentId>` · `resend <documentId> <assignmentId> <signerId>` · `estimate-resend-cost ...` · `whatsapp-notifications <documentId> <assignmentId>`

```bash
assinafy assignments create doc_123 --signer-ids sig_1,sig_2 --message "Please sign"
```

### `templates`

`list` · `get <id>` · `download-page <templateId> <pageId> [-o] [--force]`

### `tags`

`list [--search]` · `create --name [--color]` · `update <id> [--name] [--color] [--clear-color]` · `delete <id> [--force] [-y]`

### `fields`

`create --type --name [...]` · `list [--include-inactive] [--include-standard]` · `get <id>` · `update <id> [...]` · `delete <id> [-y]` · `validate <id> <value> [--signer-access-code]` · `validate-multiple --entries <json>` · `types`

### `webhooks`

`register --url --email [--events] [--inactive]` · `get` · `inactivate` · `event-types` · `dispatches [filters]` · `retry <dispatchId>`

> The API has no delete-subscription endpoint — use `inactivate` to stop deliveries.

### `workspaces` (alias `accounts`)

`create --name [...]` · `list` · `get <id>` · `theme <id>` · `stats <id>` · `logo download|upload|delete` · `update <id> [...]` · `delete <id> [-y]`

### `users`

`self` · `stats [--granularity] [--month]` · `notification-preferences get|update`

### `signer` — signer-side flows (authenticated by a signer access code)

`document <signerId>` · `documents <signerId>` · `download <signerId> <documentId> <artifact>` · `self` · `accept-terms` · `verify-email` · `confirm-data <documentId>` · `upload-signature` · `download-signature` · `assignment` · `sign <documentId> <assignmentId>` · `decline <documentId> <assignmentId>` · `sign-multiple` · `decline-multiple`

Every signer command takes `--access-code <code>` (the one-time link emailed/WhatsApped to the signer); use `ASSINAFY_SIGNER_ACCESS_CODE` to keep it out of process arguments.

### `auth`

`login <email>` · `social-login` · `link-social-login` · `change-password` · `request-password-reset <email>` · `reset-password --reset-token` · `api-keys create|get|delete`

> For server-to-server use, prefer an `X-Api-Key` (`assinafy login` / `--api-key`) and skip these.
> `auth login`, `auth social-login`, `auth request-password-reset`, and `auth reset-password` can run without stored credentials. The other auth commands accept the API key or JWT documented by the API.

### Meta

`login` · `logout` · `whoami` · `config set|get|list|use|remove|path` · `docs [--open]`

## Node.js SDK

```ts
import { AssinafyClient } from '@assinafy/cli/api';

const client = AssinafyClient.create(
  process.env.ASSINAFY_API_KEY!,
  process.env.ASSINAFY_ACCOUNT_ID!,
);

const { data, meta } = await client.documents.list({ status: 'pending_signature' });
const document = await client.documents.upload(
  { filePath: './contract.pdf' },
  { name: 'Service agreement', metadata: { external_id: 'order-123' } },
);
```

CommonJS uses `require('@assinafy/cli/api')`. JSON `data` envelopes are unwrapped, paginated results are `{ data, meta }`, and downloads return `Buffer`; status-only responses retain their documented object. Full method signatures, payload types, error handling, binary formats, and contract caveats are in the [SDK reference](./docs/sdk-reference.md).

## Scripting examples

```bash
# IDs of all pending documents
assinafy documents list --status pending_signature --json | jq -r '.data[].id'

# Upload and capture the new document ID
DOC=$(assinafy documents upload contract.pdf --json | jq -r '.id')

# Bulk-tag every template-created document
assinafy documents tags-add "$DOC" legal q4-2026
```

## Development

```bash
npm install          # install dependencies
npm run dev -- --help   # run from source with tsx
npm run dev:watch    # run from source and restart on changes
npm run typecheck    # tsc --noEmit
npm run lint         # biome
npm test             # vitest
npm run build        # bundle to dist/cli.cjs (self-contained)
npm run verify:bundle # verify the bundled executable
npm run docs         # regenerate docs/ from CLI help output
npm run docs:api     # regenerate the official HTTP payload reference
npm run verify:api-docs # verify all published API operations are documented
npm run pack:release # create release archives in dist/release/
```

The opt-in `npm run test:sandbox` matrix requires the sandbox variables shown in
`.env.example`. It creates and cleans up disposable API resources and sends one
signing-token email to `ASSINAFY_TEST_EMAIL`; do not run it against production.

## Release

GitHub CI runs typecheck, lint, tests, bundle verification, and package-content
checks on Node 22, 24, and 26. Publishing a GitHub release packages the CLI into
platform archives, uploads the assets, and publishes the configured package registries.
See the [release runbook](./docs/releasing.md) for tag, mirror, trusted-publishing,
and recovery requirements.

## Contract notes

The production OpenAPI currently publishes 89 operations, while sandbox deployments can lag individual routes. The SDK keeps two platform-compatible template routes that are not present in the OpenAPI paths and does not invent the certificate start/complete contracts mentioned only in prose. See [SDK contract boundaries](./docs/sdk-reference.md#contract-boundaries).

`WebhookVerifier` is experimental: Assinafy does not publish the signature header, algorithm, encoding, timestamp, or replay-protection scheme. Do not use it as a production trust boundary until the exact scheme is published or independently verified against real deliveries.

## License

MIT © Assinafy
