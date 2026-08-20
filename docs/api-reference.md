# Assinafy API v1 — request/response reference

Generated from the official [Assinafy OpenAPI document](https://api.assinafy.com.br/v1/docs/openapi.json) and its native Markdown renderer. It contains every published operation and the complete examples supplied by Assinafy. Runtime-only SDK helpers are documented in [sdk-reference.md](./sdk-reference.md).

The renderer reuses a generic 400 envelope for several non-400 errors; top-level numeric `status` fields below are normalized to their documented HTTP response code. Example identifiers, contact details, and credentials are replaced with deterministic non-production placeholders.

- OpenAPI: 3.0.0
- API document version: 1.0.0
- Operations: 89
- Contract SHA-256: `44da834c27173a3739d491fdacbb48decf9a170bd776a1c4edb4d0d4b108c22f`

## Accounts

### Get account

`GET /v1/accounts/{accountId}`

Retrieve a workspace account the user belongs to.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — The account

```json
{
    "data": {
        "resource": "account",
        "id": "example_id_1",
        "name": "Acme Inc.",
        "primary_color": "aabbcc",
        "secondary_color": "112233",
        "notification_sender_type": "User",
        "roles": [
            "owner"
        ],
        "is_delete_allowed": true,
        "created_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Update account

`PUT /v1/accounts/{accountId}`

Update a workspace account's profile.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string)
- `notification_sender_type` (string) — Who signers see as the notification sender for documents in this account. `User` (default) shows the document owner's name; `Account` shows this account's name.

Example:

```json
{
    "name": "Acme Inc.",
    "notification_sender_type": "Account"
}
```

#### Responses

##### 200 — The updated account

```json
{
    "data": {
        "resource": "account",
        "id": "example_id_1",
        "name": "Acme Inc.",
        "primary_color": "aabbcc",
        "secondary_color": "112233",
        "notification_sender_type": "User",
        "roles": [
            "owner"
        ],
        "is_delete_allowed": true,
        "created_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Delete account

`DELETE /v1/accounts/{accountId}`

Delete a workspace account.

By default the request fails with `400` when the workspace has an active paid subscription — the `restrictions` array in the response lists each blocker by code so you can address them individually before retrying. Pass `force: true` to cancel any active paid subscription automatically and proceed with immediate deletion.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body

Fields (`application/json`):

- `force` (boolean) — When `true`, cancels any active paid subscription on this workspace and proceeds with deletion immediately. Defaults to `false`.

Example:

```json
{
    "force": false
}
```

#### Responses

##### 200 — Account deleted

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 400 — Deletion blocked by active restrictions. Each `restrictions` entry describes one blocker; resolve them individually, or retry with `force: true` to cancel blocking subscriptions/documents automatically.

```json
{
    "status": 400,
    "message": "Bad request.",
    "restrictions": [
        {
            "code": "ActivePaidSubscription",
            "message": "Account has an active paid subscription.",
            "account_ids": [
                "example_id_2"
            ]
        }
    ],
    "data": null
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Get account theme

`GET /v1/accounts/{accountId}/theme`

Retrieve account theme information (branding name, colors, and logo URL).

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — The theme

```json
{
    "data": {
        "account_name": "Account Name",
        "primary_color": "aabbcc",
        "secondary_color": "aabbcc",
        "logo": "https://example.com/example-url-1"
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Download account logo

`GET /v1/accounts/{accountId}/logo`

Download the account logo image binary.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — The logo image

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Upload account logo

`POST /v1/accounts/{accountId}/logo`

Upload or replace the account logo image.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`multipart/form-data`):

- `file` (string, required)

Example:

```json
{
    "file": "string"
}
```

#### Responses

##### 200 — Logo updated

```json
{
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Delete account logo

`DELETE /v1/accounts/{accountId}/logo`

Remove the account logo image.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — Logo deleted

```json
{
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List my accounts

`GET /v1/accounts`

List the workspace accounts the authenticated user belongs to.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — The user's accounts

```json
{
    "data": [
        {
            "resource": "account",
            "id": "example_id_1",
            "name": "Acme Inc.",
            "primary_color": "aabbcc",
            "secondary_color": "112233",
            "notification_sender_type": "User",
            "roles": [
                "owner"
            ],
            "is_delete_allowed": true,
            "created_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Create account

`POST /v1/accounts`

Create a new workspace account owned by the authenticated user.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body (required)

Fields (`application/json`):

- `name` (string, required)
- `notification_sender_type` (string) — Who signers see as the notification sender for documents in this account. `User` (default) shows the document owner's name; `Account` shows this account's name.

Example:

```json
{
    "name": "Acme Inc.",
    "notification_sender_type": "Account"
}
```

#### Responses

##### 200 — The created account

```json
{
    "data": {
        "resource": "account",
        "id": "example_id_1",
        "name": "Acme Inc.",
        "primary_color": "aabbcc",
        "secondary_color": "112233",
        "notification_sender_type": "User",
        "roles": [
            "owner"
        ],
        "is_delete_allowed": true,
        "created_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Account document KPIs

`GET /v1/accounts/{accountId}/stats`

Precomputed per-account document-funnel KPIs. `granularity=monthly` (default) returns the last 12 months, most recent first; `granularity=daily` with `month=YYYY-MM` returns that month's days. Series are zero-filled.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `granularity` | query | string | no | `monthly` (default) or `daily`. |
| `month` | query | string | no | Target month `YYYY-MM` (required when `granularity=daily`). |

#### Responses

##### 200 — KPI series

```json
{
    "data": [
        {
            "period": "2026-06",
            "documents_uploaded": 42,
            "documents_sent": 37,
            "signature_requests": 61,
            "signature_requests_email": "user1@example.com",
            "signature_requests_whatsapp": 18,
            "signature_requests_viewed": 44,
            "signature_requests_completed": 52,
            "documents_certified": 30
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Documents

### List document activities

`GET /v1/documents/{documentId}/activities`

List the activities recorded for a document. Each entry carries an event-specific `payload` snapshot (keys vary per event) and the request `origin` (`ip`, `user-agent`).

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Responses

##### 200 — Document activities

```json
{
    "data": [
        {
            "id": 4,
            "event": "assignment_created",
            "message": "Assignment created by John Smith.",
            "payload": {},
            "origin": {
                "ip": "192.0.2.1",
                "user-agent": "string"
            },
            "created_at": "2022-07-19T19:28:13Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List documents

`GET /v1/accounts/{accountId}/documents`

List documents of the workspace.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `status` | query | string | no | Status filter, e.g. `pending_signature`. |
| `method` | query | string | no | Signature method filter. |
| `search` | query | string | no | Partial match on document.name, signer.full_name, signer.email. |
| `tags` | query | string | no | Comma-separated tag IDs; returns documents having ALL listed tags. |
| `sort` | query | string | no | Sort by `name` or `updated_at`. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page (max 100). |

#### Responses

##### 200 — A page of documents

```json
{
    "data": [
        {
            "resource": "document",
            "id": "example_id_3",
            "account_id": "example_id_4",
            "template_id": null,
            "name": "document.pdf",
            "status": "metadata_ready",
            "artifacts": {
                "original": "https://example.com/example-url-2"
            },
            "is_closed": false,
            "signing_url": "https://example.com/example-url-3",
            "decline_reason": null,
            "declined_by": null,
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string"
                }
            ],
            "assignment": {
                "resource": "assignment",
                "id": "example_id_6",
                "sender_email": "user2@example.com",
                "method": "virtual",
                "expires_at": null,
                "message": "string",
                "signers": [
                    {
                        "verification_method": "Email",
                        "notification_methods": [
                            "Email"
                        ],
                        "step": 1,
                        "notified": true,
                        "completed": true,
                        "notification_history": [
                            {
                                "event": "signature_request",
                                "status": "sent",
                                "error_code": "string",
                                "error_message": "string",
                                "sent_at": "2026-07-07T12:00:00Z",
                                "failed_at": null
                            }
                        ],
                        "resource": "signer",
                        "id": "example_id_7",
                        "full_name": "Example User",
                        "email": "user3@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "has_accepted_terms": false
                    }
                ],
                "copy_receivers": [
                    {}
                ],
                "items": [
                    {
                        "id": "example_id_5",
                        "page": null,
                        "signer": {},
                        "field": {},
                        "display_settings": null,
                        "value": null,
                        "completed": true
                    }
                ],
                "summary": {
                    "signer_count": 0,
                    "completed_count": 0,
                    "signers": [
                        {}
                    ]
                },
                "signing_urls": [
                    {
                        "signer_id": "example_id_5",
                        "url": "https://example.com/example-url-4"
                    }
                ]
            },
            "pages": [
                {
                    "id": "example_id_8",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-5"
                }
            ],
            "created_at": "2026-06-03T03:54:16Z",
            "updated_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Upload and create document

`POST /v1/accounts/{accountId}/documents`

Create a document from an uploaded file. Maximum file size 25MB; maximum 2000 pages.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`multipart/form-data`):

- `file` (string, required) — The PDF file to upload.

Example:

```json
{
    "file": "string"
}
```

#### Responses

##### 200 — The created document

```json
{
    "data": {
        "resource": "document",
        "id": "example_id_3",
        "account_id": "example_id_4",
        "template_id": null,
        "name": "document.pdf",
        "status": "metadata_ready",
        "artifacts": {
            "original": "https://example.com/example-url-2"
        },
        "is_closed": false,
        "signing_url": "https://example.com/example-url-3",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string"
            }
        ],
        "assignment": {
            "resource": "assignment",
            "id": "example_id_6",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": "string",
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": true,
                    "completed": true,
                    "notification_history": [
                        {
                            "event": "signature_request",
                            "status": "sent",
                            "error_code": "string",
                            "error_message": "string",
                            "sent_at": "2026-07-07T12:00:00Z",
                            "failed_at": null
                        }
                    ],
                    "resource": "signer",
                    "id": "example_id_7",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "has_accepted_terms": false
                }
            ],
            "copy_receivers": [
                {}
            ],
            "items": [
                {
                    "id": "example_id_5",
                    "page": null,
                    "signer": {},
                    "field": {},
                    "display_settings": null,
                    "value": null,
                    "completed": true
                }
            ],
            "summary": {
                "signer_count": 0,
                "completed_count": 0,
                "signers": [
                    {}
                ]
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-4"
                }
            ]
        },
        "pages": [
            {
                "id": "example_id_8",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Search documents (lightweight)

`GET /v1/accounts/{accountId}/documents/search`

Search documents of the workspace, returning a compact representation (no expanded assignment/pages).

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `search` | query | string | no | Search term. |
| `status` | query | string | no |  |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page (max 100). |

#### Responses

##### 200 — Matching documents

```json
{
    "data": [
        {
            "resource": "document",
            "id": "example_id_3",
            "account_id": "example_id_4",
            "template_id": null,
            "name": "document.pdf",
            "status": "metadata_ready",
            "artifacts": {
                "original": "https://example.com/example-url-2"
            },
            "is_closed": false,
            "signing_url": "https://example.com/example-url-3",
            "decline_reason": null,
            "declined_by": null,
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string"
                }
            ],
            "assignment": {
                "resource": "assignment",
                "id": "example_id_6",
                "sender_email": "user2@example.com",
                "method": "virtual",
                "expires_at": null,
                "message": "string",
                "signers": [
                    {
                        "verification_method": "Email",
                        "notification_methods": [
                            "Email"
                        ],
                        "step": 1,
                        "notified": true,
                        "completed": true,
                        "notification_history": [
                            {
                                "event": "signature_request",
                                "status": "sent",
                                "error_code": "string",
                                "error_message": "string",
                                "sent_at": "2026-07-07T12:00:00Z",
                                "failed_at": null
                            }
                        ],
                        "resource": "signer",
                        "id": "example_id_7",
                        "full_name": "Example User",
                        "email": "user3@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "has_accepted_terms": false
                    }
                ],
                "copy_receivers": [
                    {}
                ],
                "items": [
                    {
                        "id": "example_id_5",
                        "page": null,
                        "signer": {},
                        "field": {},
                        "display_settings": null,
                        "value": null,
                        "completed": true
                    }
                ],
                "summary": {
                    "signer_count": 0,
                    "completed_count": 0,
                    "signers": [
                        {}
                    ]
                },
                "signing_urls": [
                    {
                        "signer_id": "example_id_5",
                        "url": "https://example.com/example-url-4"
                    }
                ]
            },
            "pages": [
                {
                    "id": "example_id_8",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-5"
                }
            ],
            "created_at": "2026-06-03T03:54:16Z",
            "updated_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List document statuses

`GET /v1/documents/statuses`

The supported document statuses and whether a document in each status can be deleted.

| Status | Deletable | Description |
|--------|-----------|-------------|
| `uploading` | no | The document upload is in process. |
| `uploaded` | no | The document has been uploaded. |
| `metadata_processing` | no | The initial processing is under way. |
| `metadata_ready` | yes | The initial processing has been completed. |
| `expired` | yes | The signature deadline has been reached. |
| `certificating` | no | The document has been signed and is being certificated. |
| `certificated` | no | The document is certificated. |
| `rejected_by_signer` | yes | A signer declined signing the document. |
| `pending_signature` | yes | The document is waiting for signatures. |
| `rejected_by_user` | yes | The signature process was cancelled by a user. |
| `failed` | yes | The document processing has failed. |

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — Supported statuses

```json
{
    "data": [
        {
            "code": "metadata_ready",
            "deletable": true
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Get document

`GET /v1/documents/{documentId}`

Get a document by its ID. `decline_reason` is only present when the access token belongs to the document's creator.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Responses

##### 200 — The document

```json
{
    "data": {
        "resource": "document",
        "id": "example_id_3",
        "account_id": "example_id_4",
        "template_id": null,
        "name": "document.pdf",
        "status": "metadata_ready",
        "artifacts": {
            "original": "https://example.com/example-url-2"
        },
        "is_closed": false,
        "signing_url": "https://example.com/example-url-3",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string"
            }
        ],
        "assignment": {
            "resource": "assignment",
            "id": "example_id_6",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": "string",
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": true,
                    "completed": true,
                    "notification_history": [
                        {
                            "event": "signature_request",
                            "status": "sent",
                            "error_code": "string",
                            "error_message": "string",
                            "sent_at": "2026-07-07T12:00:00Z",
                            "failed_at": null
                        }
                    ],
                    "resource": "signer",
                    "id": "example_id_7",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "has_accepted_terms": false
                }
            ],
            "copy_receivers": [
                {}
            ],
            "items": [
                {
                    "id": "example_id_5",
                    "page": null,
                    "signer": {},
                    "field": {},
                    "display_settings": null,
                    "value": null,
                    "completed": true
                }
            ],
            "summary": {
                "signer_count": 0,
                "completed_count": 0,
                "signers": [
                    {}
                ]
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-4"
                }
            ]
        },
        "pages": [
            {
                "id": "example_id_8",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Delete document

`DELETE /v1/documents/{documentId}`

Delete a document by its ID. Only documents in a deletable status can be removed (see GET /v1/documents/statuses).

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Responses

##### 200 — Document deleted

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Rename document

`PATCH /v1/documents/{documentId}`

Update a document's name. Only allowed before any assignment is created (i.e. while the document is in `uploaded` or `metadata_ready` status and has no signers yet); once the signature process has started or the document is certificated, the name is locked. The name is normalized: diacritics are removed and unsupported characters are replaced with dashes.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string, required)

Example:

```json
{
    "name": "Service agreement.pdf"
}
```

#### Responses

##### 200 — The updated document

```json
{
    "data": {
        "resource": "document",
        "id": "example_id_3",
        "account_id": "example_id_4",
        "template_id": null,
        "name": "document.pdf",
        "status": "metadata_ready",
        "artifacts": {
            "original": "https://example.com/example-url-2"
        },
        "is_closed": false,
        "signing_url": "https://example.com/example-url-3",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string"
            }
        ],
        "assignment": {
            "resource": "assignment",
            "id": "example_id_6",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": "string",
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": true,
                    "completed": true,
                    "notification_history": [
                        {
                            "event": "signature_request",
                            "status": "sent",
                            "error_code": "string",
                            "error_message": "string",
                            "sent_at": "2026-07-07T12:00:00Z",
                            "failed_at": null
                        }
                    ],
                    "resource": "signer",
                    "id": "example_id_7",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "has_accepted_terms": false
                }
            ],
            "copy_receivers": [
                {}
            ],
            "items": [
                {
                    "id": "example_id_5",
                    "page": null,
                    "signer": {},
                    "field": {},
                    "display_settings": null,
                    "value": null,
                    "completed": true
                }
            ],
            "summary": {
                "signer_count": 0,
                "completed_count": 0,
                "signers": [
                    {}
                ]
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-4"
                }
            ]
        },
        "pages": [
            {
                "id": "example_id_8",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Download document artifact

`GET /v1/documents/{documentId}/download/{artifactName}`

Download a document artifact. Artifact types: original, certificated, certificate-page, pades, bundle. The pades artifact (signers' ICP-Brasil signatures + platform certification box) is only present on documents that had digital-certificate signers; `bundle` is a zip of the original, certificated and certificate-page artifacts, plus the pades artifact on documents that have one.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `artifactName` | path | string | yes | Artifact type. |

#### Responses

##### 200 — The artifact binary

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Verify a signed document

`GET /v1/documents/{documentSignatureHash}/verify`

Verify a document by its signature hash (found on a signed document) and return its certification details. Always returns `200`: when the hash is not found or the document is not signed, `is_valid` is `false`, the other fields are `null`, and `message` explains why. Public endpoint.

**Authentication:** none (public endpoint).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentSignatureHash` | path | string | yes | The document signature hash. |

#### Responses

##### 200 — Verification result

```json
{
    "data": {
        "hash": "example_id_9",
        "id": "example_id_10",
        "status": "certificated",
        "page_count": "1",
        "signer_count": "1",
        "completed_count": 1,
        "completed_at": "2023-01-27T19:27:44Z",
        "verified_at": "2023-01-27T19:27:46Z",
        "is_valid": true,
        "message": ""
    },
    "status": 200,
    "message": ""
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List document tags

`GET /v1/accounts/{accountId}/documents/{documentId}/tags`

List the tags attached to a document.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | The document ID. |

#### Responses

##### 200 — Attached tags

```json
{
    "data": [
        {
            "resource": "tag",
            "id": "example_id_11",
            "name": "Contracts",
            "color": "ff8800",
            "created_at": "2026-05-14T12:00:00Z",
            "updated_at": "2026-05-14T12:00:00Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Replace document tags

`PUT /v1/accounts/{accountId}/documents/{documentId}/tags`

Replace the full set of tags attached to a document.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | The document ID. |

#### Request Body (required)

Fields (`application/json`):

- `tags` (array) — Tag IDs.

Example:

```json
{
    "tags": [
        "string"
    ]
}
```

#### Responses

##### 200 — Updated tags

```json
{
    "data": [
        {
            "resource": "tag",
            "id": "example_id_11",
            "name": "Contracts",
            "color": "ff8800",
            "created_at": "2026-05-14T12:00:00Z",
            "updated_at": "2026-05-14T12:00:00Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Attach document tags

`POST /v1/accounts/{accountId}/documents/{documentId}/tags`

Attach one or more tags to a document.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | The document ID. |

#### Request Body (required)

Fields (`application/json`):

- `tags` (array) — Tag IDs.

Example:

```json
{
    "tags": [
        "string"
    ]
}
```

#### Responses

##### 200 — Attached tags

```json
{
    "data": [
        {
            "resource": "tag",
            "id": "example_id_11",
            "name": "Contracts",
            "color": "ff8800",
            "created_at": "2026-05-14T12:00:00Z",
            "updated_at": "2026-05-14T12:00:00Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Detach document tag

`DELETE /v1/accounts/{accountId}/documents/{documentId}/tags/{tagId}`

Detach a single tag from a document.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | The document ID. |
| `tagId` | path | string | yes | The tag ID. |

#### Responses

##### 200 — Tag detached

```json
{
    "data": {
        "detached": true
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Download document thumbnail

`GET /v1/documents/{documentId}/thumbnail`

Download the thumbnail image of a document's first page.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Responses

##### 200 — The thumbnail image

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Download document page

`GET /v1/documents/{documentId}/pages/{pageId}/download`

Download the rendered image of a specific document page.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `pageId` | path | string | yes | The page ID. |

#### Responses

##### 200 — The page image

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Create document from template

`POST /v1/accounts/{accountId}/templates/{templateId}/documents`

Generate a new document from a template, creating its assignment in the same call. Provide one signer entry per template role; the signers must already exist in the account.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `templateId` | path | string | yes | The template ID. |

#### Request Body (required)

Fields (`application/json`):

- `signers` (array, required) — One entry per template role.
- `editor_fields` (array) — Editor field values to bake into the generated document.
- `name` (string) — Title for the document. Defaults to the template name.
- `message` (string) — Optional message sent to signers.
- `expires_at` (string) — Assignment expiration date (ISO 8601). No expiration by default.
- `tags` (array) — Tag names to attach to the new document. Names that don't exist are auto-created. The template's default-document-tags are always applied; values here are merged on top (duplicates removed).

Example:

```json
{
    "signers": [
        {
            "role_id": "example_id_12",
            "id": "example_id_13",
            "verification_method": "Email",
            "notification_methods": [
                "Email"
            ],
            "step": 1
        }
    ],
    "editor_fields": [
        {
            "field_id": "example_id_14",
            "value": "Field value"
        }
    ],
    "name": "sample-contract-one-page.pdf",
    "message": "Message to the signers",
    "expires_at": "2024-07-30T23:59:00Z",
    "tags": [
        "string"
    ]
}
```

#### Responses

##### 200 — The created document

```json
{
    "data": {
        "resource": "document",
        "id": "example_id_3",
        "account_id": "example_id_4",
        "template_id": null,
        "name": "document.pdf",
        "status": "metadata_ready",
        "artifacts": {
            "original": "https://example.com/example-url-2"
        },
        "is_closed": false,
        "signing_url": "https://example.com/example-url-3",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string"
            }
        ],
        "assignment": {
            "resource": "assignment",
            "id": "example_id_6",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": "string",
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": true,
                    "completed": true,
                    "notification_history": [
                        {
                            "event": "signature_request",
                            "status": "sent",
                            "error_code": "string",
                            "error_message": "string",
                            "sent_at": "2026-07-07T12:00:00Z",
                            "failed_at": null
                        }
                    ],
                    "resource": "signer",
                    "id": "example_id_7",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "has_accepted_terms": false
                }
            ],
            "copy_receivers": [
                {}
            ],
            "items": [
                {
                    "id": "example_id_5",
                    "page": null,
                    "signer": {},
                    "field": {},
                    "display_settings": null,
                    "value": null,
                    "completed": true
                }
            ],
            "summary": {
                "signer_count": 0,
                "completed_count": 0,
                "signers": [
                    {}
                ]
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-4"
                }
            ]
        },
        "pages": [
            {
                "id": "example_id_8",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Estimate document-from-template cost

`POST /v1/accounts/{accountId}/templates/{templateId}/documents/estimate-cost`

Estimate the cost of creating a document from a template without creating it. Contact information is not required — only the role_id and optionally a verification or notification method are needed. Each document always consumes 1 document from the plan's monthly allowance; if exhausted, the ExtraDocument cost is charged from credits (needs_extra_document = true). blocking_reason may be PendingPayment, InsufficientDocuments, or InsufficientCredits.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `templateId` | path | string | yes | The template ID. |

#### Request Body (required)

Fields (`application/json`):

- `signers` (array, required) — One entry per template role (editor roles are ignored for cost calculation).

Example:

```json
{
    "signers": [
        {
            "role_id": "example_id_12",
            "verification_method": "Whatsapp",
            "notification_methods": [
                "Whatsapp"
            ]
        }
    ]
}
```

#### Responses

##### 200 — Cost estimate

```json
{
    "data": {
        "documents": 1,
        "credits": 0,
        "needs_extra_document": true,
        "extra_document_cost": 1,
        "total_credits": 0,
        "breakdown": [
            {
                "code": "NotificationWhatsapp",
                "name": "Whatsapp Notification",
                "cost": 0.9,
                "quantity": 2,
                "unit_cost": 0.45
            }
        ],
        "document_balance": 0,
        "credit_balance": 0,
        "has_sufficient_resources": true,
        "blocking_reason": null,
        "message": "string"
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Assignments

### List assignments

`GET /v1/assignments`

List the assignments belonging to the authenticated user's current account.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page (max 100). |

#### Responses

##### 200 — A page of assignments

```json
{
    "data": [
        {
            "resource": "assignment",
            "id": "example_id_6",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": "string",
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": true,
                    "completed": true,
                    "notification_history": [
                        {
                            "event": "signature_request",
                            "status": "sent",
                            "error_code": "string",
                            "error_message": "string",
                            "sent_at": "2026-07-07T12:00:00Z",
                            "failed_at": null
                        }
                    ],
                    "resource": "signer",
                    "id": "example_id_7",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "has_accepted_terms": false
                }
            ],
            "copy_receivers": [
                {}
            ],
            "items": [
                {
                    "id": "example_id_5",
                    "page": null,
                    "signer": {},
                    "field": {},
                    "display_settings": null,
                    "value": null,
                    "completed": true
                }
            ],
            "summary": {
                "signer_count": 0,
                "completed_count": 0,
                "signers": [
                    {}
                ]
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-4"
                }
            ]
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Create assignment (request signatures)

`POST /v1/documents/{documentId}/assignments`

Request signatures on a document. Use `method: virtual` to sign without input fields, or `method: collect` to place input fields on specific pages.

For **virtual**, the document may be in `uploaded`, `metadata_processing` or `metadata_ready`; it is promoted to `pending_signature` automatically once metadata processing completes. For **collect**, the document must be in `metadata_ready` (fields reference specific pages).

`step` controls signing order: signers sharing a step sign in parallel, and the next step is notified only after the previous step completes. If supplied, every signer must supply it and values must be contiguous starting at 1.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Request Body (required)

Fields (`application/json`):

- `method` (string, required)
- `signers` (array, required)
- `entries` (array) — Required for `collect`: field placements per page.
- `message` (string) — Text included in the invitation email.
- `expires_at` (string) — ISO 8601; default is no expiration.
- `copy_receivers` (array) — Signer IDs that only receive a copy.

Example — Create without input (method: virtual, with verification & notification methods):

```json
{
    "method": "virtual",
    "signers": [
        {
            "id": "example_id_15",
            "verification_method": "Email",
            "notification_methods": [
                "Email"
            ],
            "step": 1
        },
        {
            "id": "example_id_16",
            "verification_method": "Whatsapp",
            "notification_methods": [
                "Whatsapp"
            ],
            "step": 2
        }
    ],
    "expires_at": "2021-09-30T21:00:00Z"
}
```

Example — Create with input fields (method: collect, with verification & notification methods):

```json
{
    "method": "collect",
    "signers": [
        {
            "id": "example_id_17",
            "verification_method": "Email",
            "notification_methods": [
                "Email"
            ],
            "step": 1
        },
        {
            "id": "example_id_18",
            "verification_method": "Whatsapp",
            "notification_methods": [
                "Whatsapp"
            ],
            "step": 2
        }
    ],
    "entries": [
        {
            "page_id": "example_id_19",
            "fields": [
                {
                    "signer_id": "example_id_17",
                    "field_id": "example_id_20",
                    "display_settings": {
                        "left": 69,
                        "top": 282,
                        "width": 421,
                        "height": 45.86,
                        "fontFamily": "Arial",
                        "fontSize": 18,
                        "backgroundColor": "rgb(185, 218, 255)"
                    }
                },
                {
                    "signer_id": "example_id_18",
                    "field_id": "example_id_20",
                    "display_settings": {
                        "left": 639,
                        "top": 285,
                        "width": 421,
                        "height": 45.86,
                        "fontFamily": "Arial",
                        "fontSize": 18,
                        "backgroundColor": "rgb(195, 230, 203)"
                    }
                }
            ]
        }
    ],
    "expires_at": "2021-09-30T21:00:00Z"
}
```

Example — Create without input (method: virtual):

```json
{
    "method": "virtual",
    "signers": [
        {
            "id": "example_id_15",
            "step": 1
        },
        {
            "id": "example_id_16",
            "step": 2
        }
    ],
    "expires_at": "2021-09-30T21:00:00Z"
}
```

Example — Create with input fields (method: collect):

```json
{
    "method": "collect",
    "signers": [
        {
            "id": "example_id_17",
            "step": 1
        },
        {
            "id": "example_id_18",
            "step": 2
        }
    ],
    "entries": [
        {
            "page_id": "example_id_19",
            "fields": [
                {
                    "signer_id": "example_id_17",
                    "field_id": "example_id_20",
                    "display_settings": {
                        "left": 69,
                        "top": 282,
                        "width": 421,
                        "height": 45.86,
                        "fontFamily": "Arial",
                        "fontSize": 18,
                        "backgroundColor": "rgb(185, 218, 255)"
                    }
                },
                {
                    "signer_id": "example_id_18",
                    "field_id": "example_id_20",
                    "display_settings": {
                        "left": 639,
                        "top": 285,
                        "width": 421,
                        "height": 45.86,
                        "fontFamily": "Arial",
                        "fontSize": 18,
                        "backgroundColor": "rgb(195, 230, 203)"
                    }
                }
            ]
        }
    ],
    "expires_at": "2021-09-30T21:00:00Z"
}
```

#### Responses

##### 200 — The created assignment

**Virtual assignment created**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "assignment",
        "id": "example_id_21",
        "sender_email": "user2@example.com",
        "method": "virtual",
        "expires_at": "2021-09-30T21:00:00Z",
        "message": null,
        "signers": [
            {
                "id": "example_id_15",
                "full_name": "Example User",
                "email": "user4@example.com",
                "verification_method": "Email",
                "notification_methods": [
                    "Email"
                ],
                "step": 1,
                "notified": true,
                "completed": false
            },
            {
                "id": "example_id_16",
                "full_name": "Example User",
                "email": "user5@example.com",
                "verification_method": "Whatsapp",
                "notification_methods": [
                    "Whatsapp"
                ],
                "step": 2,
                "notified": false,
                "completed": false
            }
        ],
        "copy_receivers": [],
        "items": [
            {
                "id": "example_id_22",
                "page": null,
                "signer": {
                    "id": "example_id_15",
                    "full_name": "Example User",
                    "email": "user4@example.com"
                },
                "field": {
                    "id": "example_id_23",
                    "name": "Virtual",
                    "type": "virtual"
                },
                "display_settings": [],
                "value": null,
                "completed": false
            }
        ],
        "summary": {
            "signer_count": 2,
            "completed_count": 0,
            "signers": [
                {
                    "id": "example_id_15",
                    "full_name": "Example User",
                    "email": "user4@example.com",
                    "completed": false
                },
                {
                    "id": "example_id_16",
                    "full_name": "Example User",
                    "email": "user5@example.com",
                    "completed": false
                }
            ]
        },
        "signing_urls": [
            {
                "signer_id": "example_id_15",
                "url": "https://example.com/example-url-6"
            },
            {
                "signer_id": "example_id_16",
                "url": "https://example.com/example-url-7"
            }
        ]
    }
}
```

**Collect assignment created**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "assignment",
        "id": "example_id_6",
        "sender_email": "user2@example.com",
        "method": "collect",
        "expires_at": "2021-09-30T21:00:00Z",
        "message": null,
        "signers": [
            {
                "id": "example_id_17",
                "full_name": "Example User",
                "email": "user6@example.com",
                "verification_method": "Email",
                "notification_methods": [
                    "Email"
                ],
                "step": 1,
                "notified": true,
                "completed": false
            },
            {
                "id": "example_id_18",
                "full_name": "Example User",
                "email": "user7@example.com",
                "verification_method": "Whatsapp",
                "notification_methods": [
                    "Whatsapp"
                ],
                "step": 2,
                "notified": false,
                "completed": false
            }
        ],
        "copy_receivers": [],
        "items": [
            {
                "id": "example_id_24",
                "page": {
                    "id": "example_id_19",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-8"
                },
                "signer": {
                    "id": "example_id_17",
                    "full_name": "Example User",
                    "email": "user6@example.com"
                },
                "field": {
                    "id": "example_id_20",
                    "name": "Signature",
                    "type": "signature"
                },
                "display_settings": {
                    "top": 282,
                    "left": 69,
                    "width": 421,
                    "height": 45.86,
                    "fontSize": 18,
                    "fontFamily": "Arial",
                    "backgroundColor": "rgb(185, 218, 255)"
                },
                "value": null,
                "completed": false
            },
            {
                "id": "example_id_25",
                "page": {
                    "id": "example_id_19",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-8"
                },
                "signer": {
                    "id": "example_id_18",
                    "full_name": "Example User",
                    "email": "user7@example.com"
                },
                "field": {
                    "id": "example_id_20",
                    "name": "Signature",
                    "type": "signature"
                },
                "display_settings": {
                    "top": 285,
                    "left": 639,
                    "width": 421,
                    "height": 45.86,
                    "fontSize": 18,
                    "fontFamily": "Arial",
                    "backgroundColor": "rgb(195, 230, 203)"
                },
                "value": null,
                "completed": false
            }
        ],
        "summary": {
            "signer_count": 2,
            "completed_count": 0,
            "signers": [
                {
                    "id": "example_id_17",
                    "full_name": "Example User",
                    "email": "user6@example.com",
                    "completed": false
                },
                {
                    "id": "example_id_18",
                    "full_name": "Example User",
                    "email": "user7@example.com",
                    "completed": false
                }
            ]
        },
        "signing_urls": [
            {
                "signer_id": "example_id_17",
                "url": "https://example.com/example-url-9"
            },
            {
                "signer_id": "example_id_18",
                "url": "https://example.com/example-url-10"
            }
        ]
    }
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Estimate assignment cost

`POST /v1/documents/{documentId}/assignments/estimate-cost`

Estimate the cost of creating an assignment without creating it, returning a cost breakdown and the current account balances. Signer IDs are not required — only the verification/notification method affects cost. Each assignment consumes 1 document from the plan allowance; if exhausted, an extra document is charged from credits (`needs_extra_document` = true). `blocking_reason` may be `PendingPayment`, `InsufficientDocuments` or `InsufficientCredits`.

##### Pricing

Per-unit costs (in credits) used to build the estimate:

| Item | Cost |
|------|------|
| Extra document | 1 credit |
| Email notification | 0 credits |
| WhatsApp notification | 0.45 credits |
| Digital certificate signature (per signer) | 2 credits |

A `DigitalCertificate` signer adds the digital-certificate signature cost **on top of** its notification cost; it appears in the `breakdown` under the `SignatureDigitalCertificate` code.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Request Body (required)

Fields (`application/json`):

- `method` (string)
- `signers` (array) — Required for `virtual`; each entry may be `{}` to default to Email.
- `entries` (array) — Required for `collect`.

Example:

```json
{
    "method": "virtual",
    "signers": [
        {
            "verification_method": "Whatsapp",
            "notification_methods": [
                "Email"
            ]
        }
    ],
    "entries": [
        {}
    ]
}
```

#### Responses

##### 200 — Cost estimate and balances

```json
{
    "data": {
        "documents": 1,
        "credits": 0,
        "needs_extra_document": true,
        "extra_document_cost": 1,
        "total_credits": 0,
        "breakdown": [
            {
                "code": "NotificationWhatsapp",
                "name": "Whatsapp Notification",
                "cost": 0.9,
                "quantity": 2,
                "unit_cost": 0.45
            }
        ],
        "document_balance": 0,
        "credit_balance": 0,
        "has_sufficient_resources": true,
        "blocking_reason": null,
        "message": "string"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Resend signature request

`PUT /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/resend`

Resend the signature-request notification to a specific signer of an assignment.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Responses

##### 200 — Resend result

```json
{
    "data": {
        "is_sent": true,
        "document_id": "example_id_5",
        "signer_id": "example_id_5"
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Estimate resend cost

`POST /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/estimate-resend-cost`

Estimate the cost of resending the signature request to a signer.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Responses

##### 200 — Cost estimate

```json
{
    "data": {
        "documents": 1,
        "credits": 0,
        "needs_extra_document": true,
        "extra_document_cost": 1,
        "total_credits": 0,
        "breakdown": [
            {
                "code": "NotificationWhatsapp",
                "name": "Whatsapp Notification",
                "cost": 0.9,
                "quantity": 2,
                "unit_cost": 0.45
            }
        ],
        "document_balance": 0,
        "credit_balance": 0,
        "has_sufficient_resources": true,
        "blocking_reason": null,
        "message": "string"
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Reset assignment expiration

`PUT /v1/documents/{documentId}/assignments/{assignmentId}/reset-expiration`

Set a new expiration date for an assignment.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |

#### Request Body (required)

Fields (`application/json`):

- `expires_at` (string) — New expiration date (ISO 8601).

Example:

```json
{
    "expires_at": "2026-12-31T23:59:59Z"
}
```

#### Responses

##### 200 — The updated assignment

```json
{
    "data": {
        "resource": "assignment",
        "id": "example_id_6",
        "sender_email": "user2@example.com",
        "method": "virtual",
        "expires_at": null,
        "message": "string",
        "signers": [
            {
                "verification_method": "Email",
                "notification_methods": [
                    "Email"
                ],
                "step": 1,
                "notified": true,
                "completed": true,
                "notification_history": [
                    {
                        "event": "signature_request",
                        "status": "sent",
                        "error_code": "string",
                        "error_message": "string",
                        "sent_at": "2026-07-07T12:00:00Z",
                        "failed_at": null
                    }
                ],
                "resource": "signer",
                "id": "example_id_7",
                "full_name": "Example User",
                "email": "user3@example.com",
                "whatsapp_phone_number": "+5500000000000",
                "has_accepted_terms": false
            }
        ],
        "copy_receivers": [
            {}
        ],
        "items": [
            {
                "id": "example_id_5",
                "page": null,
                "signer": {},
                "field": {},
                "display_settings": null,
                "value": null,
                "completed": true
            }
        ],
        "summary": {
            "signer_count": 0,
            "completed_count": 0,
            "signers": [
                {}
            ]
        },
        "signing_urls": [
            {
                "signer_id": "example_id_5",
                "url": "https://example.com/example-url-4"
            }
        ]
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List WhatsApp notifications

`GET /v1/documents/{documentId}/assignments/{assignmentId}/whatsapp-notifications`

List all WhatsApp notification messages sent for an assignment. The response includes the rendered template text split into `header`, `body` and `buttons` — exactly what the signer would see. In sandbox/stage, WhatsApp messages are simulated (no real delivery) and button URLs include access/verification codes you can use to simulate the signing flow.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |

#### Responses

##### 200 — WhatsApp notifications

```json
{
    "data": [
        {
            "sent_at": 1710000000,
            "header": "Documento para assinatura: Contrato de Servico",
            "body": "string",
            "buttons": [
                {
                    "text": "Abrir documento"
                }
            ],
            "phone_number": "+5500000000000",
            "signer_id": "example_id_26"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Authentication

### Login

`POST /v1/login`

Authenticate with email and password and receive a JWT access token.

**Authentication:** none (public endpoint).

#### Request Body (required)

Fields (`application/json`):

- `email` (string, required)
- `password` (string, required)

Example:

```json
{
    "email": "user8@example.com",
    "password": "example_secret"
}
```

#### Responses

##### 200 — Access token, user and accounts

```json
{
    "data": {
        "access_token": "example_credential",
        "user": {
            "id": "example_id_27",
            "name": "John Smith",
            "email": "user9@example.com",
            "telephone": "+5500000000000",
            "government_id": "00000000000",
            "is_email_verified": false,
            "has_accepted_terms": true,
            "created_at": "2023-03-03T11:51:34Z",
            "to_be_deleted_at": null
        },
        "accounts": [
            {
                "id": "example_id_1",
                "name": "JS",
                "roles": [
                    "owner"
                ],
                "is_delete_allowed": true,
                "created_at": "2023-03-03T11:51:34Z"
            }
        ]
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Request password reset

`PUT /v1/authentication/request-password-reset`

Send the user an email with instructions to reset their password. Used when the password was forgotten or never set.

**Authentication:** none (public endpoint).

#### Request Body (required)

Fields (`application/json`):

- `email` (string, required)

Example:

```json
{
    "email": "user8@example.com"
}
```

#### Responses

##### 200 — Reset email sent

```json
{
    "data": {
        "email": "user8@example.com"
    },
    "status": 200,
    "message": ""
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Reset password

`PUT /v1/authentication/reset-password`

Reset the user's password using the token received by email.

**Authentication:** none (public endpoint).

#### Request Body (required)

Fields (`application/json`):

- `email` (string, required)
- `token` (string) — Token received by email.
- `new_password` (string, required)

Example:

```json
{
    "email": "user8@example.com",
    "token": "example_secret",
    "new_password": "example_secret"
}
```

#### Responses

##### 200 — Password reset

```json
{
    "data": {
        "email": "user8@example.com"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Change password

`PUT /v1/authentication/change-password`

Change the authenticated user's password.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body (required)

Fields (`application/json`):

- `email` (string, required)
- `password` (string, required) — The current password.
- `new_password` (string, required) — The new password.

Example:

```json
{
    "email": "user8@example.com",
    "password": "example_secret",
    "new_password": "example_secret"
}
```

#### Responses

##### 200 — Password changed

```json
{
    "data": {
        "email": "user8@example.com"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Social login

`POST /v1/authentication/social-login`

Exchange a token from a social login provider (currently only `google`) for an Assinafy access token.

**Authentication:** none (public endpoint).

#### Request Body (required)

Fields (`application/json`):

- `provider` (string, required)
- `token` (string, required) — Access/ID token from the provider.
- `has_accepted_terms` (boolean, required)

Example:

```json
{
    "provider": "google",
    "token": "example_secret",
    "has_accepted_terms": true
}
```

#### Responses

##### 200 — Access token, user and accounts

```json
{
    "data": {
        "access_token": "example_credential",
        "user": {
            "id": "example_id_27",
            "name": "John Smith",
            "email": "user9@example.com",
            "telephone": "+5500000000000",
            "government_id": "00000000000",
            "is_email_verified": false,
            "has_accepted_terms": true,
            "created_at": "2023-03-03T11:51:34Z",
            "to_be_deleted_at": null
        },
        "accounts": [
            {
                "id": "example_id_1",
                "name": "JS",
                "roles": [
                    "owner"
                ],
                "is_delete_allowed": true,
                "created_at": "2023-03-03T11:51:34Z"
            }
        ]
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Link social login

`POST /v1/auth/link-social-login`

Link a social-login provider account to the authenticated user.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body (required)

Fields (`application/json`):

- `provider` (string, required)
- `token` (string, required) — Token from the provider.

Example:

```json
{
    "provider": "google",
    "token": "example_secret"
}
```

#### Responses

##### 200 — Provider linked

```json
{
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Get API key

`GET /v1/users/api-keys`

Retrieve a masked version of the existing API key. The full key cannot be retrieved. Returns `null` when no key has been generated yet.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — The masked API key

```json
{
    "data": {
        "api_key": "example_credential"
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Create API key

`POST /v1/users/api-keys`

Generate an API key for the user, used via the `X-Api-Key` header. Generating a new key deletes the previous one. Never use an API key from a front-end application.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body (required)

Fields (`application/json`):

- `password` (string, required) — The user's password.

Example:

```json
{
    "password": "example_secret"
}
```

#### Responses

##### 200 — The generated API key (shown in full only once)

```json
{
    "data": {
        "api_key": "example_credential"
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Delete API key

`DELETE /v1/users/api-keys`

Delete the existing API key.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — API key deleted

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Fields

### List fields

`GET /v1/accounts/{accountId}/fields`

List the field definitions of a workspace.

When `include_standard` is enabled, records of type `signature`, `initial` and `signatureDate` are also returned.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `include_inactive` | query | boolean | no | Include inactive field definitions. |
| `include_standard` | query | boolean | no | Include standard field types (signature, initial, signatureDate). |

#### Responses

##### 200 — Field definitions

```json
{
    "data": [
        {
            "resource": "field",
            "id": "example_id_20",
            "name": "Signature",
            "type": "signature",
            "regex": "string",
            "is_pre_defined": true,
            "is_active": true,
            "is_required": true,
            "is_standard": true,
            "is_read_only": true,
            "is_visible": true
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Create field

`POST /v1/accounts/{accountId}/fields`

Create a field definition in the workspace.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string, required)
- `type` (string, required)
- `regex` (string)
- `is_required` (boolean)

Example:

```json
{
    "name": "Full name",
    "type": "text",
    "regex": "string",
    "is_required": true
}
```

#### Responses

##### 200 — The created field

```json
{
    "data": {
        "resource": "field",
        "id": "example_id_20",
        "name": "Signature",
        "type": "signature",
        "regex": "string",
        "is_pre_defined": true,
        "is_active": true,
        "is_required": true,
        "is_standard": true,
        "is_read_only": true,
        "is_visible": true
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Get field

`GET /v1/accounts/{accountId}/fields/{fieldId}`

Retrieve a single field definition.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `fieldId` | path | string | yes | The field ID. |

#### Responses

##### 200 — The field

```json
{
    "data": {
        "resource": "field",
        "id": "example_id_20",
        "name": "Signature",
        "type": "signature",
        "regex": "string",
        "is_pre_defined": true,
        "is_active": true,
        "is_required": true,
        "is_standard": true,
        "is_read_only": true,
        "is_visible": true
    },
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Update field

`PUT /v1/accounts/{accountId}/fields/{fieldId}`

Update a field definition.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `fieldId` | path | string | yes | The field ID. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string)
- `regex` (string)
- `is_active` (boolean)

Example:

```json
{
    "name": "string",
    "regex": "string",
    "is_active": true
}
```

#### Responses

##### 200 — The updated field

```json
{
    "data": {
        "resource": "field",
        "id": "example_id_20",
        "name": "Signature",
        "type": "signature",
        "regex": "string",
        "is_pre_defined": true,
        "is_active": true,
        "is_required": true,
        "is_standard": true,
        "is_read_only": true,
        "is_visible": true
    },
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Delete field

`DELETE /v1/accounts/{accountId}/fields/{fieldId}`

Delete a field definition.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `fieldId` | path | string | yes | The field ID. |

#### Responses

##### 200 — Field deleted

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Validate field value

`POST /v1/accounts/{accountId}/fields/{fieldId}/validate`

Validate an input value against a field definition. Typically called with a signer access code during the signing flow.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `fieldId` | path | string | yes | The field ID. |

#### Request Body (required)

Fields (`application/json`):

- `value` (object, required) — The input value to validate.

Example:

```json
{
    "value": "400.676.228-36"
}
```

#### Responses

##### 200 — Validation result

```json
{
    "data": {
        "type": "cpf",
        "success": true,
        "error_message": ""
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Validate multiple field values

`POST /v1/accounts/{accountId}/fields/validate-multiple`

Validate multiple input values at once. The request body is a JSON array of `{field_id, value}` objects.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Example:

```json
[
    {
        "field_id": "example_id_28",
        "value": "1111111111111"
    }
]
```

#### Responses

##### 200 — Validation results

```json
{
    "data": [
        {
            "field_id": "example_id_28",
            "type": "cpf",
            "success": false,
            "error_message": "Invalid CPF."
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List field types

`GET /v1/field-types`

List the possible field types. `cpf` expects 11 digits; `cnpj` accepts 14-char values (letters A-Z allowed in positions 1–12 per the CNPJ Alfanumérico rule; check digits 13–14 stay numeric). Punctuation is ignored during validation.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — Field types

```json
{
    "data": [
        {
            "type": "cpf",
            "name": "CPF"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Users

### Get my notification preferences

`GET /v1/users/self/notification-preferences`

Which owner-facing document notifications the authenticated user receives by e-mail. All nine keys are always returned; everything defaults to `true`. Account and security e-mail (welcome, password reset, invitations, account deletion) is not configurable and never appears here.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — The current preferences

```json
{
    "data": {
        "DocumentCompleted": true,
        "SignerDeclined": true,
        "DocumentCancelled": true,
        "DocumentAboutToExpire": true,
        "DocumentExpired": true,
        "DocumentExpirationReset": true,
        "DocumentProcessingFailed": true,
        "TemplateProcessingFailed": true,
        "SignerWhatsappFailed": true
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Update my notification preferences

`PUT /v1/users/self/notification-preferences`

Merges the supplied map into the authenticated user's preferences. Send only the keys you want to change — omitted keys keep their current value. Setting a key to `false` stops that e-mail for this user in every account they belong to. Returns the full map. An unknown code, a non-boolean value, or an empty body is rejected with 400 and nothing is written.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body (required)

Fields (`application/json`):

- `DocumentCompleted` (boolean) — Every signer has signed and the document is certified.
- `SignerDeclined` (boolean) — A signer declined to sign.
- `DocumentCancelled` (boolean) — The document was cancelled.
- `DocumentAboutToExpire` (boolean) — The signature deadline is approaching.
- `DocumentExpired` (boolean) — The signature deadline passed.
- `DocumentExpirationReset` (boolean) — The signature deadline was extended.
- `DocumentProcessingFailed` (boolean) — An uploaded document could not be processed.
- `TemplateProcessingFailed` (boolean) — A template could not be processed.
- `SignerWhatsappFailed` (boolean) — A WhatsApp notification to a signer could not be delivered.

Example:

```json
{
    "DocumentCompleted": true,
    "SignerDeclined": true,
    "DocumentCancelled": true,
    "DocumentAboutToExpire": true,
    "DocumentExpired": true,
    "DocumentExpirationReset": true,
    "DocumentProcessingFailed": true,
    "TemplateProcessingFailed": true,
    "SignerWhatsappFailed": true
}
```

#### Responses

##### 200 — The updated preferences

```json
{
    "data": {
        "DocumentCompleted": true,
        "SignerDeclined": true,
        "DocumentCancelled": true,
        "DocumentAboutToExpire": true,
        "DocumentExpired": true,
        "DocumentExpirationReset": true,
        "DocumentProcessingFailed": true,
        "TemplateProcessingFailed": true,
        "SignerWhatsappFailed": true
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### My cross-account document KPIs

`GET /v1/users/self/stats`

The authenticated user's document-funnel KPIs summed across all accounts they currently belong to. `granularity=monthly` (default) returns the last 12 months, most recent first; `granularity=daily` with `month=YYYY-MM` returns that month's days. Series are zero-filled.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `granularity` | query | string | no | `monthly` (default) or `daily`. |
| `month` | query | string | no | Target month `YYYY-MM` (required when `granularity=daily`). |

#### Responses

##### 200 — KPI series

```json
{
    "data": [
        {
            "period": "2026-06",
            "documents_uploaded": 42,
            "documents_sent": 37,
            "signature_requests": 61,
            "signature_requests_email": "user1@example.com",
            "signature_requests_whatsapp": 18,
            "signature_requests_viewed": 44,
            "signature_requests_completed": 52,
            "documents_certified": 30
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Get the authenticated user

`GET /v1/users/self`

Returns the profile of the user owning the access token.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — The current user

```json
{
    "data": {
        "id": "example_id_27",
        "name": "John Smith",
        "email": "user9@example.com",
        "telephone": "+5500000000000",
        "government_id": "00000000000",
        "is_email_verified": false,
        "has_accepted_terms": true,
        "created_at": "2023-03-03T11:51:34Z",
        "to_be_deleted_at": null
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Signing

### View public document

`GET /v1/public/documents/{documentId}`

Retrieve a publicly shared document by ID. Public endpoint.

**Authentication:** none (public endpoint).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | The document ID. |

#### Responses

##### 200 — The public document

```json
{
    "data": {
        "resource": "document",
        "id": "example_id_3",
        "account_id": "example_id_4",
        "template_id": null,
        "name": "document.pdf",
        "status": "metadata_ready",
        "artifacts": {
            "original": "https://example.com/example-url-2"
        },
        "is_closed": false,
        "signing_url": "https://example.com/example-url-3",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string"
            }
        ],
        "assignment": {
            "resource": "assignment",
            "id": "example_id_6",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": "string",
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": true,
                    "completed": true,
                    "notification_history": [
                        {
                            "event": "signature_request",
                            "status": "sent",
                            "error_code": "string",
                            "error_message": "string",
                            "sent_at": "2026-07-07T12:00:00Z",
                            "failed_at": null
                        }
                    ],
                    "resource": "signer",
                    "id": "example_id_7",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "has_accepted_terms": false
                }
            ],
            "copy_receivers": [
                {}
            ],
            "items": [
                {
                    "id": "example_id_5",
                    "page": null,
                    "signer": {},
                    "field": {},
                    "display_settings": null,
                    "value": null,
                    "completed": true
                }
            ],
            "summary": {
                "signer_count": 0,
                "completed_count": 0,
                "signers": [
                    {}
                ]
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-4"
                }
            ]
        },
        "pages": [
            {
                "id": "example_id_8",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Send access token for public document

`PUT /v1/public/documents/{documentId}/send-token`

Send a one-time access token (email/WhatsApp) to view a public document. Public endpoint.

**Authentication:** none (public endpoint).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | The document ID. |

#### Request Body

Fields (`application/json`):

- `email` (string)

Example:

```json
{
    "email": "user10@example.com"
}
```

#### Responses

##### 200 — Token sent

```json
{
    "status": 200,
    "message": ""
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Get current signer

`GET /v1/signers/self`

Return the signer identified by the signer access code, including the `has_signature`/`has_initial`/`is_signature_reusable` flags.

**Authentication:** signer access code (`access_code` query parameter).

#### Responses

##### 200 — The signer

```json
{
    "data": {
        "has_signature": true,
        "has_initial": false,
        "is_signature_reusable": false,
        "resource": "signer",
        "id": "example_id_7",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "has_accepted_terms": false
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Get signer's document

`GET /v1/signers/{signerId}/document`

Return the document and the signer's assignment items, scoped to the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signerId` | path | string | yes | The signer ID. |

#### Responses

##### 200 — The document with the signer's items

```json
{
    "data": {
        "resource": "document",
        "id": "example_id_3",
        "account_id": "example_id_4",
        "template_id": null,
        "name": "document.pdf",
        "status": "metadata_ready",
        "artifacts": {
            "original": "https://example.com/example-url-2"
        },
        "is_closed": false,
        "signing_url": "https://example.com/example-url-3",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string"
            }
        ],
        "assignment": {
            "resource": "assignment",
            "id": "example_id_6",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": "string",
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": true,
                    "completed": true,
                    "notification_history": [
                        {
                            "event": "signature_request",
                            "status": "sent",
                            "error_code": "string",
                            "error_message": "string",
                            "sent_at": "2026-07-07T12:00:00Z",
                            "failed_at": null
                        }
                    ],
                    "resource": "signer",
                    "id": "example_id_7",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "has_accepted_terms": false
                }
            ],
            "copy_receivers": [
                {}
            ],
            "items": [
                {
                    "id": "example_id_5",
                    "page": null,
                    "signer": {},
                    "field": {},
                    "display_settings": null,
                    "value": null,
                    "completed": true
                }
            ],
            "summary": {
                "signer_count": 0,
                "completed_count": 0,
                "signers": [
                    {}
                ]
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-4"
                }
            ]
        },
        "pages": [
            {
                "id": "example_id_8",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### View document to sign

`GET /v1/sign`

Retrieve the document a signer has been invited to sign, using the signer access code. Marks the document as viewed. Returns 409 while the document is still being prepared (retry with backoff).

**Signers whose verification method is `DigitalCertificate`** must have confirmed their data *and* accepted the terms before this returns the document; otherwise it is `400`. Both are satisfied in one call to `PUT /v1/documents/{documentId}/signers/confirm-data` with `has_accepted_terms: true`, so send that before this endpoint — the `has_accepted_terms` query parameter here is too late to open the gate. `PUT /v1/signers/accept-terms` also works and is never gated.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `has_accepted_terms` | query | boolean | no | Set true to record terms acceptance. |

#### Responses

##### 200 — The document with the signer's assignment

```json
{
    "data": {
        "resource": "document",
        "id": "example_id_3",
        "account_id": "example_id_4",
        "template_id": null,
        "name": "document.pdf",
        "status": "metadata_ready",
        "artifacts": {
            "original": "https://example.com/example-url-2"
        },
        "is_closed": false,
        "signing_url": "https://example.com/example-url-3",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string"
            }
        ],
        "assignment": {
            "resource": "assignment",
            "id": "example_id_6",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": "string",
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": true,
                    "completed": true,
                    "notification_history": [
                        {
                            "event": "signature_request",
                            "status": "sent",
                            "error_code": "string",
                            "error_message": "string",
                            "sent_at": "2026-07-07T12:00:00Z",
                            "failed_at": null
                        }
                    ],
                    "resource": "signer",
                    "id": "example_id_7",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "has_accepted_terms": false
                }
            ],
            "copy_receivers": [
                {}
            ],
            "items": [
                {
                    "id": "example_id_5",
                    "page": null,
                    "signer": {},
                    "field": {},
                    "display_settings": null,
                    "value": null,
                    "completed": true
                }
            ],
            "summary": {
                "signer_count": 0,
                "completed_count": 0,
                "signers": [
                    {}
                ]
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-4"
                }
            ]
        },
        "pages": [
            {
                "id": "example_id_8",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — A digital-certificate signer has not yet confirmed their data or accepted the terms.

##### 409 — The document is not ready to be viewed yet.

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Sign assignment items

`POST /v1/documents/{documentId}/assignments/{assignmentId}`

Sign a document with input fields (collect method): submit the signer's item values, completing their items. For **virtual** assignments the signer must first confirm their data via `PUT /v1/documents/{documentId}/signers/confirm-data`, otherwise this returns `400` (Signer data must be confirmed before signing). Signers whose verification method is `DigitalCertificate` cannot use this endpoint — their signature must be produced through `POST /v1/signers/certificate/start` + `/complete`, and this returns `400`. The request body is a JSON array of item entries. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |

#### Request Body (required)

Example:

```json
[
    {
        "itemId": "example_id_25",
        "fieldId": "example_id_20",
        "pageId": "example_id_19",
        "value": "Signed by Sonny Bayer"
    }
]
```

#### Responses

##### 200 — Signing result

```json
{
    "data": {},
    "status": 200,
    "message": ""
}
```

##### 400 — Signer data must be confirmed before signing (virtual assignments), or the signer must sign with a digital certificate through the digital certificate endpoints.

##### 409 — The document is not ready to be signed yet.

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Reject (decline) assignment

`PUT /v1/documents/{documentId}/assignments/{assignmentId}/reject`

The signer declines to sign the document, giving a reason. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |

#### Request Body (required)

Fields (`application/json`):

- `decline_reason` (string, required) — Descriptive reason for declining.

Example:

```json
{
    "decline_reason": "I do not agree with clause 2."
}
```

#### Responses

##### 200 — Assignment declined

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Sign multiple documents

`PUT /v1/signers/documents/sign-multiple`

Sign several documents in one request, for a signer with multiple pending documents. Each document must be prepared for the **virtual** signature method. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Request Body (required)

Fields (`application/json`):

- `document_ids` (array, required) — IDs of the documents to sign.

Example:

```json
{
    "document_ids": [
        "example_id_29",
        "example_id_30"
    ]
}
```

#### Responses

##### 200 — Signing result

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Decline multiple documents

`PUT /v1/signers/documents/decline-multiple`

Decline several documents in one request. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Request Body (required)

Fields (`application/json`):

- `document_ids` (array, required) — IDs of the documents to decline.
- `decline_reason` (string, required) — Reason for declining.

Example:

```json
{
    "document_ids": [
        "example_id_29",
        "example_id_30"
    ],
    "decline_reason": "Unfavorable terms."
}
```

#### Responses

##### 200 — Decline result

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Verify signer code (OTP)

`POST /v1/verify`

Submit the verification code (OTP) sent to the signer to unlock the signing flow. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Request Body (required)

Fields (`application/json`):

- `verification-code` (string, required)

Example:

```json
{
    "verification-code": "example_secret"
}
```

#### Responses

##### 200 — Code verified

```json
{
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Confirm signer data

`PUT /v1/documents/{documentId}/signers/confirm-data`

The signer confirms or updates their data before signing. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Request Body (required)

Fields (`application/json`):

- `full_name` (string)
- `email` (string)
- `government_id` (string)

Example:

```json
{
    "full_name": "Example User",
    "email": "user10@example.com",
    "government_id": "00000000000"
}
```

#### Responses

##### 200 — Data confirmed

```json
{
    "data": {
        "resource": "signer",
        "id": "example_id_7",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "has_accepted_terms": false
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Accept terms (signer)

`PUT /v1/signers/accept-terms`

Record that the signer accepted the terms of use. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Responses

##### 200 — Terms accepted

```json
{
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Upload signature image

`POST /v1/signature`

Upload the signer's signature (or initials) image as the raw request body. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `type` | query | string | no | Image type, e.g. `signature` or `initial`. |
| `reuse` | query | boolean | no | Whether the signer opted to reuse this signature in future processes. When set, updates the signer's `is_signature_reusable` flag; when omitted, the flag is left unchanged. |

#### Request Body (required)

Example:

```json
"string"
```

#### Responses

##### 200 — Signature stored

```json
{
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Download signature image

`GET /v1/signature/{signatureType}`

Download the signer's stored signature/initials image. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signatureType` | path | string | yes | Image type (e.g. `signature`, `initial`). |

#### Responses

##### 200 — The signature image

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List signer's documents

`GET /v1/signers/{signerId}/documents`

List the documents a signer is party to. Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signerId` | path | string | yes | The signer ID. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page (max 100). |

#### Responses

##### 200 — The signer's documents

```json
{
    "data": [
        {
            "resource": "document",
            "id": "example_id_3",
            "account_id": "example_id_4",
            "template_id": null,
            "name": "document.pdf",
            "status": "metadata_ready",
            "artifacts": {
                "original": "https://example.com/example-url-2"
            },
            "is_closed": false,
            "signing_url": "https://example.com/example-url-3",
            "decline_reason": null,
            "declined_by": null,
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string"
                }
            ],
            "assignment": {
                "resource": "assignment",
                "id": "example_id_6",
                "sender_email": "user2@example.com",
                "method": "virtual",
                "expires_at": null,
                "message": "string",
                "signers": [
                    {
                        "verification_method": "Email",
                        "notification_methods": [
                            "Email"
                        ],
                        "step": 1,
                        "notified": true,
                        "completed": true,
                        "notification_history": [
                            {
                                "event": "signature_request",
                                "status": "sent",
                                "error_code": "string",
                                "error_message": "string",
                                "sent_at": "2026-07-07T12:00:00Z",
                                "failed_at": null
                            }
                        ],
                        "resource": "signer",
                        "id": "example_id_7",
                        "full_name": "Example User",
                        "email": "user3@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "has_accepted_terms": false
                    }
                ],
                "copy_receivers": [
                    {}
                ],
                "items": [
                    {
                        "id": "example_id_5",
                        "page": null,
                        "signer": {},
                        "field": {},
                        "display_settings": null,
                        "value": null,
                        "completed": true
                    }
                ],
                "summary": {
                    "signer_count": 0,
                    "completed_count": 0,
                    "signers": [
                        {}
                    ]
                },
                "signing_urls": [
                    {
                        "signer_id": "example_id_5",
                        "url": "https://example.com/example-url-4"
                    }
                ]
            },
            "pages": [
                {
                    "id": "example_id_8",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-5"
                }
            ],
            "created_at": "2026-06-03T03:54:16Z",
            "updated_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Search signer's documents

`GET /v1/signers/{signerId}/documents/search`

Search the documents a signer is party to (compact representation). Uses the signer access code.

**Authentication:** signer access code (`access_code` query parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signerId` | path | string | yes | The signer ID. |
| `search` | query | string | no | Search term. |

#### Responses

##### 200 — Matching documents

```json
{
    "data": [
        {
            "resource": "document",
            "id": "example_id_3",
            "account_id": "example_id_4",
            "template_id": null,
            "name": "document.pdf",
            "status": "metadata_ready",
            "artifacts": {
                "original": "https://example.com/example-url-2"
            },
            "is_closed": false,
            "signing_url": "https://example.com/example-url-3",
            "decline_reason": null,
            "declined_by": null,
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string"
                }
            ],
            "assignment": {
                "resource": "assignment",
                "id": "example_id_6",
                "sender_email": "user2@example.com",
                "method": "virtual",
                "expires_at": null,
                "message": "string",
                "signers": [
                    {
                        "verification_method": "Email",
                        "notification_methods": [
                            "Email"
                        ],
                        "step": 1,
                        "notified": true,
                        "completed": true,
                        "notification_history": [
                            {
                                "event": "signature_request",
                                "status": "sent",
                                "error_code": "string",
                                "error_message": "string",
                                "sent_at": "2026-07-07T12:00:00Z",
                                "failed_at": null
                            }
                        ],
                        "resource": "signer",
                        "id": "example_id_7",
                        "full_name": "Example User",
                        "email": "user3@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "has_accepted_terms": false
                    }
                ],
                "copy_receivers": [
                    {}
                ],
                "items": [
                    {
                        "id": "example_id_5",
                        "page": null,
                        "signer": {},
                        "field": {},
                        "display_settings": null,
                        "value": null,
                        "completed": true
                    }
                ],
                "summary": {
                    "signer_count": 0,
                    "completed_count": 0,
                    "signers": [
                        {}
                    ]
                },
                "signing_urls": [
                    {
                        "signer_id": "example_id_5",
                        "url": "https://example.com/example-url-4"
                    }
                ]
            },
            "pages": [
                {
                    "id": "example_id_8",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-5"
                }
            ],
            "created_at": "2026-06-03T03:54:16Z",
            "updated_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Download signer's document artifact

`GET /v1/signers/{signerId}/documents/{documentId}/download/{artifactName}`

Download an artifact of a document the signer is party to. Public (signer-link) endpoint. Artifact types: original, certificated, certificate-page, pades, bundle. The pades artifact (signers' ICP-Brasil signatures + platform certification box) is only present on documents that had digital-certificate signers; `bundle` is a zip of the original, certificated and certificate-page artifacts, plus the pades artifact on documents that have one.

**Authentication:** none (public endpoint).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signerId` | path | string | yes | The signer ID. |
| `documentId` | path | string | yes | Document ID. |
| `artifactName` | path | string | yes | Artifact type. |

#### Responses

##### 200 — The artifact binary

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Signers

### List signers

`GET /v1/accounts/{accountId}/signers`

List the signers of a workspace.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `search` | query | string | no | Filter by full_name or email. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page (max 100). |

#### Responses

##### 200 — A page of signers

```json
{
    "data": [
        {
            "resource": "signer",
            "id": "example_id_7",
            "full_name": "Example User",
            "email": "user3@example.com",
            "whatsapp_phone_number": "+5500000000000",
            "has_accepted_terms": false
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Create signer

`POST /v1/accounts/{accountId}/signers`

Create a signer in the workspace.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `full_name` (string, required)
- `email` (string)
- `whatsapp_phone_number` (string) — E.164; normalized on save.

Example:

```json
{
    "full_name": "Example User",
    "email": "user3@example.com",
    "whatsapp_phone_number": "+5500000000000"
}
```

#### Responses

##### 200 — The created signer

```json
{
    "data": {
        "resource": "signer",
        "id": "example_id_7",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "has_accepted_terms": false
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Get signer

`GET /v1/accounts/{accountId}/signers/{signerId}`

Retrieve a signer's information.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Responses

##### 200 — The signer

```json
{
    "data": {
        "resource": "signer",
        "id": "example_id_7",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "has_accepted_terms": false
    },
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Update signer

`PUT /v1/accounts/{accountId}/signers/{signerId}`

Update a signer's information.

**Verification integrity:** `email` / `whatsapp_phone_number` cannot be changed while the signer has verified that channel on an in-flight (not yet certificated) document — the response is `400` naming the offending document(s). Already-certificated documents do not block updates. Changing a channel that has *unverified* in-flight requests rotates their access/verification codes (invalidating previously sent links/OTPs); use the resend endpoint to redeliver. `full_name` can always be updated.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Request Body (required)

Fields (`application/json`):

- `full_name` (string)
- `email` (string)
- `whatsapp_phone_number` (string) — E.164; normalized on save.
- `government_id` (string) — Signer's CPF/CNPJ; digits only on save.

Example:

```json
{
    "full_name": "Example User",
    "email": "user3@example.com",
    "whatsapp_phone_number": "+5500000000000",
    "government_id": "00000000000"
}
```

#### Responses

##### 200 — The updated signer

```json
{
    "data": {
        "resource": "signer",
        "id": "example_id_7",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "has_accepted_terms": false
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Delete signer

`DELETE /v1/accounts/{accountId}/signers/{signerId}`

Delete a signer.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Responses

##### 200 — Signer deleted

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Tags

### List tags

`GET /v1/accounts/{accountId}/tags`

List the tags of a workspace.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `search` | query | string | no | Search term. |

#### Responses

##### 200 — The workspace tags

```json
{
    "data": [
        {
            "resource": "tag",
            "id": "example_id_11",
            "name": "Contracts",
            "color": "ff8800",
            "created_at": "2026-05-14T12:00:00Z",
            "updated_at": "2026-05-14T12:00:00Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Create tag

`POST /v1/accounts/{accountId}/tags`

Create a tag in the workspace. Names are unique per workspace (case-insensitive); a collision returns 409.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string, required) — Trimmed; whitespace collapsed; max 64 chars.
- `color` (string) — 6-char hex (with or without leading #).

Example:

```json
{
    "name": "Contracts",
    "color": "ff8800"
}
```

#### Responses

##### 200 — The created tag

```json
{
    "data": {
        "resource": "tag",
        "id": "example_id_11",
        "name": "Contracts",
        "color": "ff8800",
        "created_at": "2026-05-14T12:00:00Z",
        "updated_at": "2026-05-14T12:00:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 409 — A tag with the same name already exists.

```json
{
    "status": 409,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Update tag

`PUT /v1/accounts/{accountId}/tags/{tagId}`

Update a tag's name or color.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `tagId` | path | string | yes | The tag ID. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string)
- `color` (string)

Example:

```json
{
    "name": "Signed Contracts",
    "color": "00aa55"
}
```

#### Responses

##### 200 — The updated tag

```json
{
    "data": {
        "resource": "tag",
        "id": "example_id_11",
        "name": "Contracts",
        "color": "ff8800",
        "created_at": "2026-05-14T12:00:00Z",
        "updated_at": "2026-05-14T12:00:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Delete tag

`DELETE /v1/accounts/{accountId}/tags/{tagId}`

Delete a tag. Pass `?force=true` to detach it from any documents/templates it is attached to.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `tagId` | path | string | yes | The tag ID. |
| `force` | query | boolean | no | Detach from resources before deleting. |

#### Responses

##### 200 — Tag deleted

```json
{
    "data": {
        "deleted": true
    },
    "status": 200,
    "message": ""
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Templates

### List templates

`GET /v1/accounts/{accountId}/templates`

List the templates of a workspace.

The `status` field of a template is one of:

| Status | Description |
|--------|-------------|
| `uploading` | The template is being uploaded. |
| `uploaded` | The template has been uploaded. |
| `processing` | The template is being processed. |
| `ready` | The template is ready to use. |
| `failed` | The template processing has failed. |

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `search` | query | string | no | Search term. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page (max 100). |

#### Responses

##### 200 — A page of templates (default_document_tags omitted in the list)

```json
{
    "data": [
        {
            "resource": "template",
            "id": "example_id_31",
            "name": "template.pdf",
            "document_name": "string",
            "message": "string",
            "status": "ready",
            "pages": [
                {
                    "id": "example_id_5",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-11",
                    "fields": [
                        {
                            "id": "example_id_5",
                            "field_id": "example_id_5",
                            "role_id": "example_id_5",
                            "label": "string",
                            "display_settings": null,
                            "created_at": "2026-01-01T00:00:00Z",
                            "updated_at": "2026-01-01T00:00:00Z"
                        }
                    ]
                }
            ],
            "roles": [
                {
                    "id": "example_id_5",
                    "name": "Editor",
                    "assignment_type": "Editor",
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-01-01T00:00:00Z"
                }
            ],
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string"
                }
            ],
            "default_document_tags": [
                {
                    "id": "example_id_5",
                    "name": "string"
                }
            ],
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

## Webhooks

### Get webhook subscription

`GET /v1/accounts/{accountId}/webhooks/subscriptions`

Retrieve the current webhook subscription for the account — which events it is subscribed to and the delivery configuration.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — The subscription

```json
{
    "data": {
        "events": [
            "document_ready",
            "document_prepared"
        ],
        "is_active": true,
        "url": "https://example.com/example-url-12",
        "email": "user11@example.com",
        "updated_at": "2023-05-10T14:58:24Z"
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Update webhook subscription

`PUT /v1/accounts/{accountId}/webhooks/subscriptions`

Update the webhook subscription settings for the account — which events are monitored, whether delivery is enabled, and the delivery/contact details.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `events` (array, required) — Event type codes to subscribe to (see `GET /v1/webhooks/event-types`).
- `is_active` (boolean, required) — Whether events should be delivered to the webhook.
- `url` (string, required) — The URL that will receive events.
- `email` (string, required) — Email that receives important webhook-communication notices.

Example:

```json
{
    "events": [
        "document_ready",
        "document_prepared"
    ],
    "is_active": true,
    "url": "https://example.com/example-url-12",
    "email": "user11@example.com"
}
```

#### Responses

##### 200 — The updated subscription

```json
{
    "data": {
        "events": [
            "document_ready",
            "document_prepared"
        ],
        "is_active": true,
        "url": "https://example.com/example-url-12",
        "email": "user11@example.com",
        "updated_at": "2023-05-10T14:58:24Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Inactivate webhook subscription

`PUT /v1/accounts/{accountId}/webhooks/inactivate`

Deactivate the webhook integration for the account. While inactive, no events are sent to the configured endpoint.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — The inactivated subscription

```json
{
    "data": {
        "events": [
            "document_ready",
            "document_prepared"
        ],
        "is_active": true,
        "url": "https://example.com/example-url-12",
        "email": "user11@example.com",
        "updated_at": "2023-05-10T14:58:24Z"
    },
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List webhook event types

`GET /v1/webhooks/event-types`

List all available event types that can be subscribed to via webhooks.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — Event types

```json
{
    "data": [
        {
            "id": "document_ready",
            "description": "Triggered when the last Signer of the assignment signs the Document."
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### List webhook deliveries

`GET /v1/accounts/{accountId}/webhooks`

Retrieve the delivery history for webhooks sent to the account's configured endpoint — use it to monitor status, debug failures, and verify payloads. Pagination is returned in the `X-Pagination-*` response headers.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `event` | query | string | no | Filter by event type (e.g. `document_ready`). |
| `delivered` | query | string | no | Filter by delivery status: `true` or `false`. |
| `from` | query | integer | no | Unix timestamp — only entries after this time. |
| `to` | query | integer | no | Unix timestamp — only entries before this time. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Items per page (default: 20). |

#### Responses

##### 200 — Delivery history

```json
{
    "data": [
        {
            "resource": "activity_dispatching_history",
            "id": "example_id_32",
            "event": "document_ready",
            "activity_id": 456,
            "endpoint": "https://example.com/example-url-13",
            "payload": {},
            "delivered": true,
            "http_status": 200,
            "response_body": "OK",
            "error": null,
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```

### Retry webhook delivery

`POST /v1/accounts/{accountId}/webhooks/{historyId}/retry`

Manually retry a webhook delivery for a specific entry, without waiting for automatic retries. Returns the newly created dispatch entry.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `historyId` | path | string | yes | The webhook dispatch entry ID to retry. |

#### Responses

##### 200 — The new dispatch entry

```json
{
    "data": {
        "resource": "activity_dispatching_history",
        "id": "example_id_32",
        "event": "document_ready",
        "activity_id": 456,
        "endpoint": "https://example.com/example-url-13",
        "payload": {},
        "delivered": true,
        "http_status": 200,
        "response_body": "OK",
        "error": null,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null
}
```
