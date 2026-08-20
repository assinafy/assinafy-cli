# Migrating to version 2

Version 2 publishes the Node.js SDK at `@assinafy/cli/api` and requires Node.js
`>=22.12.0`.

- Credentialed clients now require HTTPS, reject redirects, and reject base URLs
  containing a query or fragment. Set `allowInsecureHttp: true` only for isolated
  local HTTP testing.
- Resource IDs, artifact names, sort fields, dates, mutually exclusive CLI
  options, and signer-code authentication are validated before a request.
- Published `{ status, message }` bodies and delete `data: []` bodies are now
  returned as `IStatusResponse` and `IEmptyResult` instead of being discarded.
- Phone-only signers in `uploadAndRequestSignatures` default to WhatsApp
  verification and notification. Explicit signer controls still take precedence.
- Signer artifact downloads perform an identity preflight because older sandbox
  deployments did not enforce the documented access code on the raw download route.

Legacy signer aliases (`phone`, `cpf`, and assignment `signer_ids`/`signerIds`),
both public `sendToken` request forms, and existing CLI functionality remain
available. See the [SDK reference](./sdk-reference.md) for exact method signatures.
