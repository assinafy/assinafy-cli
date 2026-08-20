/// <reference types="node" preserve="true" />

export type { ClientConfigInput } from './client.js';
export { AssinafyClient } from './client.js';
export * from './errors.js';
export { AssignmentResource, buildAssignmentPayload } from './resources/assignments.js';
export { AuthenticationResource } from './resources/authentication.js';
export type { DocumentUploadSource, IDocumentUploadOptions } from './resources/documents.js';
export { DocumentResource } from './resources/documents.js';
export { FieldsResource } from './resources/fields.js';
export { SignerDocumentsResource } from './resources/signer-documents.js';
export { SignerResource } from './resources/signers.js';
export { TagResource } from './resources/tags.js';
export { TemplateResource } from './resources/templates.js';
export { UsersResource } from './resources/users.js';
export { WebhookResource } from './resources/webhooks.js';
export { WorkspaceResource } from './resources/workspaces.js';
export type { WebhookVerifierOptions } from './support/webhook-verifier.js';
export { WebhookVerifier } from './support/webhook-verifier.js';
export * from './types.js';
export { normalizeBaseUrl } from './utils.js';
