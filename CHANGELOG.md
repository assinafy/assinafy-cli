# Changelog

All notable changes to `@assinafy/cli` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- `fields.create` accepts `regex: null`, matching the published schema.

## [2.5.1] - 2026-10-11

### Added

- `assinafy webhooks verify <bodyFile> --id --timestamp --signature` checks a saved
  Standard Webhooks delivery against `ASSINAFY_WEBHOOK_SECRET` (or the profile secret)
  and exits with code 1 when the signature or timestamp is invalid.
- `ApiError.rateLimit` exposes the `X-Rate-Limit-Limit`, `X-Rate-Limit-Remaining` and
  `X-Rate-Limit-Reset` values; the CLI includes them in `--json` errors and, on `429`,
  prints how many seconds to wait from `Retry-After`.
- `signer documents` and `signer search` (and `signerDocuments.list`/`search` in the SDK)
  work without a signer access code, using the workspace API key or token.
- `oauth.token` accepts the RFC 8693 `urn:ietf:params:oauth:grant-type:token-exchange`
  grant published for Assinafy internal-service confidential clients.

### Changed

- `documents send-token` and `documents.sendToken` send the production body
  `{ "channel": "email", "recipient": "<signer email>" }` and return
  `{ document, channel, recipient }`. Only the `email` channel is accepted; `--email`
  and the SDK `{ email }` form remain as aliases that send the same body.
- Assignment, estimate and template signers are checked locally for exactly one
  notification method compatible with the verification method (`Email` with `Email`,
  `Whatsapp` with `Whatsapp`, `DigitalCertificate` with either), matching the API's
  `400` rules.
- OAuth error messages include `error_description` when the server provides one.
- The API reference shows nullable request fields such as `expires_at` as
  `string | null`.

### Fixed

- `send-token` no longer offers the `whatsapp` channel or the `{ "email" }` body,
  both of which the API rejects with `400`.
