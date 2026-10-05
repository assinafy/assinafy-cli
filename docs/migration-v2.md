# Migrating to version 2

Version 2 publishes the Node.js SDK at `@assinafy/cli/api` and requires Node.js
`>=22.12.0`.

- Credentialed clients now require HTTPS, reject redirects, and reject base URLs
  containing a query or fragment. `allowInsecureHttp: true` permits a plaintext
  base URL only on a loopback host (`localhost`, `127.0.0.0/8`, `[::1]`), so a key
  can never be sent in cleartext to a remote host.
- Resource IDs, artifact names, sort fields, dates, mutually exclusive CLI
  options, and signer-code authentication are validated before a request.
- Published `{ status, message }` bodies and delete `data: []` bodies are now
  returned as `IStatusResponse` and `IEmptyResult` instead of being discarded.
- Phone-only signers in `uploadAndRequestSignatures` default to WhatsApp
  verification and notification. Explicit signer controls still take precedence.
- `uploadAndRequestSignatures` rejects with `PartialWorkflowError` when it fails
  after the upload, exposing the `documentId` and `signerIds` it already created
  so callers can inspect remote state and resume. Signer IDs may have been reused;
  never delete those signers automatically after a failed workflow.
- Signer artifact downloads use the published public route. Supplying an optional
  access code adds an identity preflight before downloading.

Legacy signer aliases (`phone`, `cpf`, and assignment `signer_ids`/`signerIds`),
both public `sendToken` request forms, and existing CLI functionality remain
available. See the [SDK reference](./sdk-reference.md) for exact method signatures.
