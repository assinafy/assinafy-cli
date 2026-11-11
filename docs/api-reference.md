# Assinafy API v1 — request/response reference

Generated from the official [Assinafy OpenAPI document](https://api.assinafy.com.br/v1/docs/openapi.json) and its native Markdown renderer. It contains every published operation and the complete examples supplied by Assinafy. Runtime-only SDK helpers are documented in [sdk-reference.md](./sdk-reference.md).

The renderer reuses a generic 400 envelope for several non-400 errors; top-level numeric `status` fields below are normalized to their documented HTTP response code. Example identifiers, contact details, and credentials are replaced with deterministic non-production placeholders.

- OpenAPI: 3.1.0
- API document version: 1.0.0
- Operations: 147
- Contract SHA-256: `511261bfe294776d09e879a9e0cf4cd586542653d87d78fe3e32e125037edaac`

## Accounts

### Get account

`GET /v1/accounts/{accountId}`

Retrieve a workspace account the user belongs to.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `expand` | query | string | no | `signing_features`: add which signing features the workspace can use. |

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
        "limits": {
            "webhook_endpoints": 1
        },
        "signing_features": {
            "DigitalCertificate": true,
            "VerificationIdDocumentFaceMatchBasic": false,
            "WhatsappNotification": true,
            "VerificationBypass": false,
            "Embed": false
        },
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "limits": {
            "webhook_endpoints": 1
        },
        "signing_features": {
            "DigitalCertificate": true,
            "VerificationIdDocumentFaceMatchBasic": false,
            "WhatsappNotification": true,
            "VerificationBypass": false,
            "Embed": false
        },
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "secondary_color": "ffffff",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get account usage

`GET /v1/accounts/{accountId}/usage`

The workspace's plan and what is left of it, for a plan and credit meter. Nothing about prices or payments: those stay in **Get current subscription**. Not available to third-party OAuth applications (`403`), whatever their scopes: this is billing data. Assinafy's own apps can read it with the `account:read` scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — The usage

```json
{
    "data": {
        "plan": "Pro",
        "documents_renewal_date": "2026-12-01",
        "balances": {
            "documents": {
                "balance": 100,
                "limit": 100,
                "spent": 0
            },
            "credits": {
                "balance": 100,
                "limit": 100,
                "spent": 0
            }
        }
    },
    "status": 200,
    "message": ""
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List my accounts

`GET /v1/accounts`

List the workspace accounts the authenticated user belongs to.

Called with an OAuth application token, this returns exactly one workspace: the one the user chose when they authorized the application. Use its `id` as the `{accountId}` segment of every other endpoint — a token is bound to a single workspace, and any request naming a different one is refused. This endpoint needs no particular scope.

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
            "limits": {
                "webhook_endpoints": 1
            },
            "signing_features": {
                "DigitalCertificate": true,
                "VerificationIdDocumentFaceMatchBasic": false,
                "WhatsappNotification": true,
                "VerificationBypass": false,
                "Embed": false
            },
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "limits": {
            "webhook_endpoints": 1
        },
        "signing_features": {
            "DigitalCertificate": true,
            "VerificationIdDocumentFaceMatchBasic": false,
            "WhatsappNotification": true,
            "VerificationBypass": false,
            "Embed": false
        },
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get the workspace notification policy

`GET /v1/accounts/{accountId}/notification-policy`

Which document alerts this workspace sends, set by its owners. Every member can read it; `editable` says whether the requesting user can change it. Not available to third-party OAuth applications (`403`), whatever their scopes. Assinafy's own apps can reach it.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — The policy

```json
{
    "data": {
        "editable": true,
        "owners_receive_all": false,
        "events": {
            "DocumentCompleted": true,
            "SignerDeclined": true,
            "DocumentCancelled": true,
            "DocumentAboutToExpire": true,
            "DocumentExpired": true,
            "DocumentExpirationReset": true,
            "DocumentProcessingFailed": true,
            "TemplateProcessingFailed": true,
            "SignerWhatsappFailed": true,
            "ContractRenewalNotice": true,
            "ContractExpiring": true,
            "ContractExpired": true,
            "ContractRenewed": true,
            "SignerViewed": false,
            "SignerSigned": true,
            "SignerIdentityReviewRequired": true
        }
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Update the workspace notification policy

`PUT /v1/accounts/{accountId}/notification-policy`

Owners only (`403` for other members). Merges the supplied fields: send only `events` keys you want to change, and/or `owners_receive_all`. An event set to `false` reaches nobody in this workspace, on any channel, whatever each member's own preferences; the identity review e-mail is the exception and is always sent, because the signer cannot continue without it. An unknown field or code, a non-boolean value or an empty body is rejected with `400` and nothing is written. Returns the full policy.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `events` (object) — Every e-mail and push alert, keyed by notification type. `false` means the workspace never sends it. New keys may be added.
- `owners_receive_all` (boolean)

Example:

```json
{
    "events": {
        "DocumentCompleted": true,
        "SignerDeclined": true,
        "DocumentCancelled": true,
        "DocumentAboutToExpire": true,
        "DocumentExpired": true,
        "DocumentExpirationReset": true,
        "DocumentProcessingFailed": true,
        "TemplateProcessingFailed": true,
        "SignerWhatsappFailed": true,
        "ContractRenewalNotice": true,
        "ContractExpiring": true,
        "ContractExpired": true,
        "ContractRenewed": true,
        "SignerViewed": false,
        "SignerSigned": true,
        "SignerIdentityReviewRequired": true
    },
    "owners_receive_all": true
}
```

#### Responses

##### 200 — The updated policy

```json
{
    "data": {
        "editable": true,
        "owners_receive_all": false,
        "events": {
            "DocumentCompleted": true,
            "SignerDeclined": true,
            "DocumentCancelled": true,
            "DocumentAboutToExpire": true,
            "DocumentExpired": true,
            "DocumentExpirationReset": true,
            "DocumentProcessingFailed": true,
            "TemplateProcessingFailed": true,
            "SignerWhatsappFailed": true,
            "ContractRenewalNotice": true,
            "ContractExpiring": true,
            "ContractExpired": true,
            "ContractRenewed": true,
            "SignerViewed": false,
            "SignerSigned": true,
            "SignerIdentityReviewRequired": true
        }
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Account document KPIs

`GET /v1/accounts/{accountId}/stats`

Precomputed per-account document-funnel KPIs. `granularity=monthly` (default) returns the last 12 months, most recent first; `granularity=daily` with `month=YYYY-MM` returns that month's days. Series are zero-filled. Requires the `account:read` OAuth scope.

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
            "signature_requests_notification_email": 55,
            "signature_requests_notification_whatsapp": 18,
            "signature_requests_notification_bypass": 3,
            "signature_requests_verification_email": 48,
            "signature_requests_verification_whatsapp": 6,
            "signature_requests_verification_bypass": 3,
            "signature_requests_verification_digital_certificate": 4,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## Documents

### List document activities

`GET /v1/documents/{documentId}/activities`

List the activities recorded for a document, newest first (`sort=id` for oldest first). Paged: 20 per page by default; the `X-Pagination-Total-Count`, `X-Pagination-Page-Count`, `X-Pagination-Current-Page` and `X-Pagination-Per-Page` headers describe the full list, and a page past the end returns an empty `data`. Each entry carries an event-specific `payload` snapshot (keys vary per event) and the request `origin` (`ip`, `user-agent`).

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `sort` | query | string | no | `-id` (default, newest first) or `id`. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

#### Responses

##### 200 — Document activities

```json
{
    "data": [
        {
            "id": 4,
            "event": "assignment_created",
            "message": "Assignment created by John Smith.",
            "payload": null,
            "origin": null,
            "created_at": "2022-07-19T19:28:13Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The document is not in the workspace.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List documents

`GET /v1/accounts/{accountId}/documents`

List documents of the workspace, most recently updated first. Every row includes its `assignment` and `pages`; an `expand` parameter is ignored. For a lighter list without them, use `GET /v1/accounts/{accountId}/documents/search`.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `status` | query | string | no | Status filter, e.g. `pending_signature`. |
| `envelope_id` | query | string | no | Only the members of this envelope. Anything but text answers `400`. |
| `method` | query | string | no | Signature method filter. |
| `search` | query | string | no | Partial match on document.name, signer.full_name, signer.email. |
| `tags` | query | string | no | Comma-separated tag IDs; returns documents having ALL listed tags. |
| `sort` | query | string | no | `name` or `updated_at`, ascending; prefix with `-` for descending (`-updated_at`, the default). Other values are ignored. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

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
            "verification_code": "example_secret",
            "verification_url": "https://example.com/example-url-4",
            "decline_reason": null,
            "declined_by": null,
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string",
                    "color": "ff8800"
                }
            ],
            "assignment": null,
            "pages": [
                {
                    "id": "example_id_6",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-5"
                }
            ],
            "envelope_id": null,
            "envelope": null,
            "has_contract": true,
            "created_at": "2026-06-03T03:54:16Z",
            "updated_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 400 — `envelope_id` refused as sent: not text, an entry of `errors`.

```json
{
    "status": 400,
    "message": "Give envelope_id as text.",
    "errors": [
        {
            "field": "envelope_id",
            "code": "Invalid",
            "message": "Give envelope_id as text."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The workspace does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "verification_code": "example_secret",
        "verification_url": "https://example.com/example-url-4",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string",
                "color": "ff8800"
            }
        ],
        "assignment": null,
        "pages": [
            {
                "id": "example_id_6",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "envelope_id": null,
        "envelope": null,
        "has_contract": true,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
| `envelope_id` | query | string | no | Only the members of this envelope. Anything but text answers `400`. |
| `sort` | query | string | no | `name` or `updated_at`, ascending; prefix with `-` for descending (`-updated_at`, the default). Other values are ignored. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

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
            "verification_code": "example_secret",
            "verification_url": "https://example.com/example-url-4",
            "decline_reason": null,
            "declined_by": null,
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string",
                    "color": "ff8800"
                }
            ],
            "assignment": null,
            "pages": [
                {
                    "id": "example_id_6",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-5"
                }
            ],
            "envelope_id": null,
            "envelope": null,
            "has_contract": true,
            "created_at": "2026-06-03T03:54:16Z",
            "updated_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 400 — `envelope_id` refused as sent: not text, an entry of `errors`.

```json
{
    "status": 400,
    "message": "Give envelope_id as text.",
    "errors": [
        {
            "field": "envelope_id",
            "code": "Invalid",
            "message": "Give envelope_id as text."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The workspace does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
| `pending_identity_review` | yes | Every signer has signed; the document waits for the account to review a signer's identity before it is certificated. Deleting it cancels it and notifies the signers. |
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get document

`GET /v1/documents/{documentId}`

Get a document by its ID. `decline_reason` is only present when the access token belongs to the document's creator. With a signer access code (`signer-access-code`), only documents the signer has been sent are found, and `assignment` holds only the signer's own items, without `signers`, `signing_urls`, `copy_receivers` or `summary`.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header) or signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `expand` | query | array | no | `envelope_id` adds the id of the envelope the document was sent in, `envelope` its id and name; each is `null` for a document sent on its own. Send both separated by a comma. Read by the workspace only; without it the document reads as it always has. |

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
        "verification_code": "example_secret",
        "verification_url": "https://example.com/example-url-4",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string",
                "color": "ff8800"
            }
        ],
        "assignment": null,
        "pages": [
            {
                "id": "example_id_6",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "envelope_id": null,
        "envelope": null,
        "has_contract": true,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Delete document

`DELETE /v1/documents/{documentId}`

Delete a document by its ID. Only documents in a deletable status can be removed (see GET /v1/documents/statuses). A document of an envelope, or one taken out of it, can't be deleted while any of the envelope's documents is open: cancel the envelope (`PUT /v1/accounts/{accountId}/envelopes/{envelopeId}/cancel`) first.

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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — The document belongs to an envelope that is still open (`EnvelopeOpen`).

```json
{
    "status": 409,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — The document is certificated, or still being uploaded or processed.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "verification_code": "example_secret",
        "verification_url": "https://example.com/example-url-4",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string",
                "color": "ff8800"
            }
        ],
        "assignment": null,
        "pages": [
            {
                "id": "example_id_6",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "envelope_id": null,
        "envelope": null,
        "has_contract": true,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Download document artifact

`GET /v1/documents/{documentId}/download/{artifactName}`

Download a document artifact. With a signer access code only `original` is available (`403` otherwise): signers get the certified copy by e-mail or WhatsApp. Artifact types: original, certificated, certificate-page, pades, bundle. The pades artifact (signers' ICP-Brasil signatures + platform certification box) is only present on documents that had digital-certificate signers; `bundle` is a zip of the original, certificated and certificate-page artifacts, plus the pades artifact on documents that have one.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header) or signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `artifactName` | path | string | yes | Artifact type. |

#### Responses

##### 200 — The artifact binary

##### 403 — A signer access code asked for an artifact other than `original`; or, with a user's token or key, a deactivated membership, a role or an OAuth scope refuses it.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "hash": "example_id_7",
        "id": "example_id_8",
        "agreement_code": "550E8400-E29B-41D4-A716-446655440000",
        "status": "certificated",
        "page_count": "1",
        "signer_count": "1",
        "completed_count": 1,
        "completed_at": "2023-01-27T19:27:44Z",
        "certificated_at": "2023-01-27T19:27:45Z",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
            "id": "example_id_9",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
            "id": "example_id_9",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
            "id": "example_id_9",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Download document thumbnail

`GET /v1/documents/{documentId}/thumbnail`

Download the thumbnail image of a document's first page.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header) or signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `artifact` | query | string | no | `certificated`: the page, or the thumbnail, as it is in the signed document, with its signatures and stamps. Only for a certificated document, and only for the workspace's members and apps: `404` when the document isn't certificated or the caller uses a signer's access code. The first request for a page renders it with the pages around it, ten at a time, so it takes longer than the next ones; a request that finds the document's pages being rendered waits up to 30 seconds, then answers `503` with `Retry-After` if they still aren't ready; it answers `503` at once when the API is already rendering as many pages as it allows. Sent with `Cache-Control: no-store`. The certificate pages at the end of the signed file have no page ID and no render, and the visible seal of a document signed with a digital certificate is only in its `pades` file. Any other value is ignored. |

#### Responses

##### 200 — The thumbnail image

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 503 — With `artifact=certificated`: another request was still rendering the page after 30 seconds, or the API was already rendering as many pages as it allows at once. Try again after the `Retry-After` seconds.

```json
{
    "status": 503,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 304 — Not modified: the `If-None-Match` or `If-Modified-Since` sent matches the page. No body.

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Download document page

`GET /v1/documents/{documentId}/pages/{pageId}/download`

Download the rendered image of a specific document page.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header) or signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `pageId` | path | string | yes | The page ID. |
| `artifact` | query | string | no | `certificated`: the page, or the thumbnail, as it is in the signed document, with its signatures and stamps. Only for a certificated document, and only for the workspace's members and apps: `404` when the document isn't certificated or the caller uses a signer's access code. The first request for a page renders it with the pages around it, ten at a time, so it takes longer than the next ones; a request that finds the document's pages being rendered waits up to 30 seconds, then answers `503` with `Retry-After` if they still aren't ready; it answers `503` at once when the API is already rendering as many pages as it allows. Sent with `Cache-Control: no-store`. The certificate pages at the end of the signed file have no page ID and no render, and the visible seal of a document signed with a digital certificate is only in its `pades` file. Any other value is ignored. |

#### Responses

##### 200 — The page image

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 503 — With `artifact=certificated`: another request was still rendering the page after 30 seconds, or the API was already rendering as many pages as it allows at once. Try again after the `Retry-After` seconds.

```json
{
    "status": 503,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 304 — Not modified: the `If-None-Match` or `If-Modified-Since` sent matches the page. No body.

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Create document from template

`POST /v1/accounts/{accountId}/templates/{templateId}/documents`

Generate a new document from a template. The request is checked (roles, fields, balance) before it returns, but the assignment is created in the background, so the response has `status: uploaded` and `assignment: null`. Follow the outcome on `GET /v1/documents/{documentId}` or through webhooks: when the send succeeds the status moves to `pending_signature` and `assignment_created` is sent; when it fails the status becomes `failed`, `document_processing_failed` is sent with the reason, and nothing is charged. When the template has fields, every signing role used must have at least one field; otherwise `400`. A template with placed signer fields sends a `collect` assignment, so it cannot take a `DigitalCertificate` signer (`400`); certificate signing needs a template without placed signer fields. Provide one signer entry per template role. An entry with `id` uses that existing signer; an entry with `email` reuses the account's signer with that email or creates one.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `templateId` | path | string | yes | The template ID. |
| `Idempotency-Key` | header | string | no | Any text, case-sensitive and new for each document you mean to create (a UUID, say). Retrying with the same key after a lost response answers the document the first request created, as the first response would, and creates and charges nothing, whatever the body says. A key belongs to its template and doesn't expire, so a `failed` document keeps answering it. `404` if that document was deleted; `409` with code `IdempotencyKeyInUse` if the first request is still running: try again. A request refused before its job is queued leaves its key free. |

#### Request Body (required)

Fields (`application/json`):

- `signers` (array, required) — One entry per template role.
- `editor_fields` (array) — Values for the fields placed on the template's `Editor` role, baked into the generated document. The `Editor` role takes no `signers` entry: it is filled only through this list. Every field placed on it needs an entry with a non-empty `value` (`400` otherwise); when it has no fields, send nothing. In `signers`, every `Signer` role needs an entry (`400` otherwise), and a `CopyReceiver` role takes an entry only for someone who should receive the certified document; a copy receiver's `verification_method`, `notification_methods` and `step` are ignored.
- `name` (string) — Title for the document. Defaults to the template name.
- `message` (string) — Optional message sent to signers.
- `expires_at` (string) — Assignment expiration date (ISO 8601). No expiration by default. Must be at least one hour in the future. A UTC offset in the value is honored (`2026-12-31T23:59:59-03:00` is `2027-01-01T02:59:59Z`); a value without one is read as UTC, and a date alone (`2026-12-31`) means 23:59 UTC that day.
- `tags` (array) — Tag names to attach to the new document. Names that don't exist are auto-created. The template's default-document-tags are always applied; values here are merged on top (duplicates removed).
- `max_total_credits` (number) — Optional ceiling on what this request may spend: refused with `409` and code `CreditCeilingExceeded`, nothing charged, when its `total_credits` is above this. Send the `total_credits` of the last estimate. A value that is not a number of credits, zero or more, answers `400`; numeric text counts, as a form-encoded body sends it. If the cost rises after the request is accepted, as when the plan's documents run out, nothing is charged, the document ends `failed` and `document_processing_failed` carries the reason in `error_message`.

Example:

```json
{
    "signers": [
        {
            "role_id": "example_id_10",
            "id": "example_id_11",
            "email": "user1@example.com",
            "name": "Maria Silva",
            "whatsapp_phone_number": "+5500000000000",
            "verification_method": "Email",
            "notification_methods": [
                "Email"
            ],
            "embedded": false,
            "step": 1
        }
    ],
    "editor_fields": [
        {
            "field_id": "example_id_12",
            "value": "Field value"
        }
    ],
    "name": "sample-contract-one-page.pdf",
    "message": "Message to the signers",
    "expires_at": "2024-07-30T23:59:00Z",
    "tags": [
        "string"
    ],
    "max_total_credits": 1.5
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
        "verification_code": "example_secret",
        "verification_url": "https://example.com/example-url-4",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string",
                "color": "ff8800"
            }
        ],
        "assignment": null,
        "pages": [
            {
                "id": "example_id_6",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "envelope_id": null,
        "envelope": null,
        "has_contract": true,
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — The request was rejected because of its current state or invalid input.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — The request costs more than `max_total_credits` (`CreditCeilingExceeded`), or another request with this `Idempotency-Key` is still running (`IdempotencyKeyInUse`).

```json
{
    "status": 409,
    "code": "PlanRestricted",
    "total_credits": 1.5,
    "max_total_credits": 1,
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — The workspace's plan lacks a verification or notification method sent (`PlanRestricted`), or an OAuth app's token lacks `documents:write` (`InsufficientScope`); also a deactivated membership or a role.

```json
{
    "status": 403,
    "message": "Bad request.",
    "code": "PlanRestricted",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
            "role_id": "example_id_10",
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
        "credits": 0.9,
        "needs_extra_document": true,
        "extra_document_cost": 1,
        "total_credits": 1.9,
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
        "credit_balance": 10,
        "has_sufficient_resources": true,
        "blocking_reason": null,
        "message": null
    },
    "status": 200,
    "message": ""
}
```

##### 400 — The roles, signers or methods sent cannot make a document (the same rules as creating it).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — The workspace's plan lacks a verification or notification method sent (`PlanRestricted`), or an OAuth app's token lacks `documents:write` (`InsufficientScope`); also a deactivated membership or a role.

```json
{
    "status": 403,
    "message": "Bad request.",
    "code": "PlanRestricted",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The template is not in the workspace, or the workspace does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## Assignments

### List assignments

`GET /v1/assignments`

List the workspace's assignments, oldest first. With an OAuth token the workspace is the token's; otherwise pass `accountId`. Each assignment carries its `document_id`.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | query | string | no | The workspace ID. Required unless the request uses an OAuth token. |
| `sort` | query | string | no | `created_at` (default, oldest first), `expires_at` or `id`; prefix with `-` for descending (`-created_at`, newest first). Unknown values are ignored. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

#### Responses

##### 200 — A page of assignments

```json
{
    "data": [
        {
            "resource": "assignment",
            "id": "example_id_13",
            "document_id": "example_id_3",
            "created_at": "2026-06-03T03:54:16Z",
            "sender_email": "user2@example.com",
            "method": "virtual",
            "expires_at": null,
            "message": null,
            "signers": [
                {
                    "verification_method": "Email",
                    "notification_methods": [
                        "Email"
                    ],
                    "step": 1,
                    "notified": null,
                    "identity_verification_status": "InReview",
                    "completed": null,
                    "notification_history": null,
                    "resource": "signer",
                    "id": "example_id_14",
                    "full_name": "Example User",
                    "email": "user3@example.com",
                    "whatsapp_phone_number": "+5500000000000",
                    "government_id": "00000000000",
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
                    "field": null,
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
                    "url": "https://example.com/example-url-6",
                    "embedded": false
                }
            ]
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 400 — Neither `accountId` nor an OAuth token names the workspace.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The workspace does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Create assignment (request signatures)

`POST /v1/documents/{documentId}/assignments`

Request signatures on a document. Use `method: virtual` to sign without input fields, or `method: collect` to place input fields on specific pages.

**Digital certificate signing works only on `virtual` assignments.** A `DigitalCertificate` signer cannot sign placed fields, so a `collect` assignment with one is refused with `400` before anything is charged.

A document takes one assignment: a retry after a lost response answers `400` and charges nothing. Read the document to see whether the first request went through.

For **virtual**, the document may be in `uploaded`, `metadata_processing` or `metadata_ready`; it is promoted to `pending_signature` automatically once metadata processing completes. For **collect**, the document must be in `metadata_ready` (fields reference specific pages).

`step` controls signing order: signers sharing a step sign in parallel, and the next step is notified only after the previous step completes. If supplied, every signer must supply it and values must be contiguous starting at 1.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Request Body (required)

Fields (`application/json`):

- `method` (string, required) — `virtual` signs without input fields; `collect` places input fields on pages. Signers with `DigitalCertificate` verification need `virtual` (`collect` returns `400`).
- `signers` (array, required)
- `entries` (array) — Required for `collect`: field placements per page. In `collect`, every signer listed in `signers` must appear once and own at least one field here; otherwise `400`.
- `message` (string) — Text included in the invitation email.
- `expires_at` (string) — ISO 8601; default is no expiration. Must be at least one hour in the future. A UTC offset in the value is honored (`2026-12-31T23:59:59-03:00` is `2027-01-01T02:59:59Z`); a value without one is read as UTC, and a date alone (`2026-12-31`) means 23:59 UTC that day.
- `copy_receivers` (array) — Signer IDs that only receive a copy.
- `max_total_credits` (number) — Optional ceiling on what this request may spend: refused with `409` and code `CreditCeilingExceeded`, nothing charged, when its `total_credits` is above this. Send the `total_credits` of the last estimate. A value that is not a number of credits, zero or more, answers `400`; numeric text counts, as a form-encoded body sends it.

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
                "url": "https://example.com/example-url-7"
            },
            {
                "signer_id": "example_id_16",
                "url": "https://example.com/example-url-8"
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
        "id": "example_id_13",
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
                    "download_url": "https://example.com/example-url-9"
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
                    "download_url": "https://example.com/example-url-9"
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
                "url": "https://example.com/example-url-10"
            }
        ]
    }
}
```

##### 400 — The request was rejected because of its current state or invalid input.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — The request sent `max_total_credits` and costs more now: the client estimates again and decides. Nothing was created or charged.

```json
{
    "status": 409,
    "message": "This request costs 1.5 credits, more than the max_total_credits of 1.",
    "code": "CreditCeilingExceeded",
    "total_credits": 1.5,
    "max_total_credits": 1
}
```

##### 403 — The workspace's plan lacks a verification or notification method sent (`PlanRestricted`), or an OAuth app's token lacks `documents:write` (`InsufficientScope`); also a deactivated membership or a role.

```json
{
    "status": 403,
    "message": "Bad request.",
    "code": "PlanRestricted",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The document is not in the workspace.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
| Digital certificate signature (per signer) | 0.5 credits |
| Identity document verification (per signer) | depends on the plan, see the table below |

| Plan | Price per signer |
|------|------------------|
| Free | 1.5 credits |
| Standard | 1 credit |
| Pro | 0.5 credits |
| Other plans and enterprise contracts | 0.25 credits |

`Email` and `Whatsapp` verification are not priced separately — their only line in the `breakdown` is their notification. A `Whatsapp`-verified signer therefore shows up as a WhatsApp notification, because that channel is mandatory for that verification method. A `DigitalCertificate` signer adds the digital-certificate signature cost **on top of** its notification cost; it appears in the `breakdown` under the `SignatureDigitalCertificate` code. An `IdDocumentFaceMatchBasic` signer likewise adds your plan's verification price on top of its notification, under the `VerificationIdDocumentFaceMatchBasic` code.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Request Body (required)

Fields (`application/json`):

- `method` (string) — Send the method you will create the assignment with. With `collect`, a `DigitalCertificate` signer returns `400`, because certificate signing works only on `virtual` assignments.
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
        "credits": 0.9,
        "needs_extra_document": true,
        "extra_document_cost": 1,
        "total_credits": 1.9,
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
        "credit_balance": 10,
        "has_sufficient_resources": true,
        "blocking_reason": null,
        "message": null
    },
    "status": 200,
    "message": ""
}
```

##### 400 — The request was rejected because of its current state or invalid input.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — The workspace's plan lacks a verification or notification method sent (`PlanRestricted`), or an OAuth app's token lacks `documents:write` (`InsufficientScope`); also a deactivated membership or a role.

```json
{
    "status": 403,
    "message": "Bad request.",
    "code": "PlanRestricted",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The document is not in the workspace.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Resend signature request

`PUT /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/resend`

Resend the signature-request notification to a signer of the assignment who has not signed yet, while the document is pending signature. Paid notification methods are charged for each message that goes out.

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

##### 400 — The document is not pending signature, the signer is not part of the assignment, has already signed, or waits for an earlier signing step; or the account lacks credits for the reminder.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The assignment or signer was not found on this document.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Estimate resend cost

`POST /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/estimate-resend-cost`

Estimate the cost of resending the signature request to a signer. The response has its own shape (`total`, not `total_credits`), because a reminder uses no document.

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
        "total": 0.45,
        "breakdown": [
            {
                "code": "NotificationWhatsappResend",
                "name": "Whatsapp Notification Resend",
                "cost": 0.45
            }
        ],
        "credit_balance": 10,
        "has_sufficient_credits": true
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Reset assignment expiration

`PUT /v1/documents/{documentId}/assignments/{assignmentId}/reset-expiration`

Set a new expiration date for an assignment, or remove its expiration by sending `expires_at: null`. Not allowed once the document is closed.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |

#### Request Body (required)

Fields (`application/json`):

- `expires_at` (string | null, required) — New expiration date (ISO 8601). Must be at least one hour in the future. Send `null` to remove the expiration — the key itself is required. A UTC offset in the value is honored (`2026-12-31T23:59:59-03:00` is `2027-01-01T02:59:59Z`); a value without one is read as UTC, and a date alone (`2026-12-31`) means 23:59 UTC that day.

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
        "id": "example_id_13",
        "document_id": "example_id_3",
        "created_at": "2026-06-03T03:54:16Z",
        "sender_email": "user2@example.com",
        "method": "virtual",
        "expires_at": null,
        "message": null,
        "signers": [
            {
                "verification_method": "Email",
                "notification_methods": [
                    "Email"
                ],
                "step": 1,
                "notified": null,
                "identity_verification_status": "InReview",
                "completed": null,
                "notification_history": null,
                "resource": "signer",
                "id": "example_id_14",
                "full_name": "Example User",
                "email": "user3@example.com",
                "whatsapp_phone_number": "+5500000000000",
                "government_id": "00000000000",
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
                "field": null,
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
                "url": "https://example.com/example-url-6",
                "embedded": false
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Signer identity review

`GET /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/identity-verification`

The signer's identity-document verification as the account's reviewer sees it. When the provider sends a verification to review, the account decides it with **Decide signer identity review**. The signer can still view and sign meanwhile; the review holds the document's certification instead (status `pending_identity_review` once every signer has signed).
Evidence is a summary kept by Assinafy (no images or biometrics). `evidence_available` is false when the provider keeps none or it could not be fetched yet. While the review is open, `images` lists the evidence images the reviewer can open with **Signer identity review image**. A verification the provider approved directly, without a review, shows no evidence here (`evidence_available` is false); its evidence is on the `signer_identity_verified` activity. For a document of an envelope, the signer's one check of the whole envelope, read from any of its documents they are on. Reachable with the `documents:read` OAuth scope; the images and the decision are not available to third-party OAuth applications (`403`): the review is made by a person, in Assinafy or its apps.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Responses

##### 200 — Identity review

```json
{
    "data": {
        "id": "example_id_26",
        "status": "InReview",
        "provider": "AssinafyVerify",
        "verification_method": "IdDocumentFaceMatchBasic",
        "reason_codes": [
            {
                "code": "NAME_MISMATCH",
                "description": "Nome no documento difere do cadastrado (similaridade 52%)"
            }
        ],
        "evidence_available": true,
        "expected": null,
        "document": null,
        "matches": null,
        "checks": [
            {
                "name": "name",
                "result": "review",
                "score": 0.5217,
                "reasons": [
                    "NAME_MISMATCH"
                ]
            }
        ],
        "images": [
            "document_front",
            "document_back",
            "face"
        ],
        "ruleset_version": "2026-10-12.2",
        "evidence_sha256": "9f2c0d6e4b1a8c3f5e7d9b0a2c4e6f8a1b3d5f7091e2c4a6b8d0f2e4a6c8e0b2",
        "reviewed_by": null,
        "reviewed_at": "2026-10-13T21:05:00Z",
        "review_note": "Conferido por videochamada.",
        "completed_at": "2026-10-13T21:05:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — Assignment, signer or verification not found.

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Signer identity review image

`GET /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/identity-verification/images/{name}`

One evidence image of a signer identity verification that is `InReview`, for the account's reviewer: the document photos (or the digital document PDF) and the face photo. Fetched from the verification provider on each request and never stored by Assinafy. Available only while the review is open; once it is decided, every image returns 404. `name` must be one of the review's `images`. Not available to third-party OAuth applications (`403`), whatever their scopes: the images are for the person reviewing. Assinafy's own apps can open them with the `documents:read` scope, for the user signed in to them.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |
| `signerId` | path | string | yes | The signer ID. |
| `name` | path | string | yes | The image, as listed in the review's `images`. |

#### Responses

##### 200 — The image bytes (`image/jpeg`, `image/png`) or the document PDF (`application/pdf`). Sent with `Cache-Control: no-store`.

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — Assignment, signer or verification not found, the review is not open, or there is no such image.

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Decide signer identity review

`POST /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/identity-verification/review`

Approves or rejects a signer whose identity verification is `InReview`, while the document is `pending_signature` or `pending_identity_review`. Approved: once every signer has signed and no other signer is under review, the document is certificated; the certificate states the approval by review and every difference found. Rejected: the document is cancelled (`rejected_by_user`, with the reviewer as the user) and every signer and copy receiver gets the cancellation notice; the note is never shown to them. The signer gets no message about the decision itself. For a document of an envelope, it decides the signer's one check of the whole envelope, from any of its documents they are on, and is recorded on each of them: approving releases each once signed, and rejecting cancels the whole envelope as its cancel does, each person told once. The decision is also reported to the verification provider. Not available to third-party OAuth applications (`403`), whatever their scopes: the certificate names the person who reviewed. Assinafy's own apps can decide it with the `documents:write` scope, and the reviewer is the user signed in to them.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Request Body (required)

Fields (`application/json`):

- `decision` (string, required)
- `note` (string | null) — Optional. Recorded in the activity log and sent to the provider; never shown to the signer.

Example:

```json
{
    "decision": "Approved",
    "note": "Conferido por videochamada."
}
```

#### Responses

##### 200 — Decided

```json
{
    "data": {
        "id": "example_id_26",
        "status": "InReview",
        "provider": "AssinafyVerify",
        "verification_method": "IdDocumentFaceMatchBasic",
        "reason_codes": [
            {
                "code": "NAME_MISMATCH",
                "description": "Nome no documento difere do cadastrado (similaridade 52%)"
            }
        ],
        "evidence_available": true,
        "expected": null,
        "document": null,
        "matches": null,
        "checks": [
            {
                "name": "name",
                "result": "review",
                "score": 0.5217,
                "reasons": [
                    "NAME_MISMATCH"
                ]
            }
        ],
        "images": [
            "document_front",
            "document_back",
            "face"
        ],
        "ruleset_version": "2026-10-12.2",
        "evidence_sha256": "9f2c0d6e4b1a8c3f5e7d9b0a2c4e6f8a1b3d5f7091e2c4a6b8d0f2e4a6c8e0b2",
        "reviewed_by": null,
        "reviewed_at": "2026-10-13T21:05:00Z",
        "review_note": "Conferido por videochamada.",
        "completed_at": "2026-10-13T21:05:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — Invalid decision, the verification is not `InReview`, or the document is no longer awaiting signatures (for a document of an envelope, none of the signer's documents of it is).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — Assignment, signer or verification not found.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List WhatsApp notifications

`GET /v1/documents/{documentId}/assignments/{assignmentId}/whatsapp-notifications`

List all WhatsApp notification messages sent for an assignment. The response includes the rendered template text split into `header`, `body` and `buttons` — exactly what the signer would see. In sandbox/stage, WhatsApp messages are simulated (no real delivery) and button URLs include access/verification codes you can use to simulate the signing flow; in production the button URLs are stripped. Requires the `documents:read` OAuth scope.

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
            "sent_at": "2026-07-07T12:00:00Z",
            "header": "Documento para assinatura: Contrato de Servico",
            "body": "string",
            "buttons": [
                {
                    "text": "Abrir documento"
                }
            ],
            "phone_number": "+5500000000000",
            "signer_id": "example_id_27"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
            "id": "example_id_28",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Change password

`PUT /v1/authentication/change-password`

Change the authenticated user's password. The body's `email` must be their own address (any letter case); any other address is refused (`403`), whether or not it has an account, and an `email` that is not text answers `400`.

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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Complete a two-factor login

`POST /v1/authentication/mfa/verify`

Exchanges the `mfa_token` returned by login for an access token. `code` is either the 6-digit code from the authenticator app or one of the recovery codes issued at enrollment. The challenge is single-use and expires 5 minutes after login.

**Authentication:** none (public endpoint).

#### Request Body (required)

Fields (`application/json`):

- `mfa_token` (string, required) — The token returned by the login response.
- `code` (string, required) — A 6-digit authenticator code, or a recovery code such as ABCD-EFGH-JKMN.

Example:

```json
{
    "mfa_token": "example_secret",
    "code": "123456"
}
```

#### Responses

##### 200 — Access token, user and accounts

```json
{
    "data": {
        "access_token": "example_credential",
        "user": {
            "id": "example_id_28",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — The challenge expired, was already used, or too many codes were tried

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List two-factor methods

`GET /v1/users/self/mfa`

The authenticated user's enrolled two-factor methods and how many recovery codes remain unused.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — Enrolled methods

```json
{
    "data": {
        "methods": [
            {
                "id": "example_id_29",
                "type": "Totp",
                "label": "My phone",
                "confirmed_at": "2026-09-09T14:21:03Z",
                "last_used_at": "2026-09-09T18:02:44Z"
            }
        ],
        "recovery_codes_remaining": 8
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Start authenticator enrollment

`POST /v1/users/self/mfa/totp`

Creates an unconfirmed authenticator method and returns the shared secret. The secret is returned only by this call and cannot be retrieved again. Two-factor authentication is not active until the enrollment is confirmed.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body

Fields (`application/json`):

- `label` (string)

Example:

```json
{
    "label": "My phone"
}
```

#### Responses

##### 200 — Enrollment started

```json
{
    "data": {
        "id": "example_id_29",
        "secret": "example_secret",
        "provisioning_uri": "https://example.com/example-url-11"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Confirm authenticator enrollment

`PUT /v1/users/self/mfa/totp/confirm`

Activates the method by proving one live code from the NEW device (`code`). Returns the recovery codes, which are shown only once and cannot be retrieved again. From this point every login requires a second factor. If the user already has a confirmed method of the same type, confirming REPLACES it — the old one is soft-deleted and recovery codes are reissued — so this call additionally requires re-authentication via `password` or `reauth_code` (a live code from the CURRENT device, or one of the existing recovery codes), exactly like disabling a method. First-time enrollment needs neither.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body (required)

Fields (`application/json`):

- `id` (string, required)
- `code` (string, required) — Live code from the NEW device being confirmed.
- `password` (string) — Re-authentication proof, required only when replacing an existing confirmed method.
- `reauth_code` (string) — Re-authentication proof alternative to password: a live code from the CURRENT device, or a recovery code. Required only when replacing an existing confirmed method.

Example:

```json
{
    "id": "example_id_29",
    "code": "123456",
    "password": "example_secret",
    "reauth_code": "string"
}
```

#### Responses

##### 200 — Two-factor enabled

```json
{
    "data": {
        "recovery_codes": [
            "ABCD-EFGH-JKMN"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Regenerate recovery codes

`POST /v1/users/self/mfa/recovery-codes`

Issues a fresh set of ten recovery codes and invalidates the previous set. Requires the current password, a live authenticator code, or one of the existing recovery codes (which is then consumed).

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body (required)

Fields (`application/json`):

- `password` (string)
- `code` (string) — A live 6-digit authenticator code, or one of the existing recovery codes.

Example:

```json
{
    "password": "example_secret",
    "code": "123456"
}
```

#### Responses

##### 200 — New recovery codes

```json
{
    "data": {
        "recovery_codes": [
            "ABCD-EFGH-JKMN"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Remove a two-factor method

`DELETE /v1/users/self/mfa/{customId}`

Removes an enrolled method. Requires the current password, a live authenticator code, or one of the existing recovery codes (which is then consumed), so that a stolen session cannot silently disable two-factor authentication. Removing the last method also discards the recovery codes.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `customId` | path | string | yes |  |

#### Request Body (required)

Fields (`application/json`):

- `password` (string)
- `code` (string) — A live 6-digit authenticator code, or one of the existing recovery codes.

Example:

```json
{
    "password": "example_secret",
    "code": "123456"
}
```

#### Responses

##### 200 — Method removed

```json
{
    "data": {
        "is_mfa_enabled": false
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
            "id": "example_id_28",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## Contracts

### List contracts

`GET /v1/accounts/{accountId}/contracts`

List the contract terms tracked on the workspace's documents, most recently updated first. Every filter is optional and only narrows the list. To catch up after a webhook that never arrived, page this list until the contracts are older than your last sync: every change to the terms, by a user or by the hourly run, moves `updated_at`. Each document's history of contract events is at `GET /v1/documents/{documentId}/activities`.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `status` | query | array | no | Contract status; several, comma-separated, match any of them. |
| `counterparty` | query | string | no | Part of the counterparty name, or its exact CPF/CNPJ. |
| `search` | query | string | no | Part of the document's name. |
| `end_date_from` | query | string | no | Contracts ending on or after this date. |
| `end_date_to` | query | string | no | Contracts ending on or before this date. |
| `ending_within_days` | query | integer | no | Contracts ending from today (the API's calendar day, Brasília time) to that many days later, both included; `0` is today. Any status: add `status=active` for the ones still in force. |
| `external_system` | query | string | no | System of an external reference, e.g. `hubspot`. |
| `external_id` | query | string | no | ID of an external reference in that system. |
| `sort` | query | string | no | `end_date` or `updated_at`; prefix with `-` for descending (`-updated_at`, the default). Contracts without an end date come last either way. |
| `expand` | query | string | no | `document` embeds each contract's document. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

#### Responses

##### 200 — A page of contracts

**A page of contracts**

```json
{
    "status": 200,
    "message": "",
    "data": [
        {
            "document_id": "example_id_30",
            "status": "active",
            "counterparty_name": "Acme Ltda",
            "counterparty_taxpayer_id": "00000000000",
            "value": 120000.5,
            "currency": "BRL",
            "start_date": "2026-11-01",
            "end_date": "2027-10-31",
            "auto_renew": true,
            "renewal_term_months": 12,
            "notice_period_days": 30,
            "term": 1,
            "owner_id": "example_id_31",
            "metadata": {
                "crm_stage": "won"
            },
            "external_references": [
                {
                    "system": "hubspot",
                    "id": "example_id_32"
                }
            ],
            "created_at": "2026-10-23T12:00:00Z",
            "updated_at": "2026-10-23T12:00:00Z"
        }
    ]
}
```

**A page of contracts with their documents (expand=document)**

```json
{
    "status": 200,
    "message": "",
    "data": [
        {
            "document_id": "example_id_30",
            "status": "active",
            "counterparty_name": "Acme Ltda",
            "counterparty_taxpayer_id": "00000000000",
            "value": 120000.5,
            "currency": "BRL",
            "start_date": "2026-11-01",
            "end_date": "2027-10-31",
            "auto_renew": true,
            "renewal_term_months": 12,
            "notice_period_days": 30,
            "term": 1,
            "owner_id": "example_id_31",
            "metadata": {
                "crm_stage": "won"
            },
            "external_references": [
                {
                    "system": "hubspot",
                    "id": "example_id_32"
                }
            ],
            "created_at": "2026-10-23T12:00:00Z",
            "updated_at": "2026-10-23T12:00:00Z",
            "document": {
                "id": "example_id_30",
                "account_id": "example_id_4",
                "template_id": null,
                "name": "Contrato de prestação de serviços.pdf",
                "status": "certificated",
                "artifacts": {
                    "original": "https://example.com/example-url-12"
                },
                "is_closed": true,
                "signing_url": "https://example.com/example-url-13",
                "verification_code": "example_secret",
                "verification_url": "https://example.com/example-url-4",
                "decline_reason": null,
                "declined_by": null,
                "tags": [],
                "created_at": "2026-10-20T14:00:00Z",
                "updated_at": "2026-10-22T09:00:00Z"
            }
        }
    ]
}
```

##### 400 — The request breaks a contract rule. `errors` has one entry per problem found: the `field` as sent (`null` when the request as a whole is refused), a stable `code` to translate, and the `message` in the platform's language; `message` at the top is the first entry's. The contract's own rules on the terms, and the external references' items, report every field that breaks one, an entry per field (its first problem); the other checks (the body, its fields, the contract's state, a renewal's or a link's conditions) stop at the first problem they find. | Code | Field | Refused when | |------|-------|--------------| | `InvalidBody` | — | The body is not a JSON object (a list, a bare value), or a `PUT` of contract terms sends no attribute. | | `UnknownField` | the attribute | The endpoint does not take the attribute; one entry per attribute. | | `NotSingleValue` | the attribute | On a `PUT` of contract terms, a list sent for a term that takes one value (every term but `metadata` and `external_references`). On a link, the same list answers the term's own code. | | `Required` | `parent_document_id`, `relation_type`, `external_references[i].system`, `external_references[i].id` | A first link without `parent_document_id` (a pending link that was removed meanwhile) or `relation_type`; an `external_references` item without `system` or `id` (`i` is its place in the list sent, from 0). | | `Invalid` | the field | The value is not of the field's type or form: `status` not one of the four; `currency` not three letters; `auto_renew` not a boolean; `owner_id` not a user id; `value` not a number; `counterparty_name` holding HTML; `metadata` not an object; `external_references` not a list, an item's `system` (`external_references[i].system`) with characters other than letters, digits, `_`, `-` and `.`, or its `id` (`external_references[i].id`) with an emoji or another 4-byte character; `parent_document_id` not text; `relation_type` not `amendment`, `renewal` or `termination`; `term` not a whole number from 1; `reason` not text. On the list: a filter sent as a list, a `status` not one of the four, `ending_within_days` not a whole number. | | `TooSmall`, `TooBig` | the field | `value` below 0 or above 9999999999999.99; `renewal_term_months` outside 1 to 600; `notice_period_days` (and the list's `ending_within_days`) outside 0 to 3650. | | `TooLong` | the field | `counterparty_name` over 255 characters, counting each emoji as stored (several characters); `counterparty_taxpayer_id` over 20; `reason` over 500; `external_references[i].system` over 64 or `external_references[i].id` over 255. | | `TooMany` | `external_references` | More than 20 items. | | `TooManyDecimals` | `value` | More than two decimal places. | | `InvalidDate` | `start_date`, `end_date`, `updated_at`; the list's `end_date_from`, `end_date_to` | Not a date as `YYYY-MM-DD` (an impossible one such as `2026-02-30` included); `updated_at` not a date and time as the API writes it (`2026-10-23T12:00:00Z`, or with an offset). | | `DateTooEarly` | `start_date`, `end_date` | Before the year 1000. | | `DateTooLate` | `end_date` | A renewal by the term would pass 9999-12-31. | | `EndBeforeStart` | `end_date` | Before `start_date`. | | `InvalidTaxpayerId` | `counterparty_taxpayer_id` | Not a valid CPF or CNPJ (formatted or not). | | `NotAMember` | `owner_id` | Not an active member of the workspace. | | `TooManyKeys` | `metadata` | More than 50 keys. | | `InvalidKey` | `metadata` | A key that is not 1 to 40 letters, digits, `_`, `-` or `.`. | | `InvalidValue` | `metadata` | A value that is not plain text of at most 500 characters. | | `NumberUnderDateKey` | `metadata` | A number under a key ending in `_at`, or `stuck_since`: those keys hold text only. | | `ListKeys` | `metadata` | Keys `0`, `1`, `2`…, which would read back as a list. | | `DuplicateReference` | `external_references` | Two items the database takes for one (accents, `ß` and `ss`); items equal case aside are merged, not refused. | | `StatusNotSettable` | `status` | A tracked contract sent `expired` or `terminated`, or a closed one sent `draft` or `active`: a contract is closed by terminating it and reopened by renewing it. | | `CannotReturnToDraft` | `status` | An `active` contract sent `draft`. | | `ExpiredNeedsPastEndDate` | `end_date` | New terms with status `expired` and no `end_date` before today. | | `TerminatedNeedsEndDate` | `end_date` | New terms with status `terminated` and no `end_date`. | | `UnsignableDocument` | — | New terms, or a first link, on a cancelled, declined or expired document. Terms or a link already on one stay editable. | | `DocumentIsAmendment` | — | Terms of its own for a document linked as an amendment: its terms are the changes it makes. | | `DocumentHasOwnTerms` | — | A link for a document that tracks a contract of its own: a document is a contract or an amendment, never both. | | `ParentHasNoTerms` | `parent_document_id` | The parent named has no contract terms, nor amends a contract that has. | | `ParentTerminated` | `parent_document_id` | The parent contract is terminated. | | `NoTermChanged` | — | An `amendment` that changes no term, also by dropping its last one. A `renewal` or `termination` may change none. | | `TermNotAllowed` | the term | A term the relation type cannot change: a `renewal` changes only `end_date` and `value`, a `termination` only `end_date`. | | `AmendmentApplied` | — | The amendment applied when its document was signed and can no longer change. | | `TermOrEndDateRequired` | — | A renewal sends neither `term` nor `end_date`. | | `TermMismatch` | `term` | Not the contract's current term: the renewal already happened. | | `ContractTerminated` | — | A renewal of a terminated contract. | | `EndDateRequired` | `end_date` | A renewal by the term, or a `renewal` link without `end_date`, of a contract without an end date. | | `EndDateNotAfterCurrent` | `end_date` | A renewal, or a `renewal` link, to a date not after the current end date. | | `AlreadyTerminated` | — | A termination of a contract already terminated. | A body that is not valid JSON is refused before it reaches these endpoints, with the platform's `400` and no `errors`. A link is also checked against what applying it today would give the parent, so a delta the contract would refuse comes back with the contract's own codes.

```json
{
    "status": 400,
    "message": "value must be no less than 0.",
    "errors": [
        {
            "field": "value",
            "code": "TooSmall",
            "message": "value must be no less than 0."
        },
        {
            "field": "currency",
            "code": "Invalid",
            "message": "currency is invalid."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get a document's contract terms

`GET /v1/accounts/{accountId}/documents/{documentId}/contract`

The contract terms tracked on a document, with `amendments`: the documents that amend, renew or terminate it. For a document that is itself an amendment, its link and delta (`DocumentContractAmendment`) instead. Readable even after the workspace's plan stops including contract tracking.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | Document ID. |

#### Responses

##### 200 — The contract terms, or the amendment

**The contract terms with their amendments**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "document_contract",
        "document_id": "example_id_30",
        "status": "active",
        "counterparty_name": "Acme Ltda",
        "counterparty_taxpayer_id": "00000000000",
        "value": 130000,
        "currency": "BRL",
        "start_date": "2026-11-01",
        "end_date": "2028-06-30",
        "auto_renew": true,
        "renewal_term_months": 12,
        "notice_period_days": 30,
        "term": 2,
        "owner_id": "example_id_31",
        "metadata": {
            "crm_stage": "won"
        },
        "external_references": [
            {
                "system": "hubspot",
                "id": "example_id_32"
            }
        ],
        "created_at": "2026-10-23T12:00:00Z",
        "updated_at": "2027-05-12T18:20:00Z",
        "amendments": [
            {
                "document_id": "example_id_33",
                "document_name": "Aditivo 1 - Contrato de prestação de serviços.pdf",
                "parent_document_id": "example_id_30",
                "relation_type": "amendment",
                "number": 1,
                "status": "applied",
                "document_status": "certificated",
                "apply_error": null,
                "currency": "BRL",
                "terms": {
                    "value": 130000,
                    "end_date": "2028-06-30"
                },
                "changes": {
                    "value": {
                        "from": 120000.5,
                        "to": 130000
                    },
                    "end_date": {
                        "from": "2027-10-31",
                        "to": "2028-06-30"
                    },
                    "term": {
                        "from": 1,
                        "to": 2
                    }
                },
                "applied_at": "2027-05-12T18:20:00Z",
                "created_at": "2027-05-10T15:00:00Z",
                "updated_at": "2027-05-12T18:20:00Z"
            }
        ]
    }
}
```

**The amendment, waiting for its signature**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "document_contract_amendment",
        "document_id": "example_id_33",
        "document_name": "Aditivo 1 - Contrato de prestação de serviços.pdf",
        "parent_document_id": "example_id_30",
        "relation_type": "amendment",
        "number": null,
        "status": "pending",
        "document_status": "pending_signature",
        "apply_error": null,
        "currency": "BRL",
        "terms": {
            "value": 130000,
            "end_date": "2028-06-30"
        },
        "changes": {
            "value": {
                "from": 120000.5,
                "to": 130000
            },
            "end_date": {
                "from": "2027-10-31",
                "to": "2028-06-30"
            },
            "term": {
                "from": 1,
                "to": 2
            }
        },
        "applied_at": null,
        "created_at": "2027-05-10T15:00:00Z",
        "updated_at": "2027-05-10T15:00:00Z"
    }
}
```

##### 404 — The document is not in the workspace (`Document not found.`), or carries no contract terms (on a read: neither its own nor those of a contract it amends whose document still exists). Only the second has a `code`, `NoContractTerms`, so a document without terms can be told from one that is not there.

```json
{
    "status": 404,
    "message": "This document has no contract terms.",
    "code": "NoContractTerms"
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Set a document's contract terms

`PUT /v1/accounts/{accountId}/documents/{documentId}/contract`

Creates the document's contract terms, or changes only the attributes sent (see the request body for what `null` does). `external_references`, when sent, replaces the whole list. Records a `document_contract_updated` event when the terms change; a retry that changes nothing records none. The body must be a JSON object with at least one attribute. With `parent_document_id`, the document is instead linked as an amendment, renewal or termination of that contract (or of any document in its family, resolved to the root) and the other attributes are the terms it changes; a later `PUT` on a pending amendment merges into that delta (a `null` drops a key) and `parent_document_id: null` unlinks it; every change to the link records `document_contract_amendment_updated` on this document. The delta applies to the parent once the document is certificated (at once, if it already is), in signing order (the order the documents' certifications were recorded in, fixed for each once it is; a certificated document with none recorded waits, and is placed by its certification time an hour on): instruments signed earlier apply first, one that cannot holds the later ones back, and an instrument signed before one already applied is blocked instead of applied over it. Applying records `document_contract_amended`; an applied amendment is read-only. A cancelled, declined or expired document takes no new terms and no new link; terms or a link already on one stay and can still change. Send the `updated_at` you read with the write to have it refused (`409`) if the contract or link changed meanwhile. Contract tracking comes with every standard plan, the free plan too; `403` when the workspace's current subscription lacks it.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | Document ID. |

#### Request Body (required)

Fields (`application/json`):

- `status` (string) — On creation any status, so a contract that ended before it was tracked is registered as it ended: `expired` needs an `end_date` in the past, `terminated` its `end_date`; neither is walked by the lifecycle. Afterwards only `draft` or `active` (a contract in force never goes back to `draft`): `expired` and `terminated` are set by the lifecycle and the terminate endpoint; a closed contract is reopened by renewing it.
- `counterparty_name` (string | null) — Emoji are kept; other characters outside the 3-byte range are dropped.
- `counterparty_taxpayer_id` (string | null) — A valid CPF or CNPJ, formatted or not.
- `value` (number | null) — Two decimal places at most.
- `currency` (string | null) — Three letters, such as `BRL` or `USD`, stored in capitals; `BRL` when a `value` is set without one.
- `start_date` (string | null) — `YYYY-MM-DD`, from the year 1000.
- `end_date` (string | null) — `YYYY-MM-DD`, on or after `start_date`.
- `auto_renew` (boolean) — Whether the hourly run starts the next term the day after `end_date`, by `renewal_term_months`, instead of expiring the contract.
- `renewal_term_months` (integer | null) — How far a renewal by the term moves `end_date`; 12 when unset.
- `notice_period_days` (integer | null) — Days before `end_date` the notice period starts (`document_contract_renewal_notice`); none when unset.
- `owner_id` (string | null) — An active member of this workspace.
- `metadata` (object | null) — Your own fields: up to 50 keys of 1 to 40 letters, digits, `_`, `-` or `.`, each holding plain text of at most 500 characters; no number under a key ending in `_at`, or `stuck_since`.
- `external_references` (array | null) — Replaces the whole list; `[]` or `null` clears it. Two items whose `system` and `id` compare equal case aside are one reference (the first sent is kept); a pair the database takes for one beyond that (accents, `ß` and `ss`) answers `400`.
- `parent_document_id` (string | null) — Links the document as an amendment of this contract document, or of any document in its family (resolved to the root); `null` unlinks a pending amendment. With it, the other attributes are the terms the instrument changes, not terms of its own; on a pending amendment a `null` value drops that term from the delta rather than clearing it on the parent.
- `relation_type` (string) — Required on the first link. `amendment` may change `value`, `currency`, `start_date` (effective from, display only), `end_date`, `auto_renew`, `renewal_term_months`, `notice_period_days`, `counterparty_name`, `counterparty_taxpayer_id` and `metadata`; `renewal` only `end_date` and `value`; `termination` only `end_date` (the effective date).
- `updated_at` (string) — Optional precondition: the `updated_at` the client read the contract (or this document's amendment link) with, as the API returned it. If the contract or link changed since, nothing is written and the answer is `409` with `code: ContractChanged`. Not sent, or `null`: the write applies whatever changed meanwhile (last write wins). Compared to the second; a fraction of a second, as a JavaScript date prints it, is read and ignored. New terms and a first link have nothing to have read, so sending one answers `409`; on a pending amendment, send the link's own `updated_at` (the GET on that document).

Example — Set every term:

```json
{
    "status": "active",
    "counterparty_name": "Acme Ltda",
    "counterparty_taxpayer_id": "00000000000",
    "value": 120000.5,
    "currency": "BRL",
    "start_date": "2026-11-01",
    "end_date": "2027-10-31",
    "auto_renew": true,
    "renewal_term_months": 12,
    "notice_period_days": 30,
    "owner_id": "example_id_31",
    "metadata": {
        "crm_stage": "won"
    },
    "external_references": [
        {
            "system": "hubspot",
            "id": "example_id_32"
        }
    ]
}
```

Example — Change one term, clear another:

```json
{
    "notice_period_days": 60,
    "counterparty_name": null
}
```

Example — Replace the external references:

```json
{
    "external_references": [
        {
            "system": "hubspot",
            "id": "example_id_32"
        },
        {
            "system": "erp",
            "id": "example_id_34"
        }
    ]
}
```

Example — Link an aditivo that changes the value and the end date:

```json
{
    "parent_document_id": "example_id_30",
    "relation_type": "amendment",
    "value": 130000,
    "end_date": "2028-06-30"
}
```

#### Responses

##### 200 — The contract terms as saved, or the amendment as linked

**The contract terms**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "document_contract",
        "document_id": "example_id_30",
        "status": "active",
        "counterparty_name": "Acme Ltda",
        "counterparty_taxpayer_id": "00000000000",
        "value": 120000.5,
        "currency": "BRL",
        "start_date": "2026-11-01",
        "end_date": "2027-10-31",
        "auto_renew": true,
        "renewal_term_months": 12,
        "notice_period_days": 30,
        "term": 1,
        "owner_id": "example_id_31",
        "metadata": {
            "crm_stage": "won"
        },
        "external_references": [
            {
                "system": "hubspot",
                "id": "example_id_32"
            }
        ],
        "created_at": "2026-10-23T12:00:00Z",
        "updated_at": "2026-10-23T12:00:00Z"
    }
}
```

**The amendment, waiting for its signature**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "document_contract_amendment",
        "document_id": "example_id_33",
        "document_name": "Aditivo 1 - Contrato de prestação de serviços.pdf",
        "parent_document_id": "example_id_30",
        "relation_type": "amendment",
        "number": null,
        "status": "pending",
        "document_status": "pending_signature",
        "apply_error": null,
        "currency": "BRL",
        "terms": {
            "value": 130000,
            "end_date": "2028-06-30"
        },
        "changes": {
            "value": {
                "from": 120000.5,
                "to": 130000
            },
            "end_date": {
                "from": "2027-10-31",
                "to": "2028-06-30"
            },
            "term": {
                "from": 1,
                "to": 2
            }
        },
        "applied_at": null,
        "created_at": "2027-05-10T15:00:00Z",
        "updated_at": "2027-05-10T15:00:00Z"
    }
}
```

**The amendment, applied to the parent**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "document_contract_amendment",
        "document_id": "example_id_33",
        "document_name": "Aditivo 1 - Contrato de prestação de serviços.pdf",
        "parent_document_id": "example_id_30",
        "relation_type": "amendment",
        "number": 1,
        "status": "applied",
        "document_status": "certificated",
        "apply_error": null,
        "currency": "BRL",
        "terms": {
            "value": 130000,
            "end_date": "2028-06-30"
        },
        "changes": {
            "value": {
                "from": 120000.5,
                "to": 130000
            },
            "end_date": {
                "from": "2027-10-31",
                "to": "2028-06-30"
            },
            "term": {
                "from": 1,
                "to": 2
            }
        },
        "applied_at": "2027-05-12T18:20:00Z",
        "created_at": "2027-05-10T15:00:00Z",
        "updated_at": "2027-05-12T18:20:00Z"
    }
}
```

##### 400 — The request breaks a contract rule. `errors` has one entry per problem found: the `field` as sent (`null` when the request as a whole is refused), a stable `code` to translate, and the `message` in the platform's language; `message` at the top is the first entry's. The contract's own rules on the terms, and the external references' items, report every field that breaks one, an entry per field (its first problem); the other checks (the body, its fields, the contract's state, a renewal's or a link's conditions) stop at the first problem they find. | Code | Field | Refused when | |------|-------|--------------| | `InvalidBody` | — | The body is not a JSON object (a list, a bare value), or a `PUT` of contract terms sends no attribute. | | `UnknownField` | the attribute | The endpoint does not take the attribute; one entry per attribute. | | `NotSingleValue` | the attribute | On a `PUT` of contract terms, a list sent for a term that takes one value (every term but `metadata` and `external_references`). On a link, the same list answers the term's own code. | | `Required` | `parent_document_id`, `relation_type`, `external_references[i].system`, `external_references[i].id` | A first link without `parent_document_id` (a pending link that was removed meanwhile) or `relation_type`; an `external_references` item without `system` or `id` (`i` is its place in the list sent, from 0). | | `Invalid` | the field | The value is not of the field's type or form: `status` not one of the four; `currency` not three letters; `auto_renew` not a boolean; `owner_id` not a user id; `value` not a number; `counterparty_name` holding HTML; `metadata` not an object; `external_references` not a list, an item's `system` (`external_references[i].system`) with characters other than letters, digits, `_`, `-` and `.`, or its `id` (`external_references[i].id`) with an emoji or another 4-byte character; `parent_document_id` not text; `relation_type` not `amendment`, `renewal` or `termination`; `term` not a whole number from 1; `reason` not text. On the list: a filter sent as a list, a `status` not one of the four, `ending_within_days` not a whole number. | | `TooSmall`, `TooBig` | the field | `value` below 0 or above 9999999999999.99; `renewal_term_months` outside 1 to 600; `notice_period_days` (and the list's `ending_within_days`) outside 0 to 3650. | | `TooLong` | the field | `counterparty_name` over 255 characters, counting each emoji as stored (several characters); `counterparty_taxpayer_id` over 20; `reason` over 500; `external_references[i].system` over 64 or `external_references[i].id` over 255. | | `TooMany` | `external_references` | More than 20 items. | | `TooManyDecimals` | `value` | More than two decimal places. | | `InvalidDate` | `start_date`, `end_date`, `updated_at`; the list's `end_date_from`, `end_date_to` | Not a date as `YYYY-MM-DD` (an impossible one such as `2026-02-30` included); `updated_at` not a date and time as the API writes it (`2026-10-23T12:00:00Z`, or with an offset). | | `DateTooEarly` | `start_date`, `end_date` | Before the year 1000. | | `DateTooLate` | `end_date` | A renewal by the term would pass 9999-12-31. | | `EndBeforeStart` | `end_date` | Before `start_date`. | | `InvalidTaxpayerId` | `counterparty_taxpayer_id` | Not a valid CPF or CNPJ (formatted or not). | | `NotAMember` | `owner_id` | Not an active member of the workspace. | | `TooManyKeys` | `metadata` | More than 50 keys. | | `InvalidKey` | `metadata` | A key that is not 1 to 40 letters, digits, `_`, `-` or `.`. | | `InvalidValue` | `metadata` | A value that is not plain text of at most 500 characters. | | `NumberUnderDateKey` | `metadata` | A number under a key ending in `_at`, or `stuck_since`: those keys hold text only. | | `ListKeys` | `metadata` | Keys `0`, `1`, `2`…, which would read back as a list. | | `DuplicateReference` | `external_references` | Two items the database takes for one (accents, `ß` and `ss`); items equal case aside are merged, not refused. | | `StatusNotSettable` | `status` | A tracked contract sent `expired` or `terminated`, or a closed one sent `draft` or `active`: a contract is closed by terminating it and reopened by renewing it. | | `CannotReturnToDraft` | `status` | An `active` contract sent `draft`. | | `ExpiredNeedsPastEndDate` | `end_date` | New terms with status `expired` and no `end_date` before today. | | `TerminatedNeedsEndDate` | `end_date` | New terms with status `terminated` and no `end_date`. | | `UnsignableDocument` | — | New terms, or a first link, on a cancelled, declined or expired document. Terms or a link already on one stay editable. | | `DocumentIsAmendment` | — | Terms of its own for a document linked as an amendment: its terms are the changes it makes. | | `DocumentHasOwnTerms` | — | A link for a document that tracks a contract of its own: a document is a contract or an amendment, never both. | | `ParentHasNoTerms` | `parent_document_id` | The parent named has no contract terms, nor amends a contract that has. | | `ParentTerminated` | `parent_document_id` | The parent contract is terminated. | | `NoTermChanged` | — | An `amendment` that changes no term, also by dropping its last one. A `renewal` or `termination` may change none. | | `TermNotAllowed` | the term | A term the relation type cannot change: a `renewal` changes only `end_date` and `value`, a `termination` only `end_date`. | | `AmendmentApplied` | — | The amendment applied when its document was signed and can no longer change. | | `TermOrEndDateRequired` | — | A renewal sends neither `term` nor `end_date`. | | `TermMismatch` | `term` | Not the contract's current term: the renewal already happened. | | `ContractTerminated` | — | A renewal of a terminated contract. | | `EndDateRequired` | `end_date` | A renewal by the term, or a `renewal` link without `end_date`, of a contract without an end date. | | `EndDateNotAfterCurrent` | `end_date` | A renewal, or a `renewal` link, to a date not after the current end date. | | `AlreadyTerminated` | — | A termination of a contract already terminated. | A body that is not valid JSON is refused before it reaches these endpoints, with the platform's `400` and no `errors`. A link is also checked against what applying it today would give the parent, so a delta the contract would refuse comes back with the contract's own codes.

```json
{
    "status": 400,
    "message": "value must be no less than 0.",
    "errors": [
        {
            "field": "value",
            "code": "TooSmall",
            "message": "value must be no less than 0."
        },
        {
            "field": "currency",
            "code": "Invalid",
            "message": "currency is invalid."
        }
    ]
}
```

##### 403 — Contract tracking is not available to the workspace (`PlanRestricted`): its current subscription lacks it (a custom contract that leaves it out, or an administrator's removal), or it is turned off for the whole service. It comes with every standard plan, the free plan too.

```json
{
    "status": 403,
    "message": "Contract tracking is not available for your current plan.",
    "code": "PlanRestricted"
}
```

##### 409 — The write sent the `updated_at` it read the contract (or the amendment link) with, and the contract changed since: by another user, an integration or the hourly run. Nothing was written. Read it again, check the change still applies, and send it with the new `updated_at`.

```json
{
    "status": 409,
    "message": "The contract changed after it was read; read it again and resend the change.",
    "code": "ContractChanged"
}
```

##### 404 — The document is not in the workspace, the `parent_document_id` names a document outside it, or `parent_document_id: null` is sent for a document that is not an amendment.

```json
{
    "status": 404,
    "message": "Document not found."
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List the contracts related to a document

`GET /v1/accounts/{accountId}/documents/{documentId}/contract/related`

The family the document belongs to, seen from its root: the contract terms with every amendment, renewal and termination document linked to them (`amendments`). Works from the contract document and from any of its amendments alike.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | Document ID. |
| `expand` | query | string | no | `document` embeds the root contract's document, its `name` included, so an amendment's page names its parent without a second read; each entry of `amendments` already carries its own `document_name`. Without it the answer is as before. |

#### Responses

##### 200 — The root contract and its family

**The contract terms with their amendments**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "document_contract",
        "document_id": "example_id_30",
        "status": "active",
        "counterparty_name": "Acme Ltda",
        "counterparty_taxpayer_id": "00000000000",
        "value": 130000,
        "currency": "BRL",
        "start_date": "2026-11-01",
        "end_date": "2028-06-30",
        "auto_renew": true,
        "renewal_term_months": 12,
        "notice_period_days": 30,
        "term": 2,
        "owner_id": "example_id_31",
        "metadata": {
            "crm_stage": "won"
        },
        "external_references": [
            {
                "system": "hubspot",
                "id": "example_id_32"
            }
        ],
        "created_at": "2026-10-23T12:00:00Z",
        "updated_at": "2027-05-12T18:20:00Z",
        "amendments": [
            {
                "document_id": "example_id_33",
                "document_name": "Aditivo 1 - Contrato de prestação de serviços.pdf",
                "parent_document_id": "example_id_30",
                "relation_type": "amendment",
                "number": 1,
                "status": "applied",
                "document_status": "certificated",
                "apply_error": null,
                "currency": "BRL",
                "terms": {
                    "value": 130000,
                    "end_date": "2028-06-30"
                },
                "changes": {
                    "value": {
                        "from": 120000.5,
                        "to": 130000
                    },
                    "end_date": {
                        "from": "2027-10-31",
                        "to": "2028-06-30"
                    },
                    "term": {
                        "from": 1,
                        "to": 2
                    }
                },
                "applied_at": "2027-05-12T18:20:00Z",
                "created_at": "2027-05-10T15:00:00Z",
                "updated_at": "2027-05-12T18:20:00Z"
            }
        ]
    }
}
```

##### 404 — The document is not in the workspace (`Document not found.`), or carries no contract terms (on a read: neither its own nor those of a contract it amends whose document still exists). Only the second has a `code`, `NoContractTerms`, so a document without terms can be told from one that is not there.

```json
{
    "status": 404,
    "message": "This document has no contract terms.",
    "code": "NoContractTerms"
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Renew a contract

`POST /v1/accounts/{accountId}/documents/{documentId}/contract/renew`

Starts the contract's next term: `end_date` moves by `renewal_term_months` (12 when unset), or to the `end_date` sent, which must be after the current one. A `value` sent replaces the current one. Reopens an expired contract; a terminated one returns `400`. Steps `term`, so the lifecycle alerts run again for the new term. Records a `document_contract_renewed` event. Contract tracking comes with every standard plan, the free plan too; `403` when the workspace's current subscription lacks it. The body names the `term` the renewal starts from (the contract's current one) or the `end_date` it renews to, so a renewal answered with a `5xx` error, or whose answer was lost, is safe to send again: the repeat is refused with `400`, as the contract is then in its next term and that date is no longer after the current one (or with `409`, when it sends the `updated_at` it read).

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | Document ID. |

#### Request Body

Fields (`application/json`):

- `end_date` (string | null) — The new end date, after the current one. Absent, empty or `null`: the current end date plus the renewal term, stepped until it is in the future; `term` is then required.
- `value` (number | null) — The new value; unchanged when not sent, cleared by `null`.
- `term` (integer) — The term this renewal starts from, the contract's current `term`. Required unless `end_date` is sent; for a contract in another term the renewal is refused, so a repeated request never renews twice.
- `updated_at` (string) — Optional precondition: the contract's `updated_at` as read. Changed since: `409`, nothing renewed.

Example — Renew from term 1 by the renewal term, with a new value: safe to repeat:

```json
{
    "term": 1,
    "value": 126000
}
```

Example — Renew to a date with a new value:

```json
{
    "end_date": "2029-06-30",
    "value": 130000
}
```

#### Responses

##### 200 — The renewed contract

**The renewed contract**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "document_contract",
        "document_id": "example_id_30",
        "status": "active",
        "counterparty_name": "Acme Ltda",
        "counterparty_taxpayer_id": "00000000000",
        "value": 130000,
        "currency": "BRL",
        "start_date": "2026-11-01",
        "end_date": "2029-06-30",
        "auto_renew": true,
        "renewal_term_months": 12,
        "notice_period_days": 30,
        "term": 2,
        "owner_id": "example_id_31",
        "metadata": {
            "crm_stage": "won"
        },
        "external_references": [
            {
                "system": "hubspot",
                "id": "example_id_32"
            }
        ],
        "created_at": "2026-10-23T12:00:00Z",
        "updated_at": "2027-10-15T09:30:00Z"
    }
}
```

##### 400 — The request breaks a contract rule. `errors` has one entry per problem found: the `field` as sent (`null` when the request as a whole is refused), a stable `code` to translate, and the `message` in the platform's language; `message` at the top is the first entry's. The contract's own rules on the terms, and the external references' items, report every field that breaks one, an entry per field (its first problem); the other checks (the body, its fields, the contract's state, a renewal's or a link's conditions) stop at the first problem they find. | Code | Field | Refused when | |------|-------|--------------| | `InvalidBody` | — | The body is not a JSON object (a list, a bare value), or a `PUT` of contract terms sends no attribute. | | `UnknownField` | the attribute | The endpoint does not take the attribute; one entry per attribute. | | `NotSingleValue` | the attribute | On a `PUT` of contract terms, a list sent for a term that takes one value (every term but `metadata` and `external_references`). On a link, the same list answers the term's own code. | | `Required` | `parent_document_id`, `relation_type`, `external_references[i].system`, `external_references[i].id` | A first link without `parent_document_id` (a pending link that was removed meanwhile) or `relation_type`; an `external_references` item without `system` or `id` (`i` is its place in the list sent, from 0). | | `Invalid` | the field | The value is not of the field's type or form: `status` not one of the four; `currency` not three letters; `auto_renew` not a boolean; `owner_id` not a user id; `value` not a number; `counterparty_name` holding HTML; `metadata` not an object; `external_references` not a list, an item's `system` (`external_references[i].system`) with characters other than letters, digits, `_`, `-` and `.`, or its `id` (`external_references[i].id`) with an emoji or another 4-byte character; `parent_document_id` not text; `relation_type` not `amendment`, `renewal` or `termination`; `term` not a whole number from 1; `reason` not text. On the list: a filter sent as a list, a `status` not one of the four, `ending_within_days` not a whole number. | | `TooSmall`, `TooBig` | the field | `value` below 0 or above 9999999999999.99; `renewal_term_months` outside 1 to 600; `notice_period_days` (and the list's `ending_within_days`) outside 0 to 3650. | | `TooLong` | the field | `counterparty_name` over 255 characters, counting each emoji as stored (several characters); `counterparty_taxpayer_id` over 20; `reason` over 500; `external_references[i].system` over 64 or `external_references[i].id` over 255. | | `TooMany` | `external_references` | More than 20 items. | | `TooManyDecimals` | `value` | More than two decimal places. | | `InvalidDate` | `start_date`, `end_date`, `updated_at`; the list's `end_date_from`, `end_date_to` | Not a date as `YYYY-MM-DD` (an impossible one such as `2026-02-30` included); `updated_at` not a date and time as the API writes it (`2026-10-23T12:00:00Z`, or with an offset). | | `DateTooEarly` | `start_date`, `end_date` | Before the year 1000. | | `DateTooLate` | `end_date` | A renewal by the term would pass 9999-12-31. | | `EndBeforeStart` | `end_date` | Before `start_date`. | | `InvalidTaxpayerId` | `counterparty_taxpayer_id` | Not a valid CPF or CNPJ (formatted or not). | | `NotAMember` | `owner_id` | Not an active member of the workspace. | | `TooManyKeys` | `metadata` | More than 50 keys. | | `InvalidKey` | `metadata` | A key that is not 1 to 40 letters, digits, `_`, `-` or `.`. | | `InvalidValue` | `metadata` | A value that is not plain text of at most 500 characters. | | `NumberUnderDateKey` | `metadata` | A number under a key ending in `_at`, or `stuck_since`: those keys hold text only. | | `ListKeys` | `metadata` | Keys `0`, `1`, `2`…, which would read back as a list. | | `DuplicateReference` | `external_references` | Two items the database takes for one (accents, `ß` and `ss`); items equal case aside are merged, not refused. | | `StatusNotSettable` | `status` | A tracked contract sent `expired` or `terminated`, or a closed one sent `draft` or `active`: a contract is closed by terminating it and reopened by renewing it. | | `CannotReturnToDraft` | `status` | An `active` contract sent `draft`. | | `ExpiredNeedsPastEndDate` | `end_date` | New terms with status `expired` and no `end_date` before today. | | `TerminatedNeedsEndDate` | `end_date` | New terms with status `terminated` and no `end_date`. | | `UnsignableDocument` | — | New terms, or a first link, on a cancelled, declined or expired document. Terms or a link already on one stay editable. | | `DocumentIsAmendment` | — | Terms of its own for a document linked as an amendment: its terms are the changes it makes. | | `DocumentHasOwnTerms` | — | A link for a document that tracks a contract of its own: a document is a contract or an amendment, never both. | | `ParentHasNoTerms` | `parent_document_id` | The parent named has no contract terms, nor amends a contract that has. | | `ParentTerminated` | `parent_document_id` | The parent contract is terminated. | | `NoTermChanged` | — | An `amendment` that changes no term, also by dropping its last one. A `renewal` or `termination` may change none. | | `TermNotAllowed` | the term | A term the relation type cannot change: a `renewal` changes only `end_date` and `value`, a `termination` only `end_date`. | | `AmendmentApplied` | — | The amendment applied when its document was signed and can no longer change. | | `TermOrEndDateRequired` | — | A renewal sends neither `term` nor `end_date`. | | `TermMismatch` | `term` | Not the contract's current term: the renewal already happened. | | `ContractTerminated` | — | A renewal of a terminated contract. | | `EndDateRequired` | `end_date` | A renewal by the term, or a `renewal` link without `end_date`, of a contract without an end date. | | `EndDateNotAfterCurrent` | `end_date` | A renewal, or a `renewal` link, to a date not after the current end date. | | `AlreadyTerminated` | — | A termination of a contract already terminated. | A body that is not valid JSON is refused before it reaches these endpoints, with the platform's `400` and no `errors`. A link is also checked against what applying it today would give the parent, so a delta the contract would refuse comes back with the contract's own codes.

```json
{
    "status": 400,
    "message": "value must be no less than 0.",
    "errors": [
        {
            "field": "value",
            "code": "TooSmall",
            "message": "value must be no less than 0."
        },
        {
            "field": "currency",
            "code": "Invalid",
            "message": "currency is invalid."
        }
    ]
}
```

##### 403 — Contract tracking is not available to the workspace (`PlanRestricted`): its current subscription lacks it (a custom contract that leaves it out, or an administrator's removal), or it is turned off for the whole service. It comes with every standard plan, the free plan too.

```json
{
    "status": 403,
    "message": "Contract tracking is not available for your current plan.",
    "code": "PlanRestricted"
}
```

##### 409 — The write sent the `updated_at` it read the contract (or the amendment link) with, and the contract changed since: by another user, an integration or the hourly run. Nothing was written. Read it again, check the change still applies, and send it with the new `updated_at`.

```json
{
    "status": 409,
    "message": "The contract changed after it was read; read it again and resend the change.",
    "code": "ContractChanged"
}
```

##### 404 — The document is not in the workspace (`Document not found.`), or carries no contract terms (on a read: neither its own nor those of a contract it amends whose document still exists). Only the second has a `code`, `NoContractTerms`, so a document without terms can be told from one that is not there.

```json
{
    "status": 404,
    "message": "This document has no contract terms.",
    "code": "NoContractTerms"
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Terminate a contract

`POST /v1/accounts/{accountId}/documents/{documentId}/contract/terminate`

Closes the contract: its status becomes `terminated` and the lifecycle job stops alerting on it. Records a `document_contract_terminated` event carrying the `reason`. Contract tracking comes with every standard plan, the free plan too; `403` when the workspace's current subscription lacks it.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `documentId` | path | string | yes | Document ID. |

#### Request Body

Fields (`application/json`):

- `reason` (string | null) — Kept in the `document_contract_terminated` event; HTML is stripped.
- `updated_at` (string) — Optional precondition: the contract's `updated_at` as read. Changed since: `409`, nothing terminated.

Example — Terminate with a reason:

```json
{
    "reason": "Fornecedor substituído"
}
```

#### Responses

##### 200 — The terminated contract

**The terminated contract**

```json
{
    "status": 200,
    "message": "",
    "data": {
        "resource": "document_contract",
        "document_id": "example_id_30",
        "status": "terminated",
        "counterparty_name": "Acme Ltda",
        "counterparty_taxpayer_id": "00000000000",
        "value": 120000.5,
        "currency": "BRL",
        "start_date": "2026-11-01",
        "end_date": "2027-10-31",
        "auto_renew": true,
        "renewal_term_months": 12,
        "notice_period_days": 30,
        "term": 1,
        "owner_id": "example_id_31",
        "metadata": {
            "crm_stage": "won"
        },
        "external_references": [
            {
                "system": "hubspot",
                "id": "example_id_32"
            }
        ],
        "created_at": "2026-10-23T12:00:00Z",
        "updated_at": "2027-03-02T14:00:00Z"
    }
}
```

##### 400 — The request breaks a contract rule. `errors` has one entry per problem found: the `field` as sent (`null` when the request as a whole is refused), a stable `code` to translate, and the `message` in the platform's language; `message` at the top is the first entry's. The contract's own rules on the terms, and the external references' items, report every field that breaks one, an entry per field (its first problem); the other checks (the body, its fields, the contract's state, a renewal's or a link's conditions) stop at the first problem they find. | Code | Field | Refused when | |------|-------|--------------| | `InvalidBody` | — | The body is not a JSON object (a list, a bare value), or a `PUT` of contract terms sends no attribute. | | `UnknownField` | the attribute | The endpoint does not take the attribute; one entry per attribute. | | `NotSingleValue` | the attribute | On a `PUT` of contract terms, a list sent for a term that takes one value (every term but `metadata` and `external_references`). On a link, the same list answers the term's own code. | | `Required` | `parent_document_id`, `relation_type`, `external_references[i].system`, `external_references[i].id` | A first link without `parent_document_id` (a pending link that was removed meanwhile) or `relation_type`; an `external_references` item without `system` or `id` (`i` is its place in the list sent, from 0). | | `Invalid` | the field | The value is not of the field's type or form: `status` not one of the four; `currency` not three letters; `auto_renew` not a boolean; `owner_id` not a user id; `value` not a number; `counterparty_name` holding HTML; `metadata` not an object; `external_references` not a list, an item's `system` (`external_references[i].system`) with characters other than letters, digits, `_`, `-` and `.`, or its `id` (`external_references[i].id`) with an emoji or another 4-byte character; `parent_document_id` not text; `relation_type` not `amendment`, `renewal` or `termination`; `term` not a whole number from 1; `reason` not text. On the list: a filter sent as a list, a `status` not one of the four, `ending_within_days` not a whole number. | | `TooSmall`, `TooBig` | the field | `value` below 0 or above 9999999999999.99; `renewal_term_months` outside 1 to 600; `notice_period_days` (and the list's `ending_within_days`) outside 0 to 3650. | | `TooLong` | the field | `counterparty_name` over 255 characters, counting each emoji as stored (several characters); `counterparty_taxpayer_id` over 20; `reason` over 500; `external_references[i].system` over 64 or `external_references[i].id` over 255. | | `TooMany` | `external_references` | More than 20 items. | | `TooManyDecimals` | `value` | More than two decimal places. | | `InvalidDate` | `start_date`, `end_date`, `updated_at`; the list's `end_date_from`, `end_date_to` | Not a date as `YYYY-MM-DD` (an impossible one such as `2026-02-30` included); `updated_at` not a date and time as the API writes it (`2026-10-23T12:00:00Z`, or with an offset). | | `DateTooEarly` | `start_date`, `end_date` | Before the year 1000. | | `DateTooLate` | `end_date` | A renewal by the term would pass 9999-12-31. | | `EndBeforeStart` | `end_date` | Before `start_date`. | | `InvalidTaxpayerId` | `counterparty_taxpayer_id` | Not a valid CPF or CNPJ (formatted or not). | | `NotAMember` | `owner_id` | Not an active member of the workspace. | | `TooManyKeys` | `metadata` | More than 50 keys. | | `InvalidKey` | `metadata` | A key that is not 1 to 40 letters, digits, `_`, `-` or `.`. | | `InvalidValue` | `metadata` | A value that is not plain text of at most 500 characters. | | `NumberUnderDateKey` | `metadata` | A number under a key ending in `_at`, or `stuck_since`: those keys hold text only. | | `ListKeys` | `metadata` | Keys `0`, `1`, `2`…, which would read back as a list. | | `DuplicateReference` | `external_references` | Two items the database takes for one (accents, `ß` and `ss`); items equal case aside are merged, not refused. | | `StatusNotSettable` | `status` | A tracked contract sent `expired` or `terminated`, or a closed one sent `draft` or `active`: a contract is closed by terminating it and reopened by renewing it. | | `CannotReturnToDraft` | `status` | An `active` contract sent `draft`. | | `ExpiredNeedsPastEndDate` | `end_date` | New terms with status `expired` and no `end_date` before today. | | `TerminatedNeedsEndDate` | `end_date` | New terms with status `terminated` and no `end_date`. | | `UnsignableDocument` | — | New terms, or a first link, on a cancelled, declined or expired document. Terms or a link already on one stay editable. | | `DocumentIsAmendment` | — | Terms of its own for a document linked as an amendment: its terms are the changes it makes. | | `DocumentHasOwnTerms` | — | A link for a document that tracks a contract of its own: a document is a contract or an amendment, never both. | | `ParentHasNoTerms` | `parent_document_id` | The parent named has no contract terms, nor amends a contract that has. | | `ParentTerminated` | `parent_document_id` | The parent contract is terminated. | | `NoTermChanged` | — | An `amendment` that changes no term, also by dropping its last one. A `renewal` or `termination` may change none. | | `TermNotAllowed` | the term | A term the relation type cannot change: a `renewal` changes only `end_date` and `value`, a `termination` only `end_date`. | | `AmendmentApplied` | — | The amendment applied when its document was signed and can no longer change. | | `TermOrEndDateRequired` | — | A renewal sends neither `term` nor `end_date`. | | `TermMismatch` | `term` | Not the contract's current term: the renewal already happened. | | `ContractTerminated` | — | A renewal of a terminated contract. | | `EndDateRequired` | `end_date` | A renewal by the term, or a `renewal` link without `end_date`, of a contract without an end date. | | `EndDateNotAfterCurrent` | `end_date` | A renewal, or a `renewal` link, to a date not after the current end date. | | `AlreadyTerminated` | — | A termination of a contract already terminated. | A body that is not valid JSON is refused before it reaches these endpoints, with the platform's `400` and no `errors`. A link is also checked against what applying it today would give the parent, so a delta the contract would refuse comes back with the contract's own codes.

```json
{
    "status": 400,
    "message": "value must be no less than 0.",
    "errors": [
        {
            "field": "value",
            "code": "TooSmall",
            "message": "value must be no less than 0."
        },
        {
            "field": "currency",
            "code": "Invalid",
            "message": "currency is invalid."
        }
    ]
}
```

##### 403 — Contract tracking is not available to the workspace (`PlanRestricted`): its current subscription lacks it (a custom contract that leaves it out, or an administrator's removal), or it is turned off for the whole service. It comes with every standard plan, the free plan too.

```json
{
    "status": 403,
    "message": "Contract tracking is not available for your current plan.",
    "code": "PlanRestricted"
}
```

##### 409 — The write sent the `updated_at` it read the contract (or the amendment link) with, and the contract changed since: by another user, an integration or the hourly run. Nothing was written. Read it again, check the change still applies, and send it with the new `updated_at`.

```json
{
    "status": 409,
    "message": "The contract changed after it was read; read it again and resend the change.",
    "code": "ContractChanged"
}
```

##### 404 — The document is not in the workspace (`Document not found.`), or carries no contract terms (on a read: neither its own nor those of a contract it amends whose document still exists). Only the second has a `code`, `NoContractTerms`, so a document without terms can be told from one that is not there.

```json
{
    "status": 404,
    "message": "This document has no contract terms.",
    "code": "NoContractTerms"
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## Embedded Signing

### List embed origins

`GET /v1/accounts/{accountId}/embed-origins`

List the origins allowed to embed the workspace's signing pages, oldest first. Returns `403` with code `PlanRestricted` when the workspace's plan does not include embedded signing. Not available to OAuth applications.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Responses

##### 200 — The allowed origins

```json
{
    "data": [
        {
            "id": "example_id_35",
            "origin": "https://example.com/example-url-14",
            "created_at": "2026-11-04T12:05:00Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Add embed origin

`POST /v1/accounts/{accountId}/embed-origins`

Allow one more origin to embed the workspace's signing pages. An origin is an exact `scheme://host[:port]`: `https` (or `http` for `localhost` and `192.0.2.1` only), with no path, query, fragment, credentials or wildcard. The host is lowercased and a trailing `/` and the default port are dropped. Returns `400` when the origin is invalid, already registered, or the workspace already has 10 origins. Returns `403` with code `PlanRestricted` when the workspace's plan does not include embedded signing. Not available to OAuth applications.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `origin` (string, required)

Example:

```json
{
    "origin": "https://example.com/example-url-14"
}
```

#### Responses

##### 200 — The origin added

```json
{
    "data": {
        "id": "example_id_35",
        "origin": "https://example.com/example-url-14",
        "created_at": "2026-11-04T12:05:00Z"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Update embed origin

`PUT /v1/accounts/{accountId}/embed-origins/{originId}`

Replace one allowed origin with another, keeping its `id`. The same rules as **Add embed origin** apply. Returns `400` when the new origin is invalid or another entry already has it. Returns `403` with code `PlanRestricted` when the workspace's plan does not include embedded signing. Not available to OAuth applications.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `originId` | path | string | yes | The embed origin ID. |

#### Request Body (required)

Fields (`application/json`):

- `origin` (string, required)

Example:

```json
{
    "origin": "https://example.com/example-url-14"
}
```

#### Responses

##### 200 — The updated origin

```json
{
    "data": {
        "id": "example_id_35",
        "origin": "https://example.com/example-url-14",
        "created_at": "2026-11-04T12:05:00Z"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Remove embed origin

`DELETE /v1/accounts/{accountId}/embed-origins/{originId}`

Stop allowing an origin to embed the workspace's signing pages. Removing the last origin disables embedding: new sessions return `409` with code `embed_origins_missing`. Returns `403` with code `PlanRestricted` when the workspace's plan does not include embedded signing. Not available to OAuth applications.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `originId` | path | string | yes | The embed origin ID. |

#### Responses

##### 200 — Origin removed

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Create an embed session

`POST /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/embed-sessions`

Mint a single-use embed URL for a signer created with `embedded: true`. Load the URL in an iframe on one of the workspace's embed origins within 5 minutes; opening it spends the token, so mint a fresh one each time the signer opens the page. The signer's access code is never returned. Refused with `400` (`embed_not_enabled_for_signer`) for a signer that is not embedded, `409` when the signer already finished (`already_signed`), the document is still being uploaded or processed (`document_not_ready`: retry in a moment), the document can no longer be signed or the signer's step has not started (`document_unavailable`), or the workspace has no embed origin (`embed_origins_missing`), `403` with code `PlanRestricted` when the plan does not include embedded signing, and `429` after 30 sessions for one signer in an hour.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Responses

##### 200 — The embed session

```json
{
    "data": {
        "url": "https://example.com/example-url-15",
        "expires_at": "2026-11-04T12:05:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — The request was rejected because of its current state or invalid input.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The document, assignment or signer was not found.

##### 409 — The signer can not sign right now (`already_signed`, `document_not_ready`, `document_unavailable`), or the workspace has no embed origin (`embed_origins_missing`).

##### 429 — More than 30 sessions for this signer in the last hour.

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Exchange an embed session

`POST /v1/embed/sessions/{token}/exchange`

Called by Assinafy's embed page, not by integrations. Public: the token is the credential. Trades a session token for the signer's access code, once; the token is spent even when the call is refused with `409`. An unknown, expired or already used token returns `410` with code `embed_session_invalid`. Returns `409` when the signer or document can no longer sign.

**Authentication:** none (public endpoint).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `token` | path | string | yes | The 64-character session token from the embed URL. |

#### Request Body

Fields (`application/json`):

- `parent_origin` (string) — The origin of the page hosting the iframe, recorded for audit.

Example:

```json
{
    "parent_origin": "https://example.com/example-url-14"
}
```

#### Responses

##### 200 — The signing session

```json
{
    "data": {
        "signer_access_code": "example_secret",
        "signer_id": "example_id_35",
        "document_id": "example_id_36",
        "verification_method": "Email",
        "embed_origins": [
            "https://example.com/example-url-14"
        ]
    },
    "status": 200,
    "message": ""
}
```

##### 409 — The signer or document can not sign right now (`already_signed`, `document_not_ready`, `document_unavailable`).

##### 410 — Unknown, expired or already used token (`embed_session_invalid`).

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## Envelopes

### List envelopes

`GET /v1/accounts/{accountId}/envelopes`

The workspace's envelopes, the most recent first: each with its documents in order, their statuses and signers, and the counts by status.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |
| `search` | query | string | no | Part of the envelope's name. |
| `status` | query | string | no | `open`: envelopes with a document still open; `closed`: every document signed, declined, cancelled, expired or failed. |

#### Responses

##### 200 — The workspace's envelopes

```json
{
    "data": [
        {
            "resource": "envelope",
            "id": "example_id_37",
            "name": "Contrato de prestação de serviços",
            "message": "Segue o contrato e seus anexos.",
            "documents": [
                {
                    "id": "example_id_3",
                    "position": 1,
                    "name": "contrato.pdf",
                    "status": "pending_signature",
                    "artifacts": {
                        "original": "https://example.com/example-url-16",
                        "thumbnail": "https://example.com/example-url-17"
                    },
                    "signers": [
                        {
                            "id": "example_id_11",
                            "full_name": "Example User",
                            "email": "user10@example.com",
                            "whatsapp_phone_number": "+5500000000000",
                            "completed": false,
                            "signed_at": "2026-11-06T14:30:00Z"
                        }
                    ]
                }
            ],
            "counts": {
                "certificated": 1,
                "pending_signature": 2
            },
            "signing_urls": [
                {
                    "signer_id": "example_id_5",
                    "url": "https://example.com/example-url-6",
                    "embedded": false
                }
            ],
            "created_at": "2026-11-04T12:00:00Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 400 — A filter refused as sent, an entry of `errors` each: `search` (not text), `status` (other than `open` or `closed`).

```json
{
    "status": 400,
    "message": "Give status as open or closed.",
    "errors": [
        {
            "field": "status",
            "code": "Invalid",
            "message": "Give status as open or closed."
        }
    ]
}
```

##### 403 — An OAuth app's token lacks `documents:read` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Create envelope

`POST /v1/accounts/{accountId}/envelopes`

Send several documents to the same signers at once. Each document gets its own assignment and keeps its own status, certificate and downloads; one invitation goes to each signer, through the methods sent for them, for all the documents they are on, from the first of them. A send that fails is recorded on that signer's request (`notification_history`) and doesn't undo the envelope: `200` means the envelope was created, not that every invitation was delivered. The envelope is charged as one document, whatever its documents, each signer's notifications and identity check once for the whole envelope, and each digital-certificate signature on every document it is made on. Every document must be uploaded and processed (`metadata_ready`) with no assignment, and every listed signer must be on at least one document. Each document is signed on its virtual page or, with `collect`, on the fields placed on its pages, as on an assignment; a digital-certificate signer signs only virtual documents, alone on each. Needs the Envelopes feature on the workspace's plan (`403` with code `PlanRestricted` otherwise). A refused request creates and charges nothing; `errors` names every field at fault.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `Idempotency-Key` | header | string | no | Any text, case-sensitive and new for each envelope you mean to create (a UUID, say). Retrying with the same key after a lost response answers the envelope the first request created, and creates and charges nothing, whatever the body says. A key belongs to its workspace and doesn't expire. `409` with code `IdempotencyKeyInUse` if the first request is still running: try again. An empty value counts as no key, as on template documents. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string, required) — What the invitation calls what is being signed, in place of a document's name. `<` is refused (`400`).
- `message` (string | null) — Optional message sent to every signer; their invitation adds the names of the documents they are on.
- `max_total_credits` (number) — Optional ceiling on what this request may spend, as on an assignment: refused with `409` and code `CreditCeilingExceeded`, nothing created or charged, when the envelope's total credits are above it. A value that is not a number of credits, zero or more, answers `400`; numeric text counts, as a form-encoded body sends it. The estimate ignores it.
- `signers` (array, required) — Every signer of the envelope, once, by id: up to 20. They all sign at once: an envelope takes no `step`.
- `documents` (array, required) — The documents, in the order the envelope lists them: up to 20.

Example:

```json
{
    "name": "Contrato de prestação de serviços",
    "message": "Segue o contrato e seus anexos.",
    "max_total_credits": 1.5,
    "signers": [
        {
            "id": "example_id_11",
            "verification_method": "Email",
            "notification_methods": [
                "Email"
            ],
            "embedded": true
        }
    ],
    "documents": [
        {
            "id": "example_id_3",
            "method": "virtual",
            "entries": [
                {
                    "page_id": "example_id_5",
                    "fields": [
                        {
                            "signer_id": "example_id_5",
                            "field_id": "example_id_5",
                            "display_settings": {
                                "left": 69,
                                "top": 282,
                                "width": 421,
                                "height": 45.86,
                                "fontFamily": "Arial",
                                "fontSize": 22,
                                "backgroundColor": "#D5EBFF"
                            }
                        }
                    ]
                }
            ],
            "signer_ids": [
                "example_id_11"
            ],
            "expires_at": "2026-12-31T23:59:59Z",
            "copy_receiver_ids": [
                "example_id_38"
            ]
        }
    ]
}
```

#### Responses

##### 200 — The created envelope

```json
{
    "data": {
        "resource": "envelope",
        "id": "example_id_37",
        "name": "Contrato de prestação de serviços",
        "message": "Segue o contrato e seus anexos.",
        "documents": [
            {
                "id": "example_id_3",
                "position": 1,
                "name": "contrato.pdf",
                "status": "pending_signature",
                "artifacts": {
                    "original": "https://example.com/example-url-16",
                    "thumbnail": "https://example.com/example-url-17"
                },
                "signers": [
                    {
                        "id": "example_id_11",
                        "full_name": "Example User",
                        "email": "user10@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "completed": false,
                        "signed_at": "2026-11-06T14:30:00Z"
                    }
                ]
            }
        ],
        "counts": {
            "certificated": 1,
            "pending_signature": 2
        },
        "signing_urls": [
            {
                "signer_id": "example_id_5",
                "url": "https://example.com/example-url-6",
                "embedded": false
            }
        ],
        "created_at": "2026-11-04T12:00:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — Refused as sent; nothing was created or charged. Each field at fault is an entry of `errors` (a list refused as a whole is not read item by item), an item of a list named by its index (`documents[1].signer_ids`): `name`; `message` (not text); `signers` and `documents` (missing, empty, not a list, or more than 20 signers or 20 documents; `documents` also when its documents hold more than 2,000 fields between them, a virtual document's being one per signer, or more than 100 copy receivers); `signers[i].id` (missing, listed twice, not a signer of the workspace, or on no document); `signers[i].verification_method` (not a code); `signers[i].notification_methods` (not a list of codes); `signers[i].step` (sent at all); `documents[i].id` (missing, listed twice, or a document that can't take the assignment: not found, not `metadata_ready`, or already assigned); `documents[i].method` (other than `virtual` or `collect`); `documents[i].entries` (missing for `collect`, or not a list of pages with fields naming their `signer_id`); `documents[i].expires_at` (not text, a number or null); `documents[i].signer_ids` (missing, not a list of ids, a signer not listed once in `signers`, for `collect` not exactly the signers on its fields, or a digital-certificate signer on a `collect` document or with another signer). A page or field the assignment doesn't find on a `collect` document, a method code the platform doesn't know, a verification and notification that don't pair, a signer without the e-mail or WhatsApp number their method needs, an `embedded` other than `true`, `false`, `1` or `0` (`null` reads as left out, as on an assignment) or set for a signer verified other than by Bypass, Email or WhatsApp, a balance too low for the envelope, an `expires_at` or `copy_receiver_ids` the assignment refuses, and a document another request assigned or put back into processing meanwhile answer `400` with `message` only, as on an assignment.

```json
{
    "status": 400,
    "message": "This signer is on no document.",
    "errors": [
        {
            "field": "signers[1].id",
            "code": "Invalid",
            "message": "This signer is on no document."
        }
    ]
}
```

##### 403 — The workspace's plan lacks the Envelopes feature, or a signer's method or embedded signing the plan lacks (`PlanRestricted`); or an OAuth app's token lacks `documents:write` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — The envelope costs more than `max_total_credits` (`CreditCeilingExceeded`), or another request with this `Idempotency-Key` is still running (`IdempotencyKeyInUse`).

```json
{
    "status": 409,
    "code": "PlanRestricted",
    "total_credits": 1.5,
    "max_total_credits": 1,
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Estimate envelope cost

`POST /v1/accounts/{accountId}/envelopes/estimate-cost`

What creating the envelope would cost, creating and charging nothing. Takes the creation body and checks it as creation does (`max_total_credits` aside); answers as an assignment's estimate: the envelope counts as one document (`documents` is 1, an extra one when the plan's allowance doesn't cover it), each signer's notifications and identity check count once for the whole envelope, and each digital-certificate signature on every document it is made on, as creation charges them.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string, required) — What the invitation calls what is being signed, in place of a document's name. `<` is refused (`400`).
- `message` (string | null) — Optional message sent to every signer; their invitation adds the names of the documents they are on.
- `max_total_credits` (number) — Optional ceiling on what this request may spend, as on an assignment: refused with `409` and code `CreditCeilingExceeded`, nothing created or charged, when the envelope's total credits are above it. A value that is not a number of credits, zero or more, answers `400`; numeric text counts, as a form-encoded body sends it. The estimate ignores it.
- `signers` (array, required) — Every signer of the envelope, once, by id: up to 20. They all sign at once: an envelope takes no `step`.
- `documents` (array, required) — The documents, in the order the envelope lists them: up to 20.

Example:

```json
{
    "name": "Contrato de prestação de serviços",
    "message": "Segue o contrato e seus anexos.",
    "max_total_credits": 1.5,
    "signers": [
        {
            "id": "example_id_11",
            "verification_method": "Email",
            "notification_methods": [
                "Email"
            ],
            "embedded": true
        }
    ],
    "documents": [
        {
            "id": "example_id_3",
            "method": "virtual",
            "entries": [
                {
                    "page_id": "example_id_5",
                    "fields": [
                        {
                            "signer_id": "example_id_5",
                            "field_id": "example_id_5",
                            "display_settings": {
                                "left": 69,
                                "top": 282,
                                "width": 421,
                                "height": 45.86,
                                "fontFamily": "Arial",
                                "fontSize": 22,
                                "backgroundColor": "#D5EBFF"
                            }
                        }
                    ]
                }
            ],
            "signer_ids": [
                "example_id_11"
            ],
            "expires_at": "2026-12-31T23:59:59Z",
            "copy_receiver_ids": [
                "example_id_38"
            ]
        }
    ]
}
```

#### Responses

##### 200 — Cost estimate and balances

```json
{
    "data": {
        "documents": 1,
        "credits": 0.9,
        "needs_extra_document": true,
        "extra_document_cost": 1,
        "total_credits": 1.9,
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
        "credit_balance": 10,
        "has_sufficient_resources": true,
        "blocking_reason": null,
        "message": null
    },
    "status": 200,
    "message": ""
}
```

##### 400 — Refused on the same fields as creation, in `errors`, and with `message` alone for a method the platform does not know or a pairing it refuses. What creation checks while it creates each document (a signer's missing contact, a page or field not found, the balance) is not checked here: `has_sufficient_resources` says what the balance allows.

```json
{
    "status": 400,
    "message": "Add at least one item to documents.",
    "errors": [
        {
            "field": "documents",
            "code": "Required",
            "message": "Add at least one item to documents."
        }
    ]
}
```

##### 403 — The workspace's plan lacks the Envelopes feature, or a signer's method or embedded signing the plan lacks (`PlanRestricted`); or an OAuth app's token lacks `documents:write` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get envelope

`GET /v1/accounts/{accountId}/envelopes/{envelopeId}`

One envelope of the workspace: its documents in order, each with its status and signers, and the counts by status.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |

#### Responses

##### 200 — The envelope

```json
{
    "data": {
        "resource": "envelope",
        "id": "example_id_37",
        "name": "Contrato de prestação de serviços",
        "message": "Segue o contrato e seus anexos.",
        "documents": [
            {
                "id": "example_id_3",
                "position": 1,
                "name": "contrato.pdf",
                "status": "pending_signature",
                "artifacts": {
                    "original": "https://example.com/example-url-16",
                    "thumbnail": "https://example.com/example-url-17"
                },
                "signers": [
                    {
                        "id": "example_id_11",
                        "full_name": "Example User",
                        "email": "user10@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "completed": false,
                        "signed_at": "2026-11-06T14:30:00Z"
                    }
                ]
            }
        ],
        "counts": {
            "certificated": 1,
            "pending_signature": 2
        },
        "signing_urls": [
            {
                "signer_id": "example_id_5",
                "url": "https://example.com/example-url-6",
                "embedded": false
            }
        ],
        "created_at": "2026-11-04T12:00:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 403 — An OAuth app's token lacks `documents:read` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Delete envelope

`DELETE /v1/accounts/{accountId}/envelopes/{envelopeId}`

Delete an envelope once every document of it is closed: certificated, declined, cancelled, expired or failed. Before that it answers `409` with code `EnvelopeOpen`: cancel it first. The envelope is gone: it is no longer listed and reads `404`, and a create retried with its `Idempotency-Key` no longer answers it. Its documents stay as ordinary documents, with their certificates, downloads and webhooks; `GET /v1/documents/{documentId}?expand=envelope_id` reads null for them.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |

#### Responses

##### 200 — Envelope deleted

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 403 — An OAuth app's token lacks `documents:write` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — A document of the envelope is still open (`EnvelopeOpen`).

```json
{
    "status": 409,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Update envelope

`PATCH /v1/accounts/{accountId}/envelopes/{envelopeId}`

Rename the envelope, change its message or put its documents in a new order; send only what changes. Nothing is sent to anyone: the reads and every notice sent from then on (a reminder, a cancel, a document added) use the new name, message and order. The message is also each document's assignment `message`. Works on a closed envelope too. A refused request changes nothing; `errors` names every field at fault.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |

#### Request Body (required)

Fields (`application/json`):

- `name` (string) — What the invitation calls what is being signed. `<` is refused (`400`).
- `message` (string | null) — The message sent to every signer from now on; null for none.
- `document_ids` (array) — Every document of the envelope, each once, in the new order; `position` follows it. An envelope listing no document takes no order.

Example:

```json
{
    "name": "Contrato de prestação de serviços",
    "message": "Segue o contrato e seus anexos.",
    "document_ids": [
        "example_id_3",
        "example_id_39"
    ]
}
```

#### Responses

##### 200 — The envelope as changed

```json
{
    "data": {
        "resource": "envelope",
        "id": "example_id_37",
        "name": "Contrato de prestação de serviços",
        "message": "Segue o contrato e seus anexos.",
        "documents": [
            {
                "id": "example_id_3",
                "position": 1,
                "name": "contrato.pdf",
                "status": "pending_signature",
                "artifacts": {
                    "original": "https://example.com/example-url-16",
                    "thumbnail": "https://example.com/example-url-17"
                },
                "signers": [
                    {
                        "id": "example_id_11",
                        "full_name": "Example User",
                        "email": "user10@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "completed": false,
                        "signed_at": "2026-11-06T14:30:00Z"
                    }
                ]
            }
        ],
        "counts": {
            "certificated": 1,
            "pending_signature": 2
        },
        "signing_urls": [
            {
                "signer_id": "example_id_5",
                "url": "https://example.com/example-url-6",
                "embedded": false
            }
        ],
        "created_at": "2026-11-04T12:00:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — Refused as sent; nothing changed. Each field at fault is an entry of `errors`: `name` (empty, not text, over 255 characters, or holding `<`), `message` (not text), `document_ids` (empty, or not a list of every document of the envelope, each once).

```json
{
    "status": 400,
    "message": "List each of the envelope's documents once, in their new order.",
    "errors": [
        {
            "field": "document_ids",
            "code": "Invalid",
            "message": "List each of the envelope's documents once, in their new order."
        }
    ]
}
```

##### 403 — An OAuth app's token lacks `documents:write` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List envelope activities

`GET /v1/accounts/{accountId}/envelopes/{envelopeId}/activities`

The envelope's trail: the activities of every document it has had, one taken out included (not one deleted, whose own list answers 404), newest first (`sort=id` for oldest first), each naming its document (`document_id`, `document_name`). Each entry is otherwise a document activity, as `GET /v1/documents/{documentId}/activities` answers it. Paged: 20 per page by default; the `X-Pagination-Total-Count`, `X-Pagination-Page-Count`, `X-Pagination-Current-Page` and `X-Pagination-Per-Page` headers describe the full list, and a page past the end returns an empty `data`.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |
| `sort` | query | string | no | `-id` (default, newest first) or `id`. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

#### Responses

##### 200 — The envelope's activities

```json
{
    "data": [
        {
            "document_id": "example_id_40",
            "document_name": "Contrato.pdf",
            "id": 4,
            "event": "assignment_created",
            "message": "Assignment created by John Smith.",
            "payload": null,
            "origin": null,
            "created_at": "2022-07-19T19:28:13Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 403 — An OAuth app's token lacks `documents:read` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Download envelope artifacts

`GET /v1/accounts/{accountId}/envelopes/{envelopeId}/download/{artifactName}`

One zip, named after the envelope, of the chosen artifact of every document of it, in order. Each file is named after its document's position (`1 - contract.pdf`); `bundle` gives each document a folder of its bundle's files (`1 - contract/`). `certificated`, `certificate-page`, `pades` and `bundle` include only the documents certified so far, and `pades` only those that have one; `404` when no document has the artifact. The artifacts are those of `GET /v1/documents/{documentId}/download/{artifactName}`.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |
| `artifactName` | path | string | yes | Artifact type. |

#### Responses

##### 200 — The zip

##### 403 — An OAuth app's token lacks `documents:read` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Cancel envelope

`PUT /v1/accounts/{accountId}/envelopes/{envelopeId}/cancel`

Cancels every document of the envelope that can still be cancelled, the way deleting a pending document cancels it: the owner, its signers and its copy receivers are told. A document already closed, one every signer has signed (its certification queued), or one being certificated, is left as it is. A notice that fails doesn't stop the other documents. Safe to repeat: a second call cancels nothing and answers each document's status.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |

#### Responses

##### 200 — What happened to each document, in the envelope's order

```json
{
    "data": [
        {
            "id": "example_id_3",
            "status": "rejected_by_user",
            "cancelled": true
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 403 — An OAuth app's token lacks `documents:write` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Remind envelope signer

`PUT /v1/accounts/{accountId}/envelopes/{envelopeId}/signers/{signerId}/resend`

Reminds a signer of the whole envelope at once: one message, the envelope's invitation sent again from their first link, listing the documents they still have to sign and, by e-mail, those they already signed. Paid notification methods are charged once for it, for each message that goes out. Each document they still have to sign records a `signature_requested` event, as the invitation does.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Responses

##### 200 — Reminder result

```json
{
    "data": {
        "is_sent": true,
        "envelope_id": "example_id_5",
        "signer_id": "example_id_5"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — The signer has nothing left to sign in the envelope: every document of theirs is signed or closed; or the account lacks credits for the reminder.

```json
{
    "status": 400,
    "message": "This signer has nothing left to sign in this envelope."
}
```

##### 403 — An OAuth app's token lacks `documents:write` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The envelope was not found, or the signer is not one of its signers.

```json
{
    "status": 404,
    "message": "Signer not found."
}
```

##### 409 — The envelope is closed: every document of it is signed, declined, cancelled, expired or failed (`EnvelopeClosed`).

```json
{
    "status": 409,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Add document to envelope

`POST /v1/accounts/{accountId}/envelopes/{envelopeId}/documents`

Add a document to an open envelope for some of its signers. The document is checked as on creation: a `metadata_ready` document of the workspace with no assignment, signed on its virtual page or, with `collect`, on the fields placed in `entries`, with its own `expires_at` and `copy_receiver_ids`. An envelope holds up to 20 documents. It charges only its digital-certificate signatures, the envelope having paid for its document and its signers' notifications and identity checks when it was sent, and goes last in the envelope's order; a signer whose identity check the envelope approved is verified on it too. Each chosen signer is sent the envelope's invitation again, through the methods and with the link of their first invitation, now listing the new document, even once the document that invitation was sent from is taken out; the other signers hear nothing. The signers are the envelope's own: no one new joins once it was sent. Needs the Envelopes feature on the workspace's plan, as creating does. A refused request creates and charges nothing; `errors` names every field at fault.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |

#### Request Body (required)

Fields (`application/json`):

- `max_total_credits` (number) — Optional ceiling on what this request may spend, as on an assignment: refused with `409` and code `CreditCeilingExceeded`, nothing created or charged, when the document costs more on its own. A value that is not a number of credits, zero or more, answers `400`; numeric text counts, as a form-encoded body sends it.
- `id` (string, required) — A `metadata_ready` document of the workspace with no assignment.
- `method` (string) — As on an assignment: `virtual` (the default), signed on its virtual page, or `collect`, signed on the fields placed in `entries`.
- `entries` (array) — Required for `collect`, as on an assignment: the fields placed on each page of the document. Its signers are the ones on its fields, exactly its `signer_ids`.
- `signer_ids` (array, required) — The signers of this document, each listed once: on creation, signers listed in `signers`; when added, signers of the envelope's documents.
- `expires_at` (object) — This document's expiration, read as on an assignment, at least one hour in the future. Text is read as a date: ISO 8601 is the format to send (a UTC offset in the value is honored, a value without one is read as UTC, and a date alone means 23:59 UTC that day), and text that is a number is Unix time. A number is Unix time in seconds, its fraction dropped. Null, 0, an empty text or leaving it out means no expiration; a value that can't be read as a date answers `400`.
- `copy_receiver_ids` (array) — Signer IDs that only receive a copy of this document, as on an assignment.

Example:

```json
{
    "max_total_credits": 1.5,
    "id": "example_id_3",
    "method": "virtual",
    "entries": [
        {
            "page_id": "example_id_5",
            "fields": [
                {
                    "signer_id": "example_id_5",
                    "field_id": "example_id_5",
                    "display_settings": {
                        "left": 69,
                        "top": 282,
                        "width": 421,
                        "height": 45.86,
                        "fontFamily": "Arial",
                        "fontSize": 22,
                        "backgroundColor": "#D5EBFF"
                    }
                }
            ]
        }
    ],
    "signer_ids": [
        "example_id_11"
    ],
    "expires_at": "2026-12-31T23:59:59Z",
    "copy_receiver_ids": [
        "example_id_38"
    ]
}
```

#### Responses

##### 200 — The envelope with the document added

```json
{
    "data": {
        "resource": "envelope",
        "id": "example_id_37",
        "name": "Contrato de prestação de serviços",
        "message": "Segue o contrato e seus anexos.",
        "documents": [
            {
                "id": "example_id_3",
                "position": 1,
                "name": "contrato.pdf",
                "status": "pending_signature",
                "artifacts": {
                    "original": "https://example.com/example-url-16",
                    "thumbnail": "https://example.com/example-url-17"
                },
                "signers": [
                    {
                        "id": "example_id_11",
                        "full_name": "Example User",
                        "email": "user10@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "completed": false,
                        "signed_at": "2026-11-06T14:30:00Z"
                    }
                ]
            }
        ],
        "counts": {
            "certificated": 1,
            "pending_signature": 2
        },
        "signing_urls": [
            {
                "signer_id": "example_id_5",
                "url": "https://example.com/example-url-6",
                "embedded": false
            }
        ],
        "created_at": "2026-11-04T12:00:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — Refused as sent; nothing was created or charged. Each field at fault is an entry of `errors`: `id` (missing, or a document that can't take the assignment: not found, not `metadata_ready`, or already assigned); `method` (other than `virtual` or `collect`); `entries` (missing for `collect`, or not a list of pages with fields naming their `signer_id`); `signer_ids` (missing, not a list of ids, listed twice, not a signer of the envelope's documents, for `collect` not exactly the signers on its fields, or a digital-certificate signer on a `collect` document or with another signer); `expires_at` (not text, a number or null); a null `field` when the envelope already has 20 documents, or would hold more than 2,000 fields (a virtual document's being one per signer) or more than 100 copy receivers with this one. A page or field the assignment doesn't find on a `collect` document, a balance too low, an `expires_at` or `copy_receiver_ids` the assignment refuses, and a document another request assigned or put back into processing meanwhile answer `400` with `message` only, as on an assignment.

```json
{
    "status": 400,
    "message": "Each of a document's signers must be listed once in the envelope's signers.",
    "errors": [
        {
            "field": "signer_ids",
            "code": "Invalid",
            "message": "Each of a document's signers must be listed once in the envelope's signers."
        }
    ]
}
```

##### 403 — The workspace's plan lacks the Envelopes feature, or a signer's method or embedded signing the plan lacks (`PlanRestricted`); or an OAuth app's token lacks `documents:write` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — Every document of the envelope is closed (`EnvelopeClosed`), or the document costs more than `max_total_credits` on its own (`CreditCeilingExceeded`).

```json
{
    "status": 409,
    "code": "PlanRestricted",
    "total_credits": 1.5,
    "max_total_credits": 1,
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Take document out of envelope

`DELETE /v1/accounts/{accountId}/envelopes/{envelopeId}/documents/{documentId}`

Take an open document out of the envelope: it is cancelled as cancelling the envelope cancels it, its owner, signers and copy receivers told in a notice naming the envelope, and it is no longer listed; the other documents carry on. Out of the envelope, `GET /v1/documents/{documentId}?expand=envelope_id` reads null for it; a signer whose invitation link was sent from it keeps reaching the envelope's other documents with that link, so it can't be deleted on its own (`409` with code `EnvelopeOpen`) until every document of the envelope is closed. A document that is not in the envelope, or was taken out already, answers `404`.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `envelopeId` | path | string | yes | The envelope ID. |
| `documentId` | path | string | yes | Document ID. |

#### Responses

##### 200 — The envelope without the document

```json
{
    "data": {
        "resource": "envelope",
        "id": "example_id_37",
        "name": "Contrato de prestação de serviços",
        "message": "Segue o contrato e seus anexos.",
        "documents": [
            {
                "id": "example_id_3",
                "position": 1,
                "name": "contrato.pdf",
                "status": "pending_signature",
                "artifacts": {
                    "original": "https://example.com/example-url-16",
                    "thumbnail": "https://example.com/example-url-17"
                },
                "signers": [
                    {
                        "id": "example_id_11",
                        "full_name": "Example User",
                        "email": "user10@example.com",
                        "whatsapp_phone_number": "+5500000000000",
                        "completed": false,
                        "signed_at": "2026-11-06T14:30:00Z"
                    }
                ]
            }
        ],
        "counts": {
            "certificated": 1,
            "pending_signature": 2
        },
        "signing_urls": [
            {
                "signer_id": "example_id_5",
                "url": "https://example.com/example-url-6",
                "embedded": false
            }
        ],
        "created_at": "2026-11-04T12:00:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 403 — An OAuth app's token lacks `documents:write` (`InsufficientScope`). Also a member deactivated in the workspace, a workspace scheduled for deletion, or an OAuth token of another workspace.

```json
{
    "status": 403,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — The document is closed, signed by every signer (its certification queued) or being certificated, and can no longer be cancelled (`DocumentClosed`).

```json
{
    "status": 409,
    "code": "PlanRestricted",
    "message": "Bad request.",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## Fields

### List fields

`GET /v1/accounts/{accountId}/fields`

List the field definitions of a workspace.

When `include_standard` is enabled, records of type `signature`, `initial` and `signatureDate` are also returned. Every workspace has one of each, created with it; they cannot be created, and a field can't be placed on the `Editor` role with them.

To find the fields a sender can place on a document or template, list with `include_standard=true`: the result is every active field definition, signature fields included, and each one's `id` is the `field_id` to place.

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
            "regex": null,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
- `regex` (string | null)
- `is_required` (boolean)

Example:

```json
{
    "name": "Full name",
    "type": "text",
    "regex": null,
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
        "regex": null,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "regex": null,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
- `regex` (string | null)
- `is_active` (boolean)

Example:

```json
{
    "name": "string",
    "regex": null,
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
        "regex": null,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Validate field value

`POST /v1/accounts/{accountId}/fields/{fieldId}/validate`

Validate an input value against a field definition. Typically called with a signer access code during the signing flow.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header) or signer access code (`signer-access-code` query or body parameter).

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

##### 400 — The request was rejected because of its current state or invalid input.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The field is not one of the workspace, or the workspace does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Validate multiple field values

`POST /v1/accounts/{accountId}/fields/validate-multiple`

Validate multiple input values at once. The request body is a JSON array of `{field_id, value}` objects.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header) or signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Example:

```json
[
    {
        "field_id": "example_id_41",
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
            "field_id": "example_id_41",
            "type": "cpf",
            "success": false,
            "error_message": "Invalid CPF."
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 400 — The request was rejected because of its current state or invalid input.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The field is not one of the workspace, or the workspace does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List field types

`GET /v1/field-types`

List the types a workspace can create field definitions with (`POST /v1/accounts/{accountId}/fields`). The built-in `signature`, `initial` and `signatureDate` types are not listed: they can't be created, and their definitions come from `GET /v1/accounts/{accountId}/fields?include_standard=true`. `cpf` expects 11 digits; `cnpj` accepts 14-char values (letters A-Z allowed in positions 1–12 per the CNPJ Alfanumérico rule; check digits 13–14 stay numeric). Punctuation is ignored during validation.

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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## Users

### Get my notification preferences

`GET /v1/users/self/notification-preferences`

Which owner-facing document notifications the authenticated user receives by e-mail. All thirteen keys are always returned; everything defaults to `true`. Account and security e-mail (welcome, password reset, invitations, account deletion) is not configurable and never appears here. Not available to third-party OAuth applications (`403`), whatever their scopes: these are the user's personal settings. Assinafy's own apps can reach it.

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
        "SignerWhatsappFailed": true,
        "ContractRenewalNotice": true,
        "ContractExpiring": true,
        "ContractExpired": true,
        "ContractRenewed": true
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Update my notification preferences

`PUT /v1/users/self/notification-preferences`

Merges the supplied map into the authenticated user's preferences. Send only the keys you want to change — omitted keys keep their current value. Setting a key to `false` stops that e-mail for this user in every account they belong to. Returns the full map. An unknown code, a non-boolean value, or an empty body is rejected with 400 and nothing is written. Not available to third-party OAuth applications (`403`), whatever their scopes: these are the user's personal settings. Assinafy's own apps can reach it.

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
- `ContractRenewalNotice` (boolean) — A tracked contract entered its notice period: it is about to end or to renew.
- `ContractExpiring` (boolean) — A tracked contract ends in 45 or in 30 days.
- `ContractExpired` (boolean) — A tracked contract ended without renewal.
- `ContractRenewed` (boolean) — A tracked contract was auto-renewed into its next term.

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
    "SignerWhatsappFailed": true,
    "ContractRenewalNotice": true,
    "ContractExpiring": true,
    "ContractExpired": true,
    "ContractRenewed": true
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
        "SignerWhatsappFailed": true,
        "ContractRenewalNotice": true,
        "ContractExpiring": true,
        "ContractExpired": true,
        "ContractRenewed": true
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get my push notification preferences

`GET /v1/users/self/push-preferences`

Which document alerts the authenticated user receives as push notifications on their phones, separate from the e-mail preferences. Every key is always returned; everything defaults to `true`. New keys may be added. Not available to third-party OAuth applications (`403`), whatever their scopes: these are the user's personal settings. Assinafy's own apps can reach it.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — The current preferences

```json
{
    "data": {
        "SignerViewed": true,
        "SignerSigned": true,
        "DocumentCompleted": true,
        "SignerDeclined": true,
        "DocumentAboutToExpire": true,
        "DocumentExpired": true,
        "SignerIdentityReviewRequired": true,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Update my push notification preferences

`PUT /v1/users/self/push-preferences`

Merges the supplied map into the authenticated user's push preferences. Send only the keys you want to change — omitted keys keep their current value. Setting a key to `false` stops that push for this user in every account they belong to; e-mail is not affected. Returns the full map. An unknown code, a non-boolean value, or an empty body is rejected with 400 and nothing is written. Not available to third-party OAuth applications (`403`), whatever their scopes: these are the user's personal settings. Assinafy's own apps can reach it.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Request Body (required)

Fields (`application/json`):

- `SignerViewed` (boolean) — A signer opened the document for the first time.
- `SignerSigned` (boolean) — A signer signed the document.
- `DocumentCompleted` (boolean) — Every signer has signed and the document is certified.
- `SignerDeclined` (boolean) — A signer declined to sign.
- `DocumentAboutToExpire` (boolean) — The signature deadline is approaching.
- `DocumentExpired` (boolean) — The signature deadline passed.
- `SignerIdentityReviewRequired` (boolean) — A signer's identity awaits the sender's review. The e-mail for this is always sent.
- `SignerWhatsappFailed` (boolean) — A WhatsApp notification to a signer could not be delivered.

Example:

```json
{
    "SignerViewed": true,
    "SignerSigned": true,
    "DocumentCompleted": true,
    "SignerDeclined": true,
    "DocumentAboutToExpire": true,
    "DocumentExpired": true,
    "SignerIdentityReviewRequired": true,
    "SignerWhatsappFailed": true
}
```

#### Responses

##### 200 — The updated preferences

```json
{
    "data": {
        "SignerViewed": true,
        "SignerSigned": true,
        "DocumentCompleted": true,
        "SignerDeclined": true,
        "DocumentAboutToExpire": true,
        "DocumentExpired": true,
        "SignerIdentityReviewRequired": true,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### My cross-account document KPIs

`GET /v1/users/self/stats`

The authenticated user's document-funnel KPIs summed across all accounts they currently belong to. `granularity=monthly` (default) returns the last 12 months, most recent first; `granularity=daily` with `month=YYYY-MM` returns that month's days. Series are zero-filled. Not available to OAuth access tokens (`403`): a token is bound to one workspace, so an OAuth app reads that workspace's figures from **Account document KPIs** instead.

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
            "signature_requests_notification_email": 55,
            "signature_requests_notification_whatsapp": 18,
            "signature_requests_notification_bypass": 3,
            "signature_requests_verification_email": 48,
            "signature_requests_verification_whatsapp": 6,
            "signature_requests_verification_bypass": 3,
            "signature_requests_verification_digital_certificate": 4,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get the authenticated user

`GET /v1/users/self`

Returns the profile of the user owning the access token. Not available to OAuth access tokens (`403`); an OAuth app reads the user's identity from `GET /v1/oauth/userinfo`.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — The current user

```json
{
    "data": {
        "id": "example_id_28",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## OAuth

### Exchange a code, refresh token, or subject token for an access token

`POST /v1/oauth/token`

Implements the RFC 6749 §5.1/§5.2 token-endpoint body contract in
     *         both directions: a successful exchange returns a flat JSON object with
     *         `access_token` at the top level, and a failure returns a flat
     *         `{error, error_description}` object — neither is wrapped in this API's
     *         usual response envelope, since no standard OAuth client library (or MCP
     *         connector) would find `access_token` or `error` inside a `data` key.
     *
     *         The third grant, `urn:ietf:params:oauth:grant-type:token-exchange` (RFC 8693),
     *         is restricted to a confidential internal-service client (see `/oauth/introspect`)
     *         and trades a front-end resource's access token (the `subject_token`) for one
     *         minted for THIS API — the crossing an MCP server makes after a user consents,
     *         since its own token can never be forwarded here directly. The issued token is
     *         never wider than the subject: `scope`, when sent, must be a subset of the
     *         subject's own scopes, and `resource` must equal this API's own resource
     *         identifier exactly. No refresh token is issued; the caller re-exchanges from
     *         the user's own token instead of holding unattended API access.

Replaying a refresh token already rotated ends the whole authorization. For Assinafy's own apps it ends that device's session.

**Authentication:** none (public endpoint).

#### Request Body (required)

Fields (`application/x-www-form-urlencoded`):

- `grant_type` (string, required) — `urn:ietf:params:oauth:grant-type:token-exchange` is for internal service clients only (Assinafy's own MCP server) — an ordinary confidential or public client authenticates with it and always gets `invalid_client`, exactly as an unrecognized client would. Everyday integrators use `authorization_code` and `refresh_token`.
- `code` (string)
- `redirect_uri` (string)
- `code_verifier` (string) — RFC 7636: 43-128 characters from [A-Za-z0-9-._~]. Shorter values are rejected with `invalid_grant`.
- `refresh_token` (string)
- `client_id` (string, required)
- `client_secret` (string) — Confidential clients only. Public clients authenticate with PKCE and are never issued a secret; the token-exchange grant requires a confidential, internal-service client and therefore always requires this.
- `resource` (string) — RFC 8707 resource indicator. For `authorization_code`/`refresh_token`, optional; when present it must be the `resource` value published by /.well-known/oauth-protected-resource and must match the one sent to /authorize, otherwise `invalid_target`. For the token-exchange grant it is REQUIRED and must equal this API's own resource identifier exactly (never a front-end resource such as the MCP server), otherwise `invalid_target`.
- `subject_token` (string) — Token-exchange grant only. The front-end resource's access token being traded in. Must be a live, original (never itself exchanged) token minted for a resource this server issues tokens for, other than this API's own audience.
- `subject_token_type` (string) — Token-exchange grant only. Required; only `urn:ietf:params:oauth:token-type:access_token` is supported.
- `requested_token_type` (string) — Token-exchange grant only. Optional; when present it must agree with the only type this server issues.

Example:

```json
{
    "grant_type": "authorization_code",
    "code": "string",
    "redirect_uri": "https://example.com/example-url-18",
    "code_verifier": "string",
    "refresh_token": "example_secret",
    "client_id": "example_id_5",
    "client_secret": "example_secret",
    "resource": "string",
    "subject_token": "example_secret",
    "subject_token_type": "urn:ietf:params:oauth:token-type:access_token",
    "requested_token_type": "urn:ietf:params:oauth:token-type:access_token"
}
```

#### Responses

##### 200 — The token response

```json
{
    "access_token": "example_credential",
    "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": null,
    "scope": "documents:read",
    "id_token": null
}
```

##### 400 — `invalid_grant` (bad, expired, replayed, or wrong-client authorization code; a `code_verifier` outside the RFC 7636 grammar of 43-128 unreserved characters; redirect_uri mismatch; a refresh token whose authorization no longer includes `offline_access`; for token-exchange, a `subject_token` that is unusable, itself an exchanged token, not visible to service clients, or expired), `invalid_target` (a `resource` this server does not issue tokens for, one disagreeing with the authorized value, or — for token-exchange — one other than this API's own resource identifier), `invalid_scope` (token-exchange only: the requested `scope` is not a subset of the subject token's own scopes), `invalid_request` (token-exchange only: an unsupported `subject_token_type`/`requested_token_type`), or `unsupported_grant_type`

```json
{
    "error": "invalid_grant",
    "error_description": "string"
}
```

##### 401 — `invalid_client` — unknown/disabled client or failed client authentication. The description never reveals whether client_id exists.

```json
{
    "error": "invalid_client",
    "error_description": "Client authentication failed."
}
```

##### 429 — Rate limit exceeded; wait the `Retry-After` seconds. Limited per caller IP.

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Revoke a token

`POST /v1/oauth/revoke`

Revokes an access or refresh token. A refresh token ends the whole authorization; for Assinafy's own apps, it ends that device's session, and the authorization stays. Every token outcome always returns 200 — including a token that does not exist, is already revoked, or is malformed — so the endpoint can never be used to probe whether a token exists. The one exception is failed client authentication, which returns 401.

**Authentication:** none (public endpoint).

#### Request Body (required)

Fields (`application/x-www-form-urlencoded`):

- `token` (string, required)
- `token_type_hint` (string)
- `client_id` (string, required)
- `client_secret` (string)

Example:

```json
{
    "token": "example_secret",
    "token_type_hint": "access_token",
    "client_id": "example_id_5",
    "client_secret": "example_secret"
}
```

#### Responses

##### 200 — Revoked

##### 401 — `invalid_client` — the only case that is not reported as success. Every token outcome (revoked, already revoked, unknown, malformed) always returns 200; only failed client authentication returns 401.

```json
{
    "error": "invalid_client",
    "error_description": "Client authentication failed."
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### OpenID Connect userinfo

`GET /v1/oauth/userinfo`

Claims about the user who authorized this token. Requires the openid scope; name requires profile and email requires email. Per OIDC Core §5.3.2, the response is a flat JSON object of claims — never this API's usual `{status, data, message}` envelope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Responses

##### 200 — The user's claims

```json
{
    "sub": "example_id_31",
    "name": "Maria Silva",
    "email": null,
    "email_verified": null
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### OAuth 2.0 protected resource metadata

`GET /.well-known/oauth-protected-resource`

RFC 9728. Identifies this API as a protected resource, the
     *         authorization server(s) that can issue tokens for it, and the scopes it
     *         accepts. `scopes_supported` deliberately excludes `offline_access` — per the
     *         MCP specification, requesting a refresh token is a client concern, not
     *         something a resource is protected by. Also referenced from the
     *         `WWW-Authenticate: Bearer resource_metadata="..."` challenge on a 401/403.
     *         Per RFC 8615, the response is the bare metadata object itself — never this
     *         API's usual `{status, data, message}` envelope. The `authorization_servers` entry names the host that owns the browser-facing flow — start every integration by fetching `{authorization_servers[0]}/.well-known/oauth-authorization-server` (RFC 8414) from there, not from this API.

**Authentication:** none (public endpoint).

#### Responses

##### 200 — The protected resource metadata

```json
{
    "resource": "string",
    "authorization_servers": [
        "string"
    ],
    "scopes_supported": [
        "string"
    ],
    "bearer_methods_supported": [
        "header"
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "verification_code": "example_secret",
        "verification_url": "https://example.com/example-url-4",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string",
                "color": "ff8800"
            }
        ],
        "assignment": null,
        "pages": [
            {
                "id": "example_id_6",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "envelope_id": null,
        "envelope": null,
        "has_contract": true,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Send access token for public document

`PUT /v1/public/documents/{documentId}/send-token`

Send a one-time access token to a signer of a public document, so they can view it. The document must be pending signature, and `recipient` must belong to a signer of the document who has not signed yet. Only the `email` channel is supported. Public endpoint.

**Authentication:** none (public endpoint).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | The document ID. |

#### Request Body (required)

Fields (`application/json`):

- `channel` (string, required) — Where to send the token. Only `email` is supported.
- `recipient` (string, required) — The signer's address on that channel — for `email`, the signer's email address.

Example:

```json
{
    "channel": "email",
    "recipient": "user1@example.com"
}
```

#### Responses

##### 200 — Token sent

```json
{
    "data": {
        "document": {
            "resource": "document",
            "id": "example_id_42",
            "name": "Contract.pdf",
            "page_count": 3,
            "created_by": "Jane Doe"
        },
        "channel": "email",
        "recipient": "user1@example.com"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get current signer

`GET /v1/signers/self`

Return the signer identified by the signer access code, including the `has_signature`/`has_initial`/`is_signature_reusable` flags and the `verification_method` of this signature request. Available before verification, so the signing page can pick the right first step.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — The signer

```json
{
    "data": {
        "has_signature": true,
        "has_initial": false,
        "is_signature_reusable": false,
        "verification_method": "Email",
        "resource": "signer",
        "id": "example_id_14",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "government_id": "00000000000",
        "has_accepted_terms": false
    },
    "status": 200,
    "message": ""
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Called with an OAuth application token instead of the access code.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Workspace brand for the signing page

`GET /v1/sign/theme`

The brand of the workspace that sent the document: its name, its colors (`primary_color` is the button background, `secondary_color` the button text, 6-digit hex without `#`) and the address of its logo, or `null` when it has none. The logo address carries no access code: append `signer-access-code` to it, as to every signer call. Available before verification and after the document is deleted, so every screen of the signing page can carry the brand. Uses the signer access code.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Responses

##### 200 — The brand

```json
{
    "data": {
        "account_name": "Account Name",
        "primary_color": "aabbcc",
        "secondary_color": "ffffff",
        "logo": "https://example.com/example-url-1"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Workspace logo for the signing page

`GET /v1/sign/logo`

The logo image of the workspace that sent the document. Available before verification and after the document is deleted. Uses the signer access code.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Responses

##### 200 — The logo image

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The workspace has no logo.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Identity document verification status

`GET /v1/signers/identity-verification`

Current state of the signer's identity document verification. Backfills a pending decision from the provider. Uses the signer access code.

**One live session per signer:** `can_start` is true before a provider session exists, and again once that session is Expired -- the capture link lapsed before anything was submitted, so the signer may open a new one. Once a session is Pending, In Review, Approved, Declined or Abandoned it is false. A signer who reaches Declined or Abandoned cannot restart here; the account must start a whole new process (new document, new assignment). With the code of a document of an envelope, this is the signer's one check for the whole envelope, whichever of their codes of it asks.

**In review:** the signer continues -- views, confirms their data and signs -- while the account reviews the result. The document is certificated only after the account approves every signer under review; if it rejects one, the document is cancelled and every signer receives the cancellation notice.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Verification state

```json
{
    "data": {
        "can_start": false,
        "status": "Pending",
        "url": "https://example.com/example-url-19",
        "expires_at": "2026-10-07T21:18:47Z",
        "completed_at": "2026-08-10T20:32:00Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Start identity document verification

`POST /v1/signers/identity-verification`

Records the signer's biometric-processing consent and opens a provider session. Returns the hosted verification URL to redirect to. Uses the signer access code.

**One live session per signer:** this succeeds when no session exists yet, or when the last one Expired (the capture link lapsed before anything was submitted); the expired session is replaced by a new one. Otherwise -- Pending, In Review, Approved, Declined or Abandoned -- it returns `400`. A resend never destroys or replaces a live provider session, and the account is billed once per signer at assignment creation, never again on a restart. Recovering from a Declined or Abandoned verification means the account must start a whole new process (new document, new assignment). With the code of a document of an envelope, it starts the signer's one check for the whole envelope: one session, whichever of their codes of it is used, billed once with the envelope.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Request Body (required)

Fields (`application/json`):

- `consent` (boolean, required) — Must be true. Explicit consent to biometric processing.

Example:

```json
{
    "consent": true
}
```

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Session created

```json
{
    "data": {
        "id": "example_id_20",
        "url": "https://example.com/example-url-19",
        "expires_at": "2026-10-07T21:18:47Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — Consent missing, this signer already has a verification session that is not Expired (with the code of a document of an envelope, on any of their documents of it) or can no longer verify (with the code of a document of an envelope, also once no document of it, not taken out, awaits their signature), another start of the signer's envelope check is still running (`Identity verification is already being started for this signer. Try again shortly.`), the signer has no full name, or the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get signer's document

`GET /v1/signers/{signerId}/document`

Return the document and the signer's assignment items, scoped to the signer access code. The response adds `current_signer`: this signer, with their `verification_method`, `notification_methods` and `completed` (whether they have already signed). Once the signer is done (signed, or the document was declined, cancelled, expired or failed; for a document of an envelope, with every document of the envelope they are on) for more than 30 minutes, or the workspace was deleted, the code is closed: this returns only `id`, `name`, `status`, `current_signer` and `certified_copy`, with `is_signer_access_closed: true` (and `envelope`, when asked for), and the signer's other endpoints answer `410`. `certified_copy` says whether the signer can ask for the certified copy again (`POST /v1/sign/certified-copy`): `available`, the `notification_method` it goes on and, for WhatsApp, `resends_left`. Unlike `GET /v1/sign`, this answers before a certificate or identity-check signer confirms their data, so their link learns its envelope here.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signerId` | path | string | yes | The signer ID. |
| `expand` | query | array | no | `envelope` adds the envelope the code belongs to, its id and name, also once the code is closed and when the code's own document was taken out (the code still reaches the rest); `null` for a link outside an envelope or whose envelope was deleted. Without it the document reads as it always has. |

#### Responses

##### 200 — The document with the signer's items

```json
{
    "data": {
        "current_signer": {
            "verification_method": "Email",
            "notification_methods": [
                "Email"
            ],
            "completed": false,
            "resource": "signer",
            "id": "example_id_14",
            "full_name": "Example User",
            "email": "user3@example.com",
            "whatsapp_phone_number": "+5500000000000",
            "government_id": "00000000000",
            "has_accepted_terms": false
        },
        "is_signer_access_closed": false,
        "certified_copy": {
            "available": false,
            "notification_method": "Email",
            "resends_left": null
        },
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
        "verification_code": "example_secret",
        "verification_url": "https://example.com/example-url-4",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string",
                "color": "ff8800"
            }
        ],
        "assignment": null,
        "pages": [
            {
                "id": "example_id_6",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "envelope_id": null,
        "envelope": null,
        "has_contract": true,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### View document to sign

`GET /v1/sign`

Retrieve the document a signer has been invited to sign, using the signer access code. Marks the document as viewed. The assignment carries only this signer's items, and leaves out the other signers, their signing links (`signing_urls`), the copy receivers and the signing `summary`. The response adds `current_signer`: this signer, with their `verification_method`, `notification_methods` and `completed` (whether they have already signed). Returns 409 while the document is still being prepared (retry with backoff). Once the signer is done (signed, or the document was declined, cancelled, expired or failed; for a document of an envelope, with every document of the envelope they are on) for more than 30 minutes, or the workspace was deleted, the code is closed: this returns only `id`, `name`, `status`, `current_signer` and `certified_copy`, with `is_signer_access_closed: true` (and `envelope`, when asked for), and the signer's other endpoints answer `410`. `certified_copy` says whether the signer can ask for the certified copy again (`POST /v1/sign/certified-copy`): `available`, the `notification_method` it goes on and, for WhatsApp, `resends_left`.

**Signers whose verification method is `DigitalCertificate`** must have confirmed their data *and* accepted the terms before this returns the document; otherwise it is `400`. Both are satisfied in one call to `PUT /v1/documents/{documentId}/signers/confirm-data` with `has_accepted_terms: true`, so send that before this endpoint — the `has_accepted_terms` query parameter here is too late to open the gate. `PUT /v1/signers/accept-terms` also works and is never gated.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `has_accepted_terms` | query | boolean | no | Set true to record terms acceptance. |
| `expand` | query | array | no | `envelope` adds the envelope the code belongs to, its id and name, also once the code is closed and when the code's own document was taken out (the code still reaches the rest); `null` for a link outside an envelope or whose envelope was deleted. Without it the document reads as it always has. |
| `document_id` | query | string | no | With the code of a document of an envelope: another document of that envelope the signer is on, to open in place of the code's own; the code's e-mail or WhatsApp verification is carried there, once. A value that is no document id (a list, or empty) answers `400`. Ignored with any other code. |

#### Responses

##### 200 — The document with the signer's assignment

```json
{
    "data": {
        "current_signer": {
            "verification_method": "Email",
            "notification_methods": [
                "Email"
            ],
            "completed": false,
            "resource": "signer",
            "id": "example_id_14",
            "full_name": "Example User",
            "email": "user3@example.com",
            "whatsapp_phone_number": "+5500000000000",
            "government_id": "00000000000",
            "has_accepted_terms": false
        },
        "is_signer_access_closed": false,
        "certified_copy": {
            "available": false,
            "notification_method": "Email",
            "resends_left": null
        },
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
        "verification_code": "example_secret",
        "verification_url": "https://example.com/example-url-4",
        "decline_reason": null,
        "declined_by": null,
        "tags": [
            {
                "id": "example_id_5",
                "name": "string",
                "color": "ff8800"
            }
        ],
        "assignment": null,
        "pages": [
            {
                "id": "example_id_6",
                "number": 1,
                "height": 2100,
                "width": 1275,
                "download_url": "https://example.com/example-url-5"
            }
        ],
        "envelope_id": null,
        "envelope": null,
        "has_contract": true,
        "created_at": "2026-06-03T03:54:16Z",
        "updated_at": "2026-06-03T03:54:16Z"
    },
    "status": 200,
    "message": ""
}
```

##### 400 — A digital-certificate signer has not yet confirmed their data or accepted the terms, the signer's step has not started yet (sequential signing), or, with the code of a document of an envelope, `document_id` is no document id.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — `document_id` names a document outside the code's envelope, or one the signer is not on; or the workspace deleted the document while the code is still open.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — The document is not ready to be viewed yet.

```json
{
    "status": 409,
    "message": "Bad request.",
    "code": "PlanRestricted",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Sign assignment items

`POST /v1/documents/{documentId}/assignments/{assignmentId}`

Sign a document with input fields (collect method): submit the signer's item values, completing their items. Signing again after the signer has signed changes nothing and returns the current assignment. For **virtual** assignments the signer must first confirm their data via `PUT /v1/documents/{documentId}/signers/confirm-data`, otherwise this returns `400` (Signer data must be confirmed before signing). Signers whose verification method is `DigitalCertificate` cannot use this endpoint — their signature must be produced through `POST /v1/signers/certificate/start` + `/complete`, and this returns `400`. The request body is a JSON array of item entries. Uses the signer access code. With the code of a document of an envelope, it acts on the signer's request on the document the route names, if that document is in the same envelope, carrying the code's e-mail or WhatsApp verification there.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

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

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Signing result

```json
{
    "data": {},
    "status": 200,
    "message": ""
}
```

##### 400 — Signer data must be confirmed before signing (virtual assignments), the signer must sign with a digital certificate through the digital certificate endpoints, an entry names a page, field or item that is not one of this signer's, or the signer's step has not started yet (sequential signing). Nothing is signed when an entry is refused.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The assignment is not the one of the signer's request: the access code's own or, with the code of a document of an envelope, the one on the document the route names; or the route names a document outside the code's envelope, or one the signer is not on.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — The document is not ready to be signed yet.

```json
{
    "status": 409,
    "message": "Bad request.",
    "code": "PlanRestricted",
    "data": null,
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Reject (decline) assignment

`PUT /v1/documents/{documentId}/assignments/{assignmentId}/reject`

The signer declines to sign the document, giving a reason. Uses the signer access code. With the code of a document of an envelope, it acts on the signer's request on the document the route names, if that document is in the same envelope, carrying the code's e-mail or WhatsApp verification there.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |
| `assignmentId` | path | string | yes | The assignment ID. |

#### Request Body (required)

Fields (`application/json`):

- `decline_reason` (string, required) — Descriptive reason for declining. Up to 2000 characters; longer values return 400.

Example:

```json
{
    "decline_reason": "I do not agree with clause 2."
}
```

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Assignment declined

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 400 — `decline_reason` is missing or longer than 2000 characters, the assignment or the document is no longer pending, or the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The assignment is not the one of the signer's request: the access code's own or, with the code of a document of an envelope, the one on the document the route names; or the route names a document outside the code's envelope, or one the signer is not on.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Sign multiple documents

`PUT /v1/signers/documents/sign-multiple`

Sign several documents in one request, for a signer with multiple pending documents. Each document must be prepared for the **virtual** signature method. A listed document the signer already signed is left as it is. Uses the signer access code.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Request Body (required)

Fields (`application/json`):

- `document_ids` (array, required) — IDs of the documents to sign.

Example:

```json
{
    "document_ids": [
        "example_id_43",
        "example_id_44"
    ]
}
```

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Signing result

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 400 — A listed document is not a virtual document of this signer, is not pending signature, waits for an earlier signing step, or, for the code of a document of an envelope, is not part of that envelope.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — A listed document ID does not exist in the workspace. The message names the unknown IDs.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Decline multiple documents

`PUT /v1/signers/documents/decline-multiple`

Decline several documents in one request. Uses the signer access code.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Request Body (required)

Fields (`application/json`):

- `document_ids` (array, required) — IDs of the documents to decline.
- `decline_reason` (string, required) — Reason for declining. Up to 2000 characters; longer values return 400.

Example:

```json
{
    "document_ids": [
        "example_id_43",
        "example_id_44"
    ],
    "decline_reason": "Unfavorable terms."
}
```

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Decline result

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 400 — A listed document is not this signer's, is not pending signature, waits for an earlier signing step, or, for the code of a document of an envelope, is not part of that envelope. Nothing is declined.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — A listed document ID does not exist in the workspace. The message names the unknown IDs.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Verify signer code (OTP)

`POST /v1/verify`

Submit the verification code (OTP) sent to the signer to unlock the signing flow. Uses the signer access code. 5 wrong codes within 15 minutes of the first one lock the request until those 15 minutes end: every attempt, the right code included, returns `429`. A right code clears the count. With the code of a document of an envelope, the code of the signer's envelope invitation is accepted too, and wrong codes on any of their documents of the envelope count together.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

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

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Code verified. `data` is an empty list.

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 400 — The code is wrong, or the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 429 — Too many wrong codes. Try again once 15 minutes have passed since the first one.

```json
{
    "status": 429,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Confirm signer data

`PUT /v1/documents/{documentId}/signers/confirm-data`

The signer confirms or updates their data before signing. Uses the signer access code. With the code of a document of an envelope, it acts on the signer's request on the document the route names, if that document is in the same envelope, carrying the code's e-mail or WhatsApp verification there. The code's own document, taken out of its envelope, takes the confirmation too while a document of the envelope still awaits signatures: it signs nothing (that document stays cancelled) and opens the reads a certificate or identity-check signer's method gates, so the signer reaches the documents left.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `documentId` | path | string | yes | Document ID. |

#### Request Body (required)

Fields (`application/json`):

- `email` (string) — Required when the signer is verified or notified by e-mail. Saved when the signer has none; otherwise it must be theirs.
- `whatsapp_phone_number` (string) — Required when the signer is verified or notified by WhatsApp. Saved when the signer has none; otherwise it must be theirs.
- `has_accepted_terms` (boolean) — `true` also records that the signer accepted the terms of use.

Example:

```json
{
    "email": "user11@example.com",
    "whatsapp_phone_number": "+5500000000000",
    "has_accepted_terms": true
}
```

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The route names a document the code doesn't reach: outside the code's envelope, or one the signer is not on.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Data confirmed. `data` is an empty list.

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 400 — An e-mail or WhatsApp number the signer's methods need is missing, invalid or not theirs, or the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Accept terms (signer)

`PUT /v1/signers/accept-terms`

Record that the signer accepted the terms of use. Uses the signer access code.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Terms accepted

```json
{
    "data": {
        "full_name": "Example User",
        "email": "user3@example.com",
        "has_accepted_terms": true
    },
    "status": 200,
    "message": ""
}
```

##### 400 — The signer's verification is not done yet (e.g. the e-mail code), or the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Upload signature image

`POST /v1/signature`

Upload the signer's signature (or initials) image as the raw request body. Uses the signer access code.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

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

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — Signature stored. `data` is an empty list.

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 400 — The image is not a PNG or JPEG file, or it is blank; or the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Download signature image

`GET /v1/signature/{signatureType}`

Download the signer's stored signature/initials image. Uses the signer access code.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signatureType` | path | string | yes | Image type (e.g. `signature`, `initial`). |

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 200 — The signature image

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List signer's documents

`GET /v1/signers/{signerId}/documents`

List the documents a signer is party to. Accepts either the signer access code or the account's own credentials (API key or bearer token) — with account credentials, the signer must belong to that account's workspace. With the signer access code, `signerId` must be the code's own signer (otherwise `403`), only documents whose signing step has been reached are listed (for the code of a document of an envelope, only that envelope's documents), and each assignment leaves out `signing_urls`.

**Authentication:** signer access code (`signer-access-code` query or body parameter) or Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signerId` | path | string | yes | The signer ID. |
| `envelope_id` | query | string | no | Only the members of this envelope. Anything but text answers `400`. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

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
            "verification_code": "example_secret",
            "verification_url": "https://example.com/example-url-4",
            "decline_reason": null,
            "declined_by": null,
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string",
                    "color": "ff8800"
                }
            ],
            "assignment": null,
            "pages": [
                {
                    "id": "example_id_6",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-5"
                }
            ],
            "envelope_id": null,
            "envelope": null,
            "has_contract": true,
            "created_at": "2026-06-03T03:54:16Z",
            "updated_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 403 — The access code belongs to another signer; or, with a user's token or key, a role, a membership or an OAuth scope refuses it.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The signer is not in the caller's workspace.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code, the signer's step has not started yet (sequential signing); or `envelope_id` is not text, an entry of `errors`.

```json
{
    "status": 400,
    "message": "This signer is in a pending step and has not been notified yet."
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Search signer's documents

`GET /v1/signers/{signerId}/documents/search`

Search the documents a signer is party to (compact representation). Accepts either the signer access code or the account's own credentials (API key or bearer token) — with account credentials, the signer must belong to that account's workspace. With the signer access code, `signerId` must be the code's own signer (otherwise `403`), only documents whose signing step has been reached are listed (for the code of a document of an envelope, only that envelope's documents), and each assignment leaves out `signing_urls`.

**Authentication:** signer access code (`signer-access-code` query or body parameter) or Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signerId` | path | string | yes | The signer ID. |
| `envelope_id` | query | string | no | Only the members of this envelope. Anything but text answers `400`. |
| `search` | query | string | no | Search term. |

#### Responses

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

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
            "verification_code": "example_secret",
            "verification_url": "https://example.com/example-url-4",
            "decline_reason": null,
            "declined_by": null,
            "tags": [
                {
                    "id": "example_id_5",
                    "name": "string",
                    "color": "ff8800"
                }
            ],
            "assignment": null,
            "pages": [
                {
                    "id": "example_id_6",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-5"
                }
            ],
            "envelope_id": null,
            "envelope": null,
            "has_contract": true,
            "created_at": "2026-06-03T03:54:16Z",
            "updated_at": "2026-06-03T03:54:16Z"
        }
    ],
    "status": 200,
    "message": ""
}
```

##### 403 — The access code belongs to another signer; or, with a user's token or key, a role, a membership or an OAuth scope refuses it.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The signer is not in the caller's workspace.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code, the signer's step has not started yet (sequential signing); or `envelope_id` is not text, an entry of `errors`.

```json
{
    "status": 400,
    "message": "This signer is in a pending step and has not been notified yet."
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Download the document to sign

`GET /v1/signers/{signerId}/documents/{documentId}/download/{artifactName}`

The original of a document the signer still has to sign, with their access code (`signer-access-code`). Only `original` is available (`403` otherwise): the certified copy is sent to the signer by e-mail or WhatsApp. A request without an access code, such as a link from an older completion e-mail, is redirected (`302`) to the expired-link page, with a `?token=` the page can ask for the certified copy with when the signer and document match a completed signature request.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `signerId` | path | string | yes | The signer ID. |
| `documentId` | path | string | yes | Document ID. |
| `artifactName` | path | string | yes | Artifact type. Only `original`. |

#### Responses

##### 200 — The artifact binary

##### 302 — No access code: redirected to the expired-link page.

##### 403 — An artifact other than `original`.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The signer or the document is not the code's, or the code doesn't reach the document.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 410 — With a signer access code: the code is closed, because its signer finished (for a document of an envelope, every document of it they are on) more than 30 minutes ago. It still shows the signer's status and asks for the certified copy (`GET /v1/sign`).

```json
{
    "status": 410,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — With a signer access code: the signer's step has not started yet (sequential signing).

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Send the certified copy again

`POST /v1/sign/certified-copy`

Sends the signer their certified document again, with a download link valid for 30 minutes. It goes on the channel of the signature request (e-mail when the request used e-mail, otherwise WhatsApp) and only to the e-mail or number the signing messages went to, never to a changed signer record. Works with the signer's access code after they signed, including once the code is closed and after the workspace is deleted. E-mail: once every 2 minutes and 10 times in 24 hours. WhatsApp: once per signature request; after that the signer must ask the sender. `certified_copy` on `GET /v1/sign` says whether it is available.

**Authentication:** signer access code (`signer-access-code` query or body parameter).

#### Request Body

Fields (`application/json`):

- `document_id` (string) — With the code of a document of an envelope: another document of that envelope the signer is on, whose certified copy to send, in place of the code's own. A value that is no document id (a list, or empty) answers `400`. Ignored with any other code.

Example:

```json
{
    "document_id": "example_id_3"
}
```

#### Responses

##### 200 — Sent

```json
{
    "data": {
        "available": true,
        "notification_method": "Email",
        "resends_left": null,
        "sent_to": "j***@example.com"
    },
    "status": 200,
    "message": ""
}
```

##### 404 — `document_id` names a document outside the code's envelope, or one the signer is not on.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — The signer has not signed, the document is not certified yet, or the request has no e-mail or WhatsApp to send to (ask the sender).

```json
{
    "status": 409,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 429 — E-mail: asked again within 2 minutes or more than 10 times in 24 hours. WhatsApp: already re-sent once (ask the sender).

```json
{
    "status": 429,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — The message could not be sent; nothing was used up, so it can be asked again.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 400 — The signer's step has not started yet (sequential signing), or, with the code of a document of an envelope, `document_id` is no document id.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Download the certified copy from a sent link

`GET /v1/signers/downloads/{token}`

The link in the completion and re-send messages. Valid 7 days in the completion message and 30 minutes when re-sent. Add `/pades` for the PAdES version on documents that have one. An expired or unknown link is redirected (`302`) to the expired-link page; for a known link the redirect carries `?token=`, with which the page can ask for a new one (`POST /v1/signers/downloads/{token}/resend`).

**Authentication:** none (public endpoint).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `token` | path | string | yes | The link token. |

#### Responses

##### 200 — The certified PDF

##### 302 — Expired or unknown link: redirected to the expired-link page.

##### 404 — `/pades` on a document that has no PAdES version.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Send the certified copy again from an expired link

`POST /v1/signers/downloads/{token}/resend`

Used by the page an expired download link leads to. Works with the link's token even after it expired, and on the same terms as `POST /v1/sign/certified-copy`: the request's channel, only the e-mail or number of the signing, the same limits. Copy receivers' links have no signature request (`409`).

**Authentication:** none (public endpoint).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `token` | path | string | yes | The link token. |

#### Responses

##### 200 — Sent

```json
{
    "data": {
        "available": true,
        "notification_method": "Email",
        "resends_left": null,
        "sent_to": "j***@example.com"
    },
    "status": 200,
    "message": ""
}
```

##### 404 — Unknown link.

##### 409 — Nothing can be sent from here (copy receiver, Bypass signer, no recorded contact, or the document is not certified): ask the sender.

##### 429 — E-mail: asked again within 2 minutes or more than 10 times in 24 hours. WhatsApp: already re-sent once.

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

#### Responses

##### 200 — A page of signers

```json
{
    "data": [
        {
            "resource": "signer",
            "id": "example_id_14",
            "full_name": "Example User",
            "email": "user3@example.com",
            "whatsapp_phone_number": "+5500000000000",
            "government_id": "00000000000",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
- `government_id` (string) — Signer's CPF (11 digits) or CNPJ (14 characters; may be alphanumeric). Formatting is accepted and the value is normalized on save. Required before the signer can use a verification method that identifies them by CPF.

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

##### 200 — The created signer

```json
{
    "data": {
        "resource": "signer",
        "id": "example_id_14",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "government_id": "00000000000",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
        "id": "example_id_14",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "government_id": "00000000000",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Update signer

`PUT /v1/accounts/{accountId}/signers/{signerId}`

Update a signer's information. Only the fields sent change; send just the ones you are changing.

**Clearing a field:** `null` or `"` clears `email`, `whatsapp_phone_number` and `government_id` (`whatsapp_phone_number` is stored as `null` either way; the other two keep the value sent). `full_name` cannot be cleared.

**Verification integrity:** `email` / `whatsapp_phone_number` cannot be changed while the signer has verified that channel on an in-flight (not yet certificated) document — the response is `400` naming the offending document(s). Already-certificated documents do not block updates, except a document of an envelope while another of the signer's documents of it is in flight. Changing a channel that has *unverified* in-flight requests, or unverified requests on a document of an envelope while another of the signer's documents of it is in flight, rotates their access/verification codes (invalidating previously sent links/OTPs); use the resend endpoint to redeliver. `full_name` can always be updated.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `signerId` | path | string | yes | The signer ID. |

#### Request Body (required)

Fields (`application/json`):

- `full_name` (string)
- `email` (string) — Can't be changed or cleared while the signer has verified it on an in-flight document, or on a document of an envelope while another of their documents of it is in flight (`400`).
- `whatsapp_phone_number` (string) — E.164; normalized on save, and compared after normalizing, so the same number in another format is not a change. Can't be changed or cleared while the signer has verified it on an in-flight document, or on a document of an envelope while another of their documents of it is in flight (`400`).
- `government_id` (string) — Signer's CPF (11 digits) or CNPJ (14 characters; may be alphanumeric). Formatting is accepted and the value is normalized on save.

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
        "id": "example_id_14",
        "full_name": "Example User",
        "email": "user3@example.com",
        "whatsapp_phone_number": "+5500000000000",
        "government_id": "00000000000",
        "has_accepted_terms": false
    },
    "status": 200,
    "message": ""
}
```

##### 400 — The request was rejected because of its current state or invalid input.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
            "id": "example_id_9",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
- `color` (string | null) — 6-char hex (with or without leading #).

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
        "id": "example_id_9",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 409 — A tag with the same name already exists.

```json
{
    "status": 409,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
- `color` (string | null)

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
        "id": "example_id_9",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
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
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

#### Responses

##### 200 — A page of templates (default_document_tags omitted in the list)

```json
{
    "data": [
        {
            "resource": "template",
            "id": "example_id_45",
            "name": "template.pdf",
            "document_name": null,
            "message": null,
            "status": "ready",
            "pages": [
                {
                    "id": "example_id_5",
                    "number": 1,
                    "height": 2100,
                    "width": 1275,
                    "download_url": "https://example.com/example-url-18",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

## Webhooks

### Get webhook subscription

`GET /v1/accounts/{accountId}/webhooks/subscriptions`

Retrieve the account's oldest webhook endpoint — which events it is subscribed to and the delivery configuration. Accounts with several endpoints should use **List webhook endpoints**. Requires the `account:read` OAuth scope.

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
        "is_held": false,
        "held_since": null,
        "url": "https://example.com/example-url-20",
        "email": "user12@example.com",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Update webhook subscription

`PUT /v1/accounts/{accountId}/webhooks/subscriptions`

Update the account's oldest webhook endpoint (creating it if the account has none) — which events are monitored, whether delivery is enabled, and the delivery/contact details. Accounts with several endpoints should use **Update webhook endpoint**. Requires the `webhooks:write` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `events` (array, required) — Event type codes to subscribe to (see `GET /v1/webhooks/event-types`).
- `is_active` (boolean, required) — Whether events should be delivered to the webhook.
- `url` (string, required) — The URL that will receive events: `https` for a new or changed URL (a URL stored before keeps working). Its host must resolve to a public address (`400` otherwise), and redirects are not followed.
- `email` (string, required) — Email that receives important webhook-communication notices.

Example:

```json
{
    "events": [
        "document_ready",
        "document_prepared"
    ],
    "is_active": true,
    "url": "https://example.com/example-url-20",
    "email": "user12@example.com"
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
        "is_held": false,
        "held_since": null,
        "url": "https://example.com/example-url-20",
        "email": "user12@example.com",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Inactivate webhook subscription

`PUT /v1/accounts/{accountId}/webhooks/inactivate`

Deactivate the account's oldest webhook endpoint. While inactive, no events are sent to it; other endpoints are unaffected. Requires the `webhooks:write` OAuth scope.

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
        "is_held": false,
        "held_since": null,
        "url": "https://example.com/example-url-20",
        "email": "user12@example.com",
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List webhook event types

`GET /v1/webhooks/event-types`

List all available event types that can be subscribed to via webhooks. Requires the `documents:read` OAuth scope.

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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List webhook deliveries

`GET /v1/accounts/{accountId}/webhooks`

Retrieve the delivery history for webhooks sent to the account's endpoints — use it to monitor status, debug failures, and verify payloads. Pagination is returned in the `X-Pagination-*` response headers. Requires the `documents:read` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `endpoint_id` | query | string | no | Only deliveries to this webhook endpoint. |
| `event` | query | string | no | Filter by event type (e.g. `document_ready`). |
| `delivered` | query | string | no | Filter by delivery status: `true` or `false`. |
| `from` | query | integer | no | Unix timestamp — only entries after this time. |
| `to` | query | integer | no | Unix timestamp — only entries before this time. |
| `page` | query | integer | no | Page number. |
| `per-page` | query | integer | no | Records per page: 20 by default, at most 50; a larger value answers 50 a page. |

#### Responses

##### 200 — Delivery history

```json
{
    "data": [
        {
            "resource": "activity_dispatching_history",
            "id": "example_id_46",
            "event": "document_ready",
            "activity_id": 456,
            "endpoint_id": "example_id_47",
            "endpoint": "https://example.com/example-url-21",
            "payload": null,
            "delivered": true,
            "webhook_id": "example_id_48",
            "attempt": 2,
            "kind": "scheduled",
            "will_retry": true,
            "duration_ms": 184,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Retry webhook delivery

`POST /v1/accounts/{accountId}/webhooks/{historyId}/retry`

Sends the entry's event to the entry's endpoint once, now, even while the endpoint is paused, and returns the dispatch entry of that attempt; a delivery that gets through lifts the pause. Requires the `webhooks:write` OAuth scope.

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
        "id": "example_id_46",
        "event": "document_ready",
        "activity_id": 456,
        "endpoint_id": "example_id_47",
        "endpoint": "https://example.com/example-url-21",
        "payload": null,
        "delivered": true,
        "webhook_id": "example_id_48",
        "attempt": 2,
        "kind": "scheduled",
        "will_retry": true,
        "duration_ms": 184,
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### List webhook endpoints

`GET /v1/accounts/{accountId}/webhooks/endpoints`

List the account's webhook endpoints, oldest first. Requires the `account:read` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `url` | query | string | no | Only the endpoint registered with exactly this URL. |

#### Responses

##### 200 — The endpoints

```json
{
    "data": [
        {
            "resource": "activity_event_subscription",
            "id": "example_id_47",
            "name": "ERP",
            "url": "https://example.com/example-url-22",
            "email": "user13@example.com",
            "events": [
                "document_ready",
                "signer_signed_document"
            ],
            "is_active": true,
            "is_held": false,
            "held_since": null,
            "signing_enabled": true,
            "created_at": "2026-10-01T12:00:00Z",
            "updated_at": "2026-10-01T12:00:00Z"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Create webhook endpoint

`POST /v1/accounts/{accountId}/webhooks/endpoints`

Register a URL to receive the account's webhook events. An account can have 1 endpoint, or up to 3 on paid plans; creating one past the limit returns `403`. Each endpoint of a workspace must have a different `url` (`400` otherwise). When `signing_enabled` is `true`, a signing secret is generated and returned once, as `secret` in this response — store it, since it is never shown in list or view responses. It can be read again later with **Get webhook endpoint signing secret**, except by OAuth applications: an OAuth application that loses the secret gets a new one with **Rotate webhook endpoint signing secret**. Requires the `webhooks:write` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |

#### Request Body (required)

Fields (`application/json`):

- `url` (string, required) — URL that receives the events: `https` for a new or changed URL (a URL stored before keeps working). Its host must resolve to a public address; private, loopback, link-local and other reserved addresses are refused with `400`. Deliveries don't follow redirects: a `3xx` answer counts as a failed delivery.
- `email` (string, required) — Contact email for delivery-failure notices.
- `events` (array, required) — Event types to deliver (see `GET /v1/webhooks/event-types`).
- `name` (string) — Label to tell endpoints apart.
- `is_active` (boolean) — Whether events are delivered. Defaults to `true`.
- `signing_enabled` (boolean) — Sign deliveries with a Standard Webhooks signature. Defaults to `false`.

Example:

```json
{
    "url": "https://example.com/example-url-22",
    "email": "user13@example.com",
    "events": [
        "document_ready",
        "signer_signed_document"
    ],
    "name": "ERP",
    "is_active": true,
    "signing_enabled": true
}
```

#### Responses

##### 200 — The created endpoint

```json
{
    "data": {
        "secret": "example_secret",
        "resource": "activity_event_subscription",
        "id": "example_id_47",
        "name": "ERP",
        "url": "https://example.com/example-url-22",
        "email": "user13@example.com",
        "events": [
            "document_ready",
            "signer_signed_document"
        ],
        "is_active": true,
        "is_held": false,
        "held_since": null,
        "signing_enabled": true,
        "created_at": "2026-10-01T12:00:00Z",
        "updated_at": "2026-10-01T12:00:00Z"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 403 — Authenticated but not allowed to perform this action.

```json
{
    "status": 403,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Delete webhook endpoint by URL

`DELETE /v1/accounts/{accountId}/webhooks/endpoints`

Stop delivering events to the endpoint registered with `url` and free its slot, for integrations that keep the URL they registered rather than the endpoint ID. The URL must match exactly as it was registered. Returns `404` when no endpoint of the workspace uses it. Requires the `webhooks:write` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `url` | query | string | yes | The endpoint's URL. |

#### Responses

##### 200 — Endpoint deleted

```json
{
    "data": [],
    "status": 200,
    "message": ""
}
```

##### 400 — One or more fields failed validation.

```json
{
    "status": 400,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get webhook endpoint

`GET /v1/accounts/{accountId}/webhooks/endpoints/{endpointId}`

Retrieve one webhook endpoint. Requires the `account:read` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `endpointId` | path | string | yes | The webhook endpoint ID. |

#### Responses

##### 200 — The endpoint

```json
{
    "data": {
        "resource": "activity_event_subscription",
        "id": "example_id_47",
        "name": "ERP",
        "url": "https://example.com/example-url-22",
        "email": "user13@example.com",
        "events": [
            "document_ready",
            "signer_signed_document"
        ],
        "is_active": true,
        "is_held": false,
        "held_since": null,
        "signing_enabled": true,
        "created_at": "2026-10-01T12:00:00Z",
        "updated_at": "2026-10-01T12:00:00Z"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Update webhook endpoint

`PUT /v1/accounts/{accountId}/webhooks/endpoints/{endpointId}`

Change a webhook endpoint. Only the fields sent are updated; `url` cannot be one another endpoint of the workspace already uses, nor point to a private or reserved address (`400`). Setting `signing_enabled` to `true` generates a secret if the endpoint has none and keeps the current one otherwise; setting it to `false` discards the secret. When this request turns signing on, the new secret is returned once, as `secret` in this response, as on create; otherwise `secret` is absent. Requires the `webhooks:write` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `endpointId` | path | string | yes | The webhook endpoint ID. |

#### Request Body (required)

Fields (`application/json`):

- `url` (string)
- `email` (string)
- `events` (array)
- `name` (string)
- `is_active` (boolean)
- `signing_enabled` (boolean)

Example:

```json
{
    "url": "https://example.com/example-url-22",
    "email": "user13@example.com",
    "events": [
        "document_ready"
    ],
    "name": "ERP",
    "is_active": false,
    "signing_enabled": true
}
```

#### Responses

##### 200 — The updated endpoint

```json
{
    "data": {
        "secret": "example_secret",
        "resource": "activity_event_subscription",
        "id": "example_id_47",
        "name": "ERP",
        "url": "https://example.com/example-url-22",
        "email": "user13@example.com",
        "events": [
            "document_ready",
            "signer_signed_document"
        ],
        "is_active": true,
        "is_held": false,
        "held_since": null,
        "signing_enabled": true,
        "created_at": "2026-10-01T12:00:00Z",
        "updated_at": "2026-10-01T12:00:00Z"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Delete webhook endpoint

`DELETE /v1/accounts/{accountId}/webhooks/endpoints/{endpointId}`

Stop delivering events to an endpoint and free its slot. Requires the `webhooks:write` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `endpointId` | path | string | yes | The webhook endpoint ID. |

#### Responses

##### 200 — Endpoint deleted

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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Get webhook endpoint signing secret

`GET /v1/accounts/{accountId}/webhooks/endpoints/{endpointId}/secret`

Return the secret used to sign deliveries to this endpoint (see **Webhook Payloads → Verifying signatures**). Returns `400` when signing is disabled. Not available to OAuth applications: they receive a secret only when one is generated, in the **Create webhook endpoint** or **Update webhook endpoint** response (when that request turns signing on) or from **Rotate webhook endpoint signing secret**.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `endpointId` | path | string | yes | The webhook endpoint ID. |

#### Responses

##### 200 — The secret

```json
{
    "data": {
        "secret": "example_secret"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Rotate webhook endpoint signing secret

`POST /v1/accounts/{accountId}/webhooks/endpoints/{endpointId}/secret/rotate`

Replace the endpoint's signing secret and return the new one. The old secret stops working immediately, so update your receiver right away; or send `keep_previous: true` to keep it signing deliveries beside the new one for 24 hours (`previous_secret_expires_at`): during that time `webhook-signature` carries both signatures, so your receiver can switch to the new secret without failing verification. Only the secret just replaced is kept: rotating again within those 24 hours stops the one kept before. Two rotations sent at once take effect one after the other, each answering the secret it set. Returns `400` when signing is disabled or `keep_previous` is not a boolean. Requires the `webhooks:write` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `endpointId` | path | string | yes | The webhook endpoint ID. |

#### Request Body

Fields (`application/json`):

- `keep_previous` (boolean) — `true`: the replaced secret keeps signing for 24 hours. Default `false`: it stops at once.

Example:

```json
{
    "keep_previous": false
}
```

#### Responses

##### 200 — The new secret

```json
{
    "data": {
        "previous_secret_expires_at": "2026-10-30T15:00:00Z",
        "secret": "example_secret"
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
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

### Send a test delivery

`POST /v1/accounts/{accountId}/webhooks/endpoints/{endpointId}/test`

Sends the endpoint one `webhook_test` event now, signed and sent like any delivery, and returns the entry of that attempt (`kind: manual`, also listed in the delivery history). It goes to this endpoint only, whatever events it subscribes to, and also while the endpoint is paused or inactive; it neither lifts a pause nor counts toward one. The endpoint has 10 seconds to answer. Its `payload` and `origin` are `null`; the endpoint object carries its id, name, url, events and status, never its secret. No endpoint can subscribe to `webhook_test`, and it is not listed in `GET /webhooks/event-types`. Its `payload` and `origin` are `null`; the endpoint object carries its id, name, url, events and status, never its secret. No endpoint can subscribe to `webhook_test`, and it is not listed in `GET /webhooks/event-types`. The event names the endpoint as its `subject` and `object` and carries nothing about the workspace beyond `account_id`: no billing and no members. Up to 10 tests per user every 10 minutes. Requires the `webhooks:write` OAuth scope.

**Authentication:** Bearer access token (`Authorization: Bearer ...`) or API key (`X-Api-Key` header).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountId` | path | string | yes | Workspace account ID. |
| `endpointId` | path | string | yes | The webhook endpoint ID. |

#### Responses

##### 200 — The entry of the test delivery

```json
{
    "data": {
        "resource": "activity_dispatching_history",
        "id": "example_id_46",
        "event": "document_ready",
        "activity_id": 456,
        "endpoint_id": "example_id_47",
        "endpoint": "https://example.com/example-url-21",
        "payload": null,
        "delivered": true,
        "webhook_id": "example_id_48",
        "attempt": 2,
        "kind": "scheduled",
        "will_retry": true,
        "duration_ms": 184,
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

##### 404 — The requested resource does not exist.

```json
{
    "status": 404,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 429 — Rate limit exceeded.

##### 401 — Missing or invalid credentials.

```json
{
    "status": 401,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```

##### 500 — Unexpected server error.

```json
{
    "status": 500,
    "message": "Bad request.",
    "data": null,
    "code": "PlanRestricted",
    "errors": [
        {
            "field": "full_name",
            "code": "Required",
            "message": "Full Name cannot be blank."
        }
    ]
}
```
