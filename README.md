# @assinafy/cli

The official command-line interface for the [Assinafy API](https://api.assinafy.com.br/v1/docs) — a Brazilian digital-signature platform. Upload PDFs, manage signers, request signatures, and drive every documented endpoint straight from your terminal or scripts.

A self-contained CLI with full coverage of the public API: `commander`-based, human-readable tables by default, and `--json` everywhere for scripting.

## Requirements

- Node.js 18+ (for the built-in `FormData` / `Blob` APIs used by uploads)

## Installation

```bash
npm install -g @assinafy/cli
# then
assinafy --help
```

Install from the latest GitHub release:

```bash
curl -fsSL https://raw.githubusercontent.com/assinafy/assinafy-cli/main/install.sh | bash
```

Install a specific release:

```bash
curl -fsSL https://raw.githubusercontent.com/assinafy/assinafy-cli/main/install.sh | bash -s -- v1.0.0
```

Windows PowerShell:

```powershell
iwr https://raw.githubusercontent.com/assinafy/assinafy-cli/main/install.ps1 -UseB | iex
```

The installers place the CLI in `~/.assinafy/bin` by default. Set `ASSINAFY_INSTALL`
to choose another install directory.

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
| Webhook signing secret | _(config only)_ | `ASSINAFY_WEBHOOK_SECRET` |
| Config profile | `-p, --profile` | `ASSINAFY_PROFILE` |

Public document verification/lookup, password reset, login/social-login, and signer access-code flows do not require a stored API key. User-account operations such as `auth change-password` and `auth api-keys` require a JWT access token (`--token` or `ASSINAFY_TOKEN`) because the API documents those endpoints as bearer-token flows.

### Config file & profiles

`assinafy login` / `assinafy config set` write to a JSON config file with owner-only (`0600`) permissions:

- Linux / macOS: `~/.config/assinafy/config.json` (honours `XDG_CONFIG_HOME`)
- Windows: `%APPDATA%\assinafy\config.json`
- Override anywhere with `ASSINAFY_CONFIG_DIR`

Profiles let you keep separate credentials (e.g. production vs. sandbox):

```bash
assinafy --profile sandbox config set \
  --api-key "k_sandbox..." \
  --account-id "acc_..." \
  --base-url "https://sandbox.assinafy.com.br/v1"

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

Commands exit `0` on success and `1` on error (`130` on Ctrl-C). This makes the CLI safe to pipe (`assinafy documents list --json | jq '.[].id'`).

## Command reference

Run `assinafy <command> --help` for full flag details on any command. Detailed per-resource docs live in [`docs/`](./docs).

### `send` — upload + request signatures (headline workflow)

```bash
assinafy send contract.pdf \
  --signer "Ana <ana@example.com>" \
  --signer "Bruno <+5548999990000>" \
  --message "Please sign" \
  --expires-at 2026-12-31T23:59:59Z \
  --copy-receivers cc@example.com
```

Use `--signers '<json>'` for full control (verification methods, signing order/`step`), and `--no-wait` to skip waiting for processing.

### `documents`

| Command | Description |
| --- | --- |
| `documents upload <file> [--name] [--metadata] [--wait]` | Upload a PDF |
| `documents list [--status] [--method] [--tags] [--page] [--per-page] [--search] [--sort]` | List documents |
| `documents get <id>` | Show document details |
| `documents download <id> [--artifact] [-o]` | Download an artifact (`original`/`certificated`/`certificate-page`/`bundle`) |
| `documents thumbnail <id> [-o]` | Download the thumbnail (JPEG) |
| `documents download-page <id> <pageId> [-o]` | Download one page (JPEG) |
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
| `documents send-token <id> --recipient <r> [--channel]` | Send a verification token |
| `documents progress <id>` | Signing progress |
| `documents wait <id> [--timeout] [--interval]` | Poll until ready |

### `signers`

`create` · `list` · `get <id>` · `update <id>` · `delete <id>` · `find-by-email <email>`

```bash
assinafy signers create --name "Ana Lima" --email ana@example.com --cpf 123.456.789-00
```

### `assignments`

`create <documentId>` · `estimate-cost <documentId>` · `reset-expiration <documentId> <assignmentId>` · `resend <documentId> <assignmentId> <signerId>` · `estimate-resend-cost ...` · `whatsapp-notifications <documentId> <assignmentId>`

```bash
assinafy assignments create doc_123 --signer-ids sig_1,sig_2 --message "Please sign"
```

### `templates`

`list` · `get <id>` · `download-page <templateId> <pageId> [-o]`

### `tags`

`list [--search]` · `create --name [--color]` · `update <id> [--name] [--color] [--clear-color]` · `delete <id> [--force] [-y]`

### `fields`

`create --type --name [...]` · `list [--include-inactive] [--include-standard]` · `get <id>` · `update <id> [...]` · `delete <id> [-y]` · `validate <id> <value> [--signer-access-code]` · `validate-multiple --entries <json>` · `types`

### `webhooks`

`register --url --email [--events] [--inactive]` · `get` · `delete [-y]` · `inactivate` · `event-types` · `dispatches [filters]` · `retry <dispatchId>`

### `workspaces` (alias `accounts`)

`create --name [...]` · `list` · `get <id>` · `update <id> [...]` · `delete <id> [-y]`

### `signer` — signer-side flows (authenticated by a signer access code)

`document <signerId>` · `documents <signerId>` · `download <signerId> <documentId> <artifact>` · `self` · `accept-terms` · `verify-email` · `confirm-data <documentId>` · `upload-signature` · `download-signature` · `assignment` · `sign <documentId> <assignmentId>` · `decline <documentId> <assignmentId>` · `sign-multiple` · `decline-multiple`

Every signer command takes `--access-code <code>` (the one-time link emailed/WhatsApped to the signer).

### `auth`

`login <email>` · `social-login` · `change-password` · `request-password-reset <email>` · `reset-password` · `api-keys create|get|delete`

> For server-to-server use, prefer an `X-Api-Key` (`assinafy login` / `--api-key`) and skip these.
> `auth login`, `auth social-login`, `auth request-password-reset`, and `auth reset-password` can run without stored credentials. `auth change-password` and `auth api-keys ...` require a JWT token.

### Meta

`login` · `logout` · `whoami` · `config set|get|list|use|remove|path` · `docs [--open]`

## Scripting examples

```bash
# IDs of all pending documents
assinafy documents list --status pending_signature --json | jq -r '.[].id'

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
npm run pack:release # create release archives in dist/release/
```

## Release

GitHub CI runs typecheck, lint, tests, bundle verification, and package-content
checks on Node 18, 20, and 22. Publishing a GitHub release packages the CLI into
platform archives, uploads the assets, and publishes to npm when `NPM_TOKEN` is
configured.

## License

MIT © Assinafy
