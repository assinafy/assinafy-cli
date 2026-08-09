# Assinafy API — request / response reference

> Auto-generated for the `@assinafy/cli` audit. Response bodies are **real payloads captured live** from the Assinafy **sandbox** (`https://sandbox.assinafy.com.br/v1`), most recently re-verified against the published [OpenAPI spec](https://api.assinafy.com.br/v1/docs/openapi.json) on 2026-08-08 (originally captured 2026-07-20), lightly trimmed. That re-verification pass corrected several endpoints previously mislabeled `_production-only_`/`_not exercised live_` — `workspaces.list/get/create/update/delete`, `documents.search`, and `documents.verify` all work against the sandbox with a plain API key. Endpoints that still require an interactive login (JWT), an existing user account, or a signer OTP access-code from a real emailed link were not exercised live and are documented from the API spec (marked _spec-only_ / _Not exercised live_).

## Conventions

- **Base URL** — production `https://api.assinafy.com.br/v1`, sandbox `https://sandbox.assinafy.com.br/v1`. A sandbox key only works against the sandbox host. Override with `--base-url` / `ASSINAFY_BASE_URL`.
- **Auth** — send `X-Api-Key: <key>` (preferred) or `Authorization: Bearer <jwt>` (legacy). Signer-side endpoints authenticate with a `signer-access-code` query parameter instead.
- **Envelope** — every JSON response is wrapped as `{ "status": <http>, "message": "", "data": <payload> }`. List endpoints put the array in `data` and pagination in response headers.
- **Pagination headers** (CORS-exposed) — `X-Pagination-Current-Page`, `X-Pagination-Page-Count` (last page), `X-Pagination-Per-Page`, `X-Pagination-Total-Count`. Rate limit: `X-Rate-Limit-*` (120/min).
- **Errors** — non-2xx responses use the same envelope with a Portuguese `message`; the CLI prints `error: <message> (HTTP <code>)` and exits non-zero.
- **DELETE** returns `200` with `data: []` (not `204`).


## Documents

### `GET /v1/accounts/{accountId}/documents`
SDK `documents.list` · CLI `assinafy documents list`

**Query params**
```json
{
  "per-page": 3
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "103b095958259ae33cd4c7164df9",
      "account_id": "102d25a489f34a275d31a16045fd",
      "template_id": null,
      "name": "audit-rename.pdf",
      "status": "metadata_ready",
      "artifacts": {
        "original": "https://sandbox.assinafy.com.br/v1/documents/103b095958259ae33cd4c7164df9/download/original",
        "thumbnail": "https://sandbox.assinafy.com.br/v1/documents/103b095958259ae33cd4c7164df9/thumbnail"
      },
      "is_closed": false,
      "signing_url": "https://app-sandbox.assinafy.com.br/sign/103b095958259ae33cd4c7164df9",
      "decline_reason": null,
      "declined_by": null,
      "tags": [],
      "created_at": "2026-07-20T19:09:56Z",
      "updated_at": "2026-07-20T20:05:57Z",
      "assignment": null,
      "pages": [
        {
          "id": "103b09598a31cbd6af3c2faf8d4a",
          "number": 1,
          "height": 1651,
          "width": 1275,
          "download_url": "https://sandbox.assinafy.com.br/v1/documents/103b095958259ae33cd4c7164df9/pages/103b09598a31cbd6af3c2faf8d4a/download"
        }
      ]
    },
    {
      "id": "19f80dc86e3cce2d39d7edc9e28",
      "account_id": "102d25a489f34a275d31a16045fd",
      "template_id": null,
      "name": "rename-me.pdf",
      "status": "metadata_ready",
      "artifacts": {
        "original": "https://sandbox.assinafy.com.br/v1/documents/19f80dc86e3cce2d39d7edc9e28/download/original",
        "thumbnail": "https://sandbox.assinafy.com.br/v1/documents/19f80dc86e3cce2d39d7edc9e28/thumbnail"
      },
      "is_closed": false,
      "signing_url": "https://app-sandbox.assinafy.com.br/sign/19f80dc86e3cce2d39d7edc9e28",
      "decline_reason": null,
      "declined_by": null,
      "tags": [],
      "created_at": "2026-07-20T18:49:23Z",
      "updated_at": "2026-07-20T19:04:05Z",
      "assignment": null,
      "pages": [
        {
          "id": "103b089d7a414c8491c3a59a06bc",
          "number": 1,
          "height": 1651,
          "width": 1275,
          "download_url": "https://sandbox.assinafy.com.br/v1/documents/19f80dc86e3cce2d39d7edc9e28/pages/103b089d7a414c8491c3a59a06bc/download"
        }
      ]
    },
    {
      "id": "103b08fc5b88cfaea7415cd43220",
      "account_id": "102d25a489f34a275d31a16045fd",
      "template_id": null,
      "name": "sdk-audit-signing-flow.pdf",
      "status": "pending_signature",
      "artifacts": {
        "original": "https://sandbox.assinafy.com.br/v1/documents/103b08fc5b88cfaea7415cd43220/download/original",
        "thumbnail": "https://sandbox.assinafy.com.br/v1/documents/103b08fc5b88cfaea7415cd43220/thumbnail"
      },
      "is_closed": false,
      "signing_url": "https://app-sandbox.assinafy.com.br/sign/103b08fc5b88cfaea7415cd43220",
      "decline_reason": null,
      "declined_by": null,
      "tags": [],
      "created_at": "2026-07-20T18:59:47Z",
      "updated_at": "2026-07-20T18:59:50Z",
      "assignment": {
        "id": "103b08fcd80621f8a804cffdd164",
        "sender_email": "bill@febacapital.com",
        "method": "virtual",
        "expires_at": null,
        "message": "SDK audit signing-flow test — safe to sign",
        "signers": [
          {
            "id": "19e6b92e7895332ed9708535d8c",
            "full_name": "Audit Bill A2",
            "email": "bill@febacapital.com",
            "whatsapp_phone_number": null,
            "has_accepted_terms": false,
            "completed": false,
            "notification_history": [],
            "verification_method": "Email",
            "notification_methods": [
              "Email"
            ],
            "step": 1,
            "notified": true
          }
        ],
        "copy_receivers": [],
        "items": [
          {
            "id": "19f80e615a03f3f729aaaba7991",
            "page": null,
            "signer": {
              "id": "19e6b92e7895332ed9708535d8c",
              "full_name": "Audit Bill A2",
              "email": "bill@febacapital.com",
              "whatsapp_phone_number": null,
              "has_accepted_terms": false
            },
            "field": {
              "id": "102d25a48bc7357b93f9b8e01b24",
              "name": "Virtual",
              "type": "virtual",
              "regex": null,
              "is_pre_defined": true,
              "is_active": true,
              "is_required": false,
              "is_standard": false,
              "is_read_only": false,
              "is_visible": true
            },
            "display_settings": [],
            "value": null,
            "completed": false
          }
        ],
        "summary": {
          "signer_count": 1,
          "completed_count": 0,
          "signers": [
            {
              "id": "19e6b92e7895332ed9708535d8c",
              "full_name": "Audit Bill A2",
              "email": "bill@febacapital.com",
              "whatsapp_phone_number": null,
              "has_accepted_terms": false,
              "completed": false
            }
          ]
        },
        "signing_urls": [
          {
            "signer_id": "19e6b92e7895332ed9708535d8c",
            "url": "https://app-sandbox.assinafy.com.br/sign/103b08fc5b88cfaea7415cd43220?email=bill%40febacapital.com"
          }
        ]
      },
      "pages": [
        {
          "id": "103b08fc914aa41826dbca394b0d",
          "number": 1,
          "height": 1651,
          "width": 1275,
          "download_url": "https://sandbox.assinafy.com.br/v1/documents/103b08fc5b88cfaea7415cd43220/pages/103b08fc914aa41826dbca394b0d/download"
        }
      ]
    }
  ]
}
```

### `POST /v1/accounts/{accountId}/documents`
SDK `documents.upload` · CLI `assinafy documents upload`

**Request body** — `multipart/form-data` with `file` (PDF) + `name`.

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "document",
    "id": "103b0beff2fabee48849e2a07aba",
    "account_id": "102d25a489f34a275d31a16045fd",
    "template_id": null,
    "name": "audit-audit0720.pdf",
    "status": "uploaded",
    "artifacts": {
      "original": "https://sandbox.assinafy.com.br/v1/documents/103b0beff2fabee48849e2a07aba/download/original"
    },
    "is_closed": false,
    "signing_url": "https://app-sandbox.assinafy.com.br/sign/103b0beff2fabee48849e2a07aba",
    "decline_reason": null,
    "declined_by": null,
    "tags": [],
    "created_at": "2026-07-20T20:22:18Z",
    "updated_at": "2026-07-20T20:22:19Z",
    "pages": []
  }
}
```

### `GET /v1/accounts/{accountId}/documents/{documentId}/tags`
SDK `documents.listTags` · CLI `assinafy documents tags`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "103b0befba1a60a208722043f168",
      "name": "audit-audit0720",
      "color": "ff3366",
      "created_at": "2026-07-20T20:22:17Z",
      "updated_at": "2026-07-20T20:22:17Z"
    }
  ]
}
```

### `POST /v1/accounts/{accountId}/documents/{documentId}/tags`
SDK `documents.addTags` · CLI `assinafy documents tags-add`

**Request body**
```json
{
  "tags": [
    "audit-audit0720"
  ]
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "103b0befba1a60a208722043f168",
      "name": "audit-audit0720",
      "color": "ff3366",
      "created_at": "2026-07-20T20:22:17Z",
      "updated_at": "2026-07-20T20:22:17Z"
    }
  ]
}
```

### `PUT /v1/accounts/{accountId}/documents/{documentId}/tags`
SDK `documents.replaceTags` · CLI `assinafy documents tags-set`

**Request body**
```json
{
  "tags": [
    "audit-audit0720"
  ]
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "103b0befba1a60a208722043f168",
      "name": "audit-audit0720",
      "color": "ff3366",
      "created_at": "2026-07-20T20:22:17Z",
      "updated_at": "2026-07-20T20:22:17Z"
    }
  ]
}
```

### `DELETE /v1/accounts/{accountId}/documents/{documentId}/tags/{tagId}`
SDK `documents.detachTag` · CLI `assinafy documents tags-remove`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/accounts/{accountId}/documents/search`
SDK `documents.search` · CLI `assinafy documents search`

**Query params**
```json
{
  "per-page": 3
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "103e4af8c99c19de9cabda1d22c4",
      "account_id": "102d25a489f34a275d31a16045fd",
      "template_id": null,
      "name": "asn-sdk-khqs4ilsgu7n4lIRa8I.pdf",
      "status": "metadata_ready",
      "artifacts": {
        "original": "https://sandbox.assinafy.com.br/v1/documents/103e4af8c99c19de9cabda1d22c4/download/original",
        "thumbnail": "https://sandbox.assinafy.com.br/v1/documents/103e4af8c99c19de9cabda1d22c4/thumbnail"
      },
      "is_closed": false,
      "signing_url": "https://app-sandbox.assinafy.com.br/sign/103e4af8c99c19de9cabda1d22c4",
      "decline_reason": null,
      "declined_by": null,
      "tags": [],
      "created_at": "2026-08-05T23:39:43Z",
      "updated_at": "2026-08-05T23:39:45Z"
    }
  ]
}
```

Pagination metadata is returned in headers as usual. `sort` is accepted and
functional here (live-verified: `sort=name` changes the returned order/set)
even though the published OpenAPI spec only documents `search`, `status`,
`page`, `per-page` for this endpoint — the CLI's `--sort` flag is intentional,
not a bug.

### `POST /v1/accounts/{accountId}/templates/{templateId}/documents`
SDK `documents.createFromTemplate` · CLI `assinafy documents create-from-template`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "document",
    "id": "103b0c051d758b83b92366ec437c",
    "account_id": "102d25a489f34a275d31a16045fd",
    "template_id": "103b0716216a0a1d57f5a6ac63a4",
    "name": "Audit From Template",
    "status": "uploaded",
    "artifacts": {
      "original": "https://sandbox.assinafy.com.br/v1/documents/103b0c051d758b83b92366ec437c/download/original"
    },
    "is_closed": false,
    "signing_url": "https://app-sandbox.assinafy.com.br/sign/103b0c051d758b83b92366ec437c",
    "decline_reason": null,
    "declined_by": null,
    "tags": [],
    "created_at": "2026-07-20T20:24:37Z",
    "updated_at": "2026-07-20T20:24:38Z",
    "assignment": null,
    "pages": []
  }
}
```

### `POST /v1/accounts/{accountId}/templates/{templateId}/documents/estimate-cost`
SDK `documents.estimateCostFromTemplate` · CLI `assinafy documents estimate-template-cost`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "documents": 1,
    "credits": 0,
    "needs_extra_document": false,
    "extra_document_cost": 0,
    "total_credits": 0,
    "breakdown": [],
    "document_balance": 66,
    "credit_balance": 0,
    "has_sufficient_resources": true,
    "blocking_reason": null,
    "message": null
  }
}
```

### `DELETE /v1/documents/{documentId}`
SDK `documents.delete` · CLI `assinafy documents delete`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": []
}
```

### `GET /v1/documents/{documentId}`
SDK `documents.details` · CLI `assinafy documents get`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "document",
    "id": "103ee2156b2e79aeb01e4d7b50d5",
    "account_id": "102d25a489f34a275d31a16045fd",
    "template_id": null,
    "name": "audit-live-1786226707046.pdf",
    "status": "metadata_processing",
    "artifacts": {
      "original": "https://sandbox.assinafy.com.br/v1/documents/103ee2156b2e79aeb01e4d7b50d5/download/original"
    },
    "is_closed": false,
    "signing_url": "https://app-sandbox.assinafy.com.br/sign/103ee2156b2e79aeb01e4d7b50d5",
    "decline_reason": null,
    "declined_by": null,
    "tags": [],
    "created_at": "2026-08-08T22:05:07Z",
    "updated_at": "2026-08-08T22:05:07Z",
    "assignment": null,
    "pages": []
  }
}
```

### `PATCH /v1/documents/{documentId}`
SDK `documents.rename` · CLI `assinafy documents rename`

Only allowed once the document has finished processing (`metadata_ready` or
later) **and** before any assignment is active — the API returns the same
400 message for both "not ready yet" and "already has an assignment".

**Request body**
```json
{ "name": "audit-renamed-ready-1786226819392.pdf" }
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "document",
    "id": "103ee2260ce5d7264e6aeb8c8302",
    "account_id": "102d25a489f34a275d31a16045fd",
    "template_id": null,
    "name": "audit-renamed-ready-1786226819392.pdf",
    "status": "metadata_ready",
    "artifacts": {
      "original": "https://sandbox.assinafy.com.br/v1/documents/103ee2260ce5d7264e6aeb8c8302/download/original",
      "thumbnail": "https://sandbox.assinafy.com.br/v1/documents/103ee2260ce5d7264e6aeb8c8302/thumbnail"
    },
    "is_closed": false,
    "signing_url": "https://app-sandbox.assinafy.com.br/sign/103ee2260ce5d7264e6aeb8c8302",
    "decline_reason": null,
    "declined_by": null,
    "tags": [],
    "created_at": "2026-08-08T22:06:56Z",
    "updated_at": "2026-08-08T22:06:59Z"
  }
}
```

**Response 400** — once an assignment is active (or before the document reaches `metadata_ready`)
```json
{
  "status": 400,
  "data": null,
  "message": "Document cannot be renamed after the signature process has started."
}
```

### `GET /v1/documents/{documentId}/activities`
SDK `documents.activities` · CLI `assinafy documents activities`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": 15728,
      "event": "document_metadata_ready",
      "message": "Documento processado.",
      "payload": [],
      "origin": null,
      "created_at": "2026-07-20T20:22:21Z"
    },
    {
      "id": 15727,
      "event": "document_uploaded",
      "message": "Documento criado.",
      "payload": [],
      "origin": {
        "ip": "99.75.13.162",
        "user-agent": "assinafy-cli"
      },
      "created_at": "2026-07-20T20:22:19Z"
    }
  ]
}
```

### `GET /v1/documents/{documentId}/download/{artifactName}`
SDK `documents.download` · CLI `assinafy documents download`

**Response 200** — binary 599 bytes

### `GET /v1/documents/{documentId}/pages/{pageId}/download`
SDK `documents.downloadPage` · CLI `assinafy documents download-page`

**Response 200** — binary 41809 bytes

### `GET /v1/documents/{documentId}/thumbnail`
SDK `documents.thumbnail` · CLI `assinafy documents thumbnail`

**Response 200** — binary 4950 bytes

### `GET /v1/documents/{documentSignatureHash}/verify`
SDK `documents.verify` · CLI `assinafy documents verify`

Public, unauthenticated endpoint. Always returns `200`, even for an unknown
hash — `is_valid` is `false` and every other field but `hash`/`verified_at`
is `null`.

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "hash": "FE32EDDADE7CBDDCBB934E7402047450B0E59C02",
    "id": null,
    "status": null,
    "page_count": null,
    "signer_count": null,
    "completed_count": null,
    "completed_at": null,
    "verified_at": "2026-08-08T22:22:53Z",
    "is_valid": false,
    "message": "Documento não assinado ou não encontrado."
  }
}
```

### `GET /v1/documents/statuses`
SDK `documents.statuses` · CLI `assinafy documents statuses`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "code": "uploading",
      "deletable": false
    },
    {
      "code": "uploaded",
      "deletable": false
    },
    {
      "code": "metadata_processing",
      "deletable": false
    },
    {
      "code": "metadata_ready",
      "deletable": true
    },
    {
      "code": "expired",
      "deletable": true
    },
    {
      "code": "certificating",
      "deletable": false
    },
    {
      "code": "certificated",
      "deletable": false
    },
    {
      "code": "rejected_by_signer",
      "deletable": true
    },
    {
      "code": "pending_signature",
      "deletable": true
    },
    {
      "code": "rejected_by_user",
      "deletable": true
    },
    {
      "code": "failed",
      "deletable": true
    }
  ]
}
```

## Signers

### `GET /v1/accounts/{accountId}/signers`
SDK `signers.list` · CLI `assinafy signers list`

**Query params**
```json
{
  "search": "bill@febacapital.com",
  "per-page": 100
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "19e6b92e7895332ed9708535d8c",
      "full_name": "Audit Bill A2",
      "email": "bill@febacapital.com",
      "whatsapp_phone_number": null,
      "has_accepted_terms": false
    }
  ]
}
```

### `POST /v1/accounts/{accountId}/signers`
SDK `signers.create` · CLI `assinafy signers create`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `DELETE /v1/accounts/{accountId}/signers/{signerId}`
SDK `signers.delete` · CLI `assinafy signers delete`

**Response 400**
```json
{
  "status": 400,
  "data": null,
  "message": "Signatário associado a document ativo (sdk-audit-signing-flow.pdf)."
}
```

### `GET /v1/accounts/{accountId}/signers/{signerId}`
SDK `signers.get` · CLI `assinafy signers get`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "signer",
    "id": "19e6b92e7895332ed9708535d8c",
    "full_name": "Audit Bill A2",
    "email": "bill@febacapital.com",
    "whatsapp_phone_number": null,
    "has_accepted_terms": false
  }
}
```

### `PUT /v1/accounts/{accountId}/signers/{signerId}`
SDK `signers.update` · CLI `assinafy signers update`

**Request body**
```json
{
  "full_name": "Audit Bill A2"
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "signer",
    "id": "19e6b92e7895332ed9708535d8c",
    "full_name": "Audit Bill A2",
    "email": "bill@febacapital.com",
    "whatsapp_phone_number": null,
    "has_accepted_terms": false
  }
}
```

## Assignments

### `GET /v1/assignments`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `POST /v1/documents/{documentId}/assignments`
SDK `assignments.create` · CLI `assinafy assignments create`

**Request body**
```json
{
  "method": "virtual",
  "signers": [
    {
      "id": "19e6b92e7895332ed9708535d8c",
      "verification_method": "Email",
      "notification_methods": [
        "Email"
      ]
    }
  ]
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "assignment",
    "id": "103b0bf0f0884d7e0d7265f4402f",
    "sender_email": "bill@febacapital.com",
    "method": "virtual",
    "expires_at": null,
    "message": null,
    "signers": [
      {
        "id": "19e6b92e7895332ed9708535d8c",
        "full_name": "Audit Bill A2",
        "email": "bill@febacapital.com",
        "whatsapp_phone_number": null,
        "has_accepted_terms": false,
        "completed": false,
        "notification_history": [],
        "verification_method": "Email",
        "notification_methods": [
          "Email"
        ],
        "step": 1,
        "notified": true
      }
    ],
    "copy_receivers": [],
    "items": [
      {
        "id": "19f8131b1ae81bdabcd552a598a",
        "page": null,
        "signer": {
          "id": "19e6b92e7895332ed9708535d8c",
          "full_name": "Audit Bill A2",
          "email": "bill@febacapital.com",
          "whatsapp_phone_number": null,
          "has_accepted_terms": false
        },
        "field": {
          "id": "102d25a48bc7357b93f9b8e01b24",
          "name": "Virtual",
          "type": "virtual",
          "regex": null,
          "is_pre_defined": true,
          "is_active": true,
          "is_required": false,
          "is_standard": false,
          "is_read_only": false,
          "is_visible": true
        },
        "display_settings": [],
        "value": null,
        "completed": false
      }
    ],
    "summary": {
      "signer_count": 1,
      "completed_count": 0,
      "signers": [
        {
          "id": "19e6b92e7895332ed9708535d8c",
          "full_name": "Audit Bill A2",
          "email": "bill@febacapital.com",
          "whatsapp_phone_number": null,
          "has_accepted_terms": false,
          "completed": false
        }
      ]
    },
    "signing_urls": [
      {
        "signer_id": "19e6b92e7895332ed9708535d8c",
        "url": "https://app-sandbox.assinafy.com.br/sign/103b0beff2fabee48849e2a07aba?email=bill%40febacapital.com"
      }
    ]
  }
}
```

### `PUT /v1/documents/{documentId}/assignments/{assignmentId}/reset-expiration`
SDK `assignments.resetExpiration` · CLI `assinafy assignments reset-expiration`

**Request body**
```json
{
  "expires_at": "2027-01-01T00:00:00Z"
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "assignment",
    "id": "103b0bf0f0884d7e0d7265f4402f",
    "sender_email": "bill@febacapital.com",
    "method": "virtual",
    "expires_at": "2027-01-01T00:00:00Z",
    "message": null,
    "signers": [
      {
        "id": "19e6b92e7895332ed9708535d8c",
        "full_name": "Audit Bill A2",
        "email": "bill@febacapital.com",
        "whatsapp_phone_number": null,
        "has_accepted_terms": false,
        "completed": false,
        "notification_history": [],
        "verification_method": "Email",
        "notification_methods": [
          "Email"
        ],
        "step": 1,
        "notified": true
      }
    ],
    "copy_receivers": [],
    "items": [
      {
        "id": "19f8131b1ae81bdabcd552a598a",
        "page": null,
        "signer": {
          "id": "19e6b92e7895332ed9708535d8c",
          "full_name": "Audit Bill A2",
          "email": "bill@febacapital.com",
          "whatsapp_phone_number": null,
          "has_accepted_terms": false
        },
        "field": {
          "id": "102d25a48bc7357b93f9b8e01b24",
          "name": "Virtual",
          "type": "virtual",
          "regex": null,
          "is_pre_defined": true,
          "is_active": true,
          "is_required": false,
          "is_standard": false,
          "is_read_only": false,
          "is_visible": true
        },
        "display_settings": [],
        "value": null,
        "completed": false
      }
    ],
    "summary": {
      "signer_count": 1,
      "completed_count": 0,
      "signers": [
        {
          "id": "19e6b92e7895332ed9708535d8c",
          "full_name": "Audit Bill A2",
          "email": "bill@febacapital.com",
          "whatsapp_phone_number": null,
          "has_accepted_terms": false,
          "completed": false
        }
      ]
    },
    "signing_urls": [
      {
        "signer_id": "19e6b92e7895332ed9708535d8c",
        "url": "https://app-sandbox.assinafy.com.br/sign/103b0beff2fabee48849e2a07aba?email=bill%40febacapital.com"
      }
    ]
  }
}
```

### `POST /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/estimate-resend-cost`
SDK `assignments.estimateResendCost` · CLI `assinafy assignments estimate-resend-cost`

Re-verified live on 2026-08-08: still returns the smaller shape below, not the
larger `estimate-cost`-style schema (`documents`, `needs_extra_document`,
`total_credits`, …) that the published OpenAPI spec's schema for this specific
operation documents — that schema appears to be copy-pasted from the sibling
`estimate-cost` endpoint. The SDK's `IResendCostEstimate` type follows the
live-verified shape.

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "total": 0,
    "breakdown": [
      {
        "code": "NotificationEmailResend",
        "name": "Email Notification Resend",
        "cost": 0
      }
    ],
    "credit_balance": 0,
    "has_sufficient_credits": true
  }
}
```

### `PUT /v1/documents/{documentId}/assignments/{assignmentId}/signers/{signerId}/resend`
SDK `assignments.resendNotification` · CLI `assinafy assignments resend`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "is_sent": true,
    "document_id": "103b0beff2fabee48849e2a07aba",
    "signer_id": "19e6b92e7895332ed9708535d8c"
  }
}
```

### `GET /v1/documents/{documentId}/assignments/{assignmentId}/whatsapp-notifications`
SDK `assignments.listWhatsAppNotifications` · CLI `assinafy assignments whatsapp-notifications`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": []
}
```

### `POST /v1/documents/{documentId}/assignments/estimate-cost`
SDK `assignments.estimateCost` · CLI `assinafy assignments estimate-cost`

Live-verified for `method: "collect"` with real `entries` (field placements) —
CLI: `assinafy assignments estimate-cost <documentId> --method collect --entries <json>`.

**Request body**
```json
{
  "method": "collect",
  "signers": [
    { "id": "19e6b92e7895332ed9708535d8c" }
  ],
  "entries": [
    {
      "page_id": "103ee3806b47c84cbb6514254d52",
      "fields": [
        { "signer_id": "19e6b92e7895332ed9708535d8c", "field_id": "102d25a48bcf142065f2b06cf821" }
      ]
    }
  ]
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "documents": 1,
    "credits": 0,
    "needs_extra_document": false,
    "extra_document_cost": 0,
    "total_credits": 0,
    "breakdown": [],
    "document_balance": 44,
    "credit_balance": 0,
    "has_sufficient_resources": true,
    "blocking_reason": null,
    "message": null
  }
}
```

## Templates

### `GET /v1/accounts/{accountId}/templates`
SDK `templates.list` · CLI `assinafy templates list`

**Query params**
```json
{
  "per-page": 3
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "103b0716216a0a1d57f5a6ac63a4",
      "name": "sdk-live-4763.pdf",
      "document_name": "sdk-live-4763.pdf",
      "message": null,
      "status": "Ready",
      "pages": [
        {
          "id": "103b07167080eeee6abb709dfa0e",
          "number": 1,
          "height": 1651,
          "width": 1275,
          "download_url": "https://sandbox.assinafy.com.br/v1/accounts/102d25a489f34a275d31a16045fd/templates/103b0716216a0a1d57f5a6ac63a4/pages/103b07167080eeee6abb709dfa0e/download",
          "fields": []
        }
      ],
      "roles": [
        {
          "id": "103b0716357cccee66f6047f3577",
          "name": "TemplateEditor",
          "assignment_type": "Editor",
          "created_at": "2026-07-20T18:06:41Z",
          "updated_at": "2026-07-20T18:06:41Z"
        }
      ],
      "tags": [],
      "created_at": "2026-07-20T18:06:40Z",
      "updated_at": "2026-07-20T18:06:43Z"
    },
    {
      "id": "103b049520c0ee1a3ce53b1a61af",
      "name": "rust-tpl-5039ca9d.pdf",
      "document_name": "rust-tpl-5039ca9d.pdf",
      "message": null,
      "status": "Ready",
      "pages": [
        {
          "id": "103b04957252a242575e64f0a6f8",
          "number": 1,
          "height": 1651,
          "width": 1275,
          "download_url": "https://sandbox.assinafy.com.br/v1/accounts/102d25a489f34a275d31a16045fd/templates/103b049520c0ee1a3ce53b1a61af/pages/103b04957252a242575e64f0a6f8/download",
          "fields": []
        }
      ],
      "roles": [
        {
          "id": "103b04953b5ff446a508cfad2d43",
          "name": "TemplateEditor",
          "assignment_type": "Editor",
          "created_at": "2026-07-20T16:56:40Z",
          "updated_at": "2026-07-20T16:56:40Z"
        }
      ],
      "tags": [],
      "created_at": "2026-07-20T16:56:39Z",
      "updated_at": "2026-07-20T16:56:43Z"
    }
  ]
}
```

## Tags

### `GET /v1/accounts/{accountId}/tags`
SDK `tags.list` · CLI `assinafy tags list`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "103aa221874346e6b3de41688526",
      "name": "103aa22178d23e45c0b2834ec21f",
      "color": null,
      "created_at": "2026-07-18T19:03:45Z",
      "updated_at": "2026-07-18T19:03:45Z"
    },
    {
      "id": "103aa252123d3bf1843a317ee0e6",
      "name": "103aa251f5e1d1a93beb82985b0d",
      "color": null,
      "created_at": "2026-07-18T19:09:03Z",
      "updated_at": "2026-07-18T19:09:03Z"
    },
    {
      "id": "103b0befba1a60a208722043f168",
      "name": "audit-audit0720",
      "color": "3366ff",
      "created_at": "2026-07-20T20:22:17Z",
      "updated_at": "2026-07-20T20:22:17Z"
    },
    {
      "id": "1031f6544019bafc410c6c5317f4",
      "name": "audit-doc-tag",
      "color": null,
      "created_at": "2026-06-05T16:33:35Z",
      "updated_at": "2026-06-05T16:33:35Z"
    },
    {
      "id": "103b091793180ce6263a2ff837f1",
      "name": "audit-flow-tag",
      "color": null,
      "created_at": "2026-07-20T19:02:45Z",
      "updated_at": "2026-07-20T19:02:45Z"
    },
    {
      "id": "103b09179c5d3bd512c0d44ecc90",
      "name": "audit-flow-tag2",
      "color": null,
      "created_at": "2026-07-20T19:02:45Z",
      "updated_at": "2026-07-20T19:02:45Z"
    },
    {
      "id": "1031ff85779c8ff727799331a11f",
      "name": "audit-tag-1780692632720-doc2",
      "color": null,
      "created_at": "2026-06-05T20:50:37Z",
      "updated_at": "2026-06-05T20:50:37Z"
    },
    {
      "id": "19e6f495aaf89c08cb9a751a74e",
      "name": "cs-test-1779983538112-extra",
      "color": null,
      "created_at": "2026-05-28T15:52:18Z",
      "updated_at": "2026-05-28T15:52:18Z"
    },
    {
      "id": "103058e7c602462cce9cfc952516",
      "name": "cs-test-1779983605172-extra",
      "color": null,
      "created_at": "2026-05-28T15:53:25Z",
      "updated_at": "2026-05-28T15:53:25Z"
    },
    {
      "id": "103058ed00f4c3965d0fd479bcd7",
      "name": "cs-test-1779983639506-extra",
      "color": null,
      "created_at": "2026-05-28T15:54:00Z",
      "updated_at": "2026-05-28T15:54:00Z"
    },
    {
      "id": "1030596cd53e178f1a120fffcad4",
      "name": "cs-test-1779984476736-extra",
      "color": null,
      "created_at": "2026-05-28T16:07:57Z",
      "updated_at": "2026-05-28T16:07:57Z"
    },
    {
      "id": "10305a7f5ab23e4d6655b68e99e4",
      "name": "cs-test-1779986276436-extra",
      "color": null,
      "created_at": "2026-05-28T16:37:57Z",
      "updated_at": "2026-05-28T16:37:57Z"
    },
    {
      "id": "19e6f75546169dfd436a00e55f4",
      "name": "cs-test-1779986420280-extra",
      "color": null,
      "created_at": "2026-05-28T16:40:20Z",
      "updated_at": "2026-05-28T16:40:20Z"
    },
    {
      "id": "1031f730a2996dbc49175f559d80",
      "name": "cs-test-1780678659730-extra",
      "color": null,
      "created_at": "2026-06-05T16:57:40Z",
      "updated_at": "2026-06-05T16:57:40Z"
    },
    {
      "id": "1031f7c4217fa43b370751f0be0c",
      "name": "cs-test-1780679626365-extra",
      "color": null,
      "created_at": "2026-06-05T17:13:46Z",
      "updated_at": "2026-06-05T17:13:46Z"
    },
    {
      "id": "1031f7eb7a7aef884e76f99ca965",
      "name": "cs-test-1780679884174-extra",
      "color": null,
      "created_at": "2026-06-05T17:18:04Z",
      "updated_at": "2026-06-05T17:18:04Z"
    },
    {
      "id": "103a6dc93c941e526bcef2354842",
      "name": "cs-test-1784313604547-extra",
      "color": null,
      "created_at": "2026-07-17T18:40:05Z",
      "updated_at": "2026-07-17T18:40:05Z"
    },
    {
      "id": "103a6dcfa885d1d5d004b2afd439",
      "name": "cs-test-1784313646669-extra",
      "color": null,
      "created_at": "2026-07-17T18:40:47Z",
      "updated_at": "2026-07-17T18:40:47Z"
    },
    {
      "id": "103b03a53c0b5c0ddd885c0391c8",
      "name": "null",
      "color": null,
      "created_at": "2026-07-20T16:30:27Z",
      "updated_at": "2026-07-20T16:30:27Z"
    },
    {
      "id": "103a09822ecde8ca61249d417deb",
      "name": "probe-autocreated-1",
      "color": null,
      "created_at": "2026-07-15T19:56:07Z",
      "updated_at": "2026-07-15T19:56:07Z"
    }
  ]
}
```

### `POST /v1/accounts/{accountId}/tags`
SDK `tags.create` · CLI `assinafy tags create`

**Request body**
```json
{
  "name": "audit-audit0720",
  "color": "3366ff"
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "tag",
    "id": "103b0befba1a60a208722043f168",
    "name": "audit-audit0720",
    "color": "3366ff",
    "created_at": "2026-07-20T20:22:17Z",
    "updated_at": "2026-07-20T20:22:17Z"
  }
}
```

### `DELETE /v1/accounts/{accountId}/tags/{tagId}`
SDK `tags.delete` · CLI `assinafy tags delete`

**Response 409**
```json
{
  "status": 409,
  "data": null,
  "message": "A tag está em uso. Passe force=true para desvincular e excluir."
}
```

### `PUT /v1/accounts/{accountId}/tags/{tagId}`
SDK `tags.update` · CLI `assinafy tags update`

**Request body**
```json
{
  "color": "ff3366"
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "tag",
    "id": "103b0befba1a60a208722043f168",
    "name": "audit-audit0720",
    "color": "ff3366",
    "created_at": "2026-07-20T20:22:17Z",
    "updated_at": "2026-07-20T20:22:17Z"
  }
}
```

## Fields

### `GET /v1/accounts/{accountId}/fields`
SDK `fields.list` · CLI `assinafy fields list`

**Query params**
```json
{
  "include_standard": true
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "102d25a48bcf142065f2b06cf821",
      "name": "Assinatura",
      "type": "signature",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": true,
      "is_standard": true,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48bda4bdadde1b8a25991",
      "name": "Iniciais",
      "type": "initial",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": true,
      "is_standard": true,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48be34910f816a334b715",
      "name": "Data de Assinatura",
      "type": "signatureDate",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": true,
      "is_standard": true,
      "is_read_only": true,
      "is_visible": true
    },
    {
      "id": "102d25a48bec03ebcf3b5f651998",
      "name": "Nome",
      "type": "personName",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48bf5816b9029b0ca6043",
      "name": "CPF",
      "type": "cpf",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48c0696b8eb3930ed7328",
      "name": "CEP",
      "type": "postalCode",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48c0e2d4e79477d673896",
      "name": "E-mail",
      "type": "email",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48c167c598ba72cf8de7b",
      "name": "CNPJ",
      "type": "cnpj",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48c1eba4b8bbe539fee47",
      "name": "Nome da empresa",
      "type": "companyName",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48c289d354aae9a660dc3",
      "name": "Campo Texto",
      "type": "text",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "102d25a48c38c5e8f8e47da33fd0",
      "name": "Data",
      "type": "date",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "103b039c7f87786dab7e9bbc926f",
      "name": "AuditField",
      "type": "text",
      "regex": null,
      "is_pre_defined": false,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "19e1d5d413384a5b41793814b69",
      "name": "Número de Telefone",
      "type": "phoneNumber",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    },
    {
      "id": "19e1d5d413844a943708cefde68",
      "name": "Número",
      "type": "number",
      "regex": null,
      "is_pre_defined": true,
      "is_active": true,
      "is_required": false,
      "is_standard": false,
      "is_read_only": false,
      "is_visible": true
    }
  ]
}
```

### `POST /v1/accounts/{accountId}/fields`
SDK `fields.create` · CLI `assinafy fields create`

`regex` must be a **PCRE pattern with delimiters** (e.g. `/^[0-9]+$/`), not a
bare pattern — live-verified: `"^[0-9]+$"` (no delimiters) is rejected with
`400 Padrão RegEx inválido.` while `"/^[0-9]+$/"` succeeds. The SDK passes the
string through unchanged; supply the delimiters yourself.

**Request body**
```json
{
  "type": "text",
  "name": "audit-field-audit0720",
  "is_required": false
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "field_definition",
    "id": "103b0befc7f0554d7c660c028229",
    "name": "audit-field-audit0720",
    "type": "text",
    "regex": null,
    "is_pre_defined": false,
    "is_active": true,
    "is_required": false,
    "is_standard": false,
    "is_read_only": false,
    "is_visible": true
  }
}
```

### `DELETE /v1/accounts/{accountId}/fields/{fieldId}`
SDK `fields.delete` · CLI `assinafy fields delete`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": []
}
```

### `GET /v1/accounts/{accountId}/fields/{fieldId}`
SDK `fields.get` · CLI `assinafy fields get`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "field_definition",
    "id": "103b0befc7f0554d7c660c028229",
    "name": "audit-field-audit0720",
    "type": "text",
    "regex": null,
    "is_pre_defined": false,
    "is_active": true,
    "is_required": false,
    "is_standard": false,
    "is_read_only": false,
    "is_visible": true
  }
}
```

### `PUT /v1/accounts/{accountId}/fields/{fieldId}`
SDK `fields.update` · CLI `assinafy fields update` (also `--clear-regex`, live-verified)

**Request body**
```json
{
  "name": "audit-field-audit0720-v2"
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "field_definition",
    "id": "103b0befc7f0554d7c660c028229",
    "name": "audit-field-audit0720-v2",
    "type": "text",
    "regex": null,
    "is_pre_defined": false,
    "is_active": true,
    "is_required": false,
    "is_standard": false,
    "is_read_only": false,
    "is_visible": true
  }
}
```

**Clearing a regex** — pass `{ "regex": null }` (`assinafy fields update <id> --clear-regex`):
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "field_definition",
    "id": "103ee388025db5ab059e7c25163b",
    "name": "audit-clear-regex-1786229135707",
    "type": "text",
    "regex": null,
    "is_pre_defined": false,
    "is_active": true,
    "is_required": true,
    "is_standard": false,
    "is_read_only": false,
    "is_visible": true
  }
}
```

### `POST /v1/accounts/{accountId}/fields/{fieldId}/validate`
SDK `fields.validate` · CLI `assinafy fields validate`

The `signer-access-code` query parameter (for signer-side validation) is not
in the published spec for this endpoint, but is live-verified: a bogus code
returns `401` ("Credenciais inválidas."), the same behavior as every other
`signer-access-code`-gated endpoint.

**Request body**
```json
{
  "value": "some-value"
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "type": "text",
    "success": true,
    "error_message": ""
  }
}
```

### `POST /v1/accounts/{accountId}/fields/validate-multiple`
SDK `fields.validateMultiple` · CLI `assinafy fields validate-multiple`

**Request body**
```json
[
  {
    "field_id": "103b0befc7f0554d7c660c028229",
    "value": "x"
  }
]
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "field_id": "103b0befc7f0554d7c660c028229",
      "type": "text",
      "success": true,
      "error_message": ""
    }
  ]
}
```

### `GET /v1/field-types`
SDK `fields.listTypes` · CLI `assinafy fields types`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "type": "personName",
      "name": "Nome"
    },
    {
      "type": "cpf",
      "name": "CPF"
    },
    {
      "type": "phoneNumber",
      "name": "Número de Telefone"
    },
    {
      "type": "postalCode",
      "name": "CEP"
    },
    {
      "type": "email",
      "name": "E-mail"
    },
    {
      "type": "cnpj",
      "name": "CNPJ"
    },
    {
      "type": "companyName",
      "name": "Nome da empresa"
    },
    {
      "type": "email",
      "name": "E-mail"
    },
    {
      "type": "text",
      "name": "Texto"
    },
    {
      "type": "number",
      "name": "Número"
    },
    {
      "type": "date",
      "name": "Data"
    }
  ]
}
```

## Webhooks

### `GET /v1/accounts/{accountId}/webhooks`
SDK `webhooks.listDispatches` · CLI `assinafy webhooks dispatches`

**Query params**
```json
{
  "per-page": 2
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "103b0a5544d99b6ab16b044c63e0",
      "event": "signature_requested",
      "activity_id": 15715,
      "endpoint": "https://webhook.site/arp-assinafy-sandbox",
      "payload": {
        "id": 15715,
        "event": "signature_requested",
        "object": {
          "type": "Document"
        },
        "origin": null,
        "message": null,
        "payload": {
          "signer_email": "bill@febacapital.com",
          "signer_full_name": "Audit Bill A2",
          "notification_method": "email",
          "signer_whatsapp_phone_number": null
        },
        "subject": {
          "id": "md3j6p9w8b7y6qvqaoy5er42",
          "name": "Multica Test",
          "type": "User",
          "email": "bill@febacapital.com",
          "telephone": null,
          "created_at": "2026-05-12T18:05:11Z",
          "government_id": "",
          "is_password_set": true,
          "to_be_deleted_at": null,
          "is_email_verified": true,
          "has_accepted_terms": true
        },
        "account_id": "102d25a489f34a275d31a16045fd",
        "created_at": "2026-07-20T19:37:08Z"
      },
      "delivered": false,
      "http_status": 404,
      "response_body": "{\"success\":false,\"error\":{\"message\":\"Token \\\"arp-assinafy-sandbox\\\" not found\",\"id\":\"\"}}",
      "error": "Client error: `POST https://webhook.site/arp-assinafy-sandbox` resulted in a `404 Not Found` response:\n{\"success\":false,\"error\":{\"message\":\"Token \\\"arp-assinafy-sandbox\\\" not found\",\"id\":\"\"}}\n",
      "created_at": "2026-07-20T19:37:27Z",
      "updated_at": "2026-07-20T19:37:27Z"
    },
    {
      "id": "103b0a54c3eb49adf475f3760573",
      "event": "signature_requested",
      "activity_id": 15715,
      "endpoint": "https://webhook.site/arp-assinafy-sandbox",
      "payload": {
        "id": 15715,
        "event": "signature_requested",
        "object": {
          "type": "Document"
        },
        "origin": null,
        "message": null,
        "payload": {
          "signer_email": "bill@febacapital.com",
          "signer_full_name": "Audit Bill A2",
          "notification_method": "email",
          "signer_whatsapp_phone_number": null
        },
        "subject": {
          "id": "md3j6p9w8b7y6qvqaoy5er42",
          "name": "Multica Test",
          "type": "User",
          "email": "bill@febacapital.com",
          "telephone": null,
          "created_at": "2026-05-12T18:05:11Z",
          "government_id": "",
          "is_password_set": true,
          "to_be_deleted_at": null,
          "is_email_verified": true,
          "has_accepted_terms": true
        },
        "account_id": "102d25a489f34a275d31a16045fd",
        "created_at": "2026-07-20T19:37:08Z"
      },
      "delivered": false,
      "http_status": 404,
      "response_body": "{\"success\":false,\"error\":{\"message\":\"Token \\\"arp-assinafy-sandbox\\\" not found\",\"id\":\"\"}}",
      "error": "Client error: `POST https://webhook.site/arp-assinafy-sandbox` resulted in a `404 Not Found` response:\n{\"success\":false,\"error\":{\"message\":\"Token \\\"arp-assinafy-sandbox\\\" not found\",\"id\":\"\"}}\n",
      "created_at": "2026-07-20T19:37:24Z",
      "updated_at": "2026-07-20T19:37:24Z"
    }
  ]
}
```

### `POST /v1/accounts/{accountId}/webhooks/{historyId}/retry`
SDK `webhooks.retryDispatch` · CLI `assinafy webhooks retry`

**Response 400**
```json
{
  "status": 400,
  "data": null,
  "message": "A assinatura do webhook não está ativa."
}
```

### `PUT /v1/accounts/{accountId}/webhooks/inactivate`
SDK `webhooks.inactivate` · CLI `assinafy webhooks inactivate`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "events": [
      "document_uploaded"
    ],
    "is_active": false,
    "url": "https://example.com/assinafy-audit-hook",
    "email": "bill@febacapital.com",
    "updated_at": "2026-07-20T20:22:29Z"
  }
}
```

### `GET /v1/accounts/{accountId}/webhooks/subscriptions`
SDK `webhooks.get` · CLI `assinafy webhooks get`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "events": [
      "document_ready",
      "signer_signed_document",
      "signer_rejected_document",
      "document_processing_failed",
      "signature_requested",
      "document_prepared",
      "assignment_created"
    ],
    "is_active": true,
    "url": "https://webhook.site/arp-assinafy-sandbox",
    "email": "sandbox@assinafy.com.br",
    "updated_at": "2026-07-20T18:58:37Z"
  }
}
```

### `PUT /v1/accounts/{accountId}/webhooks/subscriptions`
SDK `webhooks.register` · CLI `assinafy webhooks register`

**Request body**
```json
{
  "url": "https://example.com/assinafy-audit-hook",
  "email": "bill@febacapital.com",
  "events": [
    "document_uploaded"
  ],
  "is_active": false
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "events": [
      "document_uploaded"
    ],
    "is_active": false,
    "url": "https://example.com/assinafy-audit-hook",
    "email": "bill@febacapital.com",
    "updated_at": "2026-07-20T20:22:29Z"
  }
}
```

### `GET /v1/webhooks/event-types`
SDK `webhooks.listEventTypes` · CLI `assinafy webhooks event-types`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "document_uploaded",
      "description": "Triggered when the User has uploaded a Document"
    },
    {
      "id": "document_metadata_ready",
      "description": "Triggered when the document is ready to be prepared. The the document has been normalized to PDF and its pages are available."
    },
    {
      "id": "document_prepared",
      "description": "Triggered when the User as subject prepares a Document."
    },
    {
      "id": "assignment_created",
      "description": "Triggered when the User created an assignment for a Document. Includes a snapshot of the creator profile (name, email, telephone) and origin IP/user-agent."
    },
    {
      "id": "signature_requested",
      "description": "Triggered when the User requested signature of a Document"
    },
    {
      "id": "document_ready",
      "description": "Triggered when the last Signer of the assignment signs the Document, as a result, the document status becomes ready."
    },
    {
      "id": "signer_created",
      "description": "Triggered when the User created a Signer"
    },
    {
      "id": "signer_email_verified",
      "description": "Triggered when Signer's email has been verified by a verification code linked to a Document"
    },
    {
      "id": "signer_whatsapp_verified",
      "description": "Triggered when Signer's WhatsApp phone number has been verified by a verification code linked to a Document"
    },
    {
      "id": "signer_data_confirmed",
      "description": "Triggered when Signer's data has been confirmed"
    },
    {
      "id": "signer_signed_document",
      "description": "Triggered when the Signer signed a Document"
    },
    {
      "id": "signer_viewed_document",
      "description": "Triggered when the Signer viewed a Document for the first time"
    },
    {
      "id": "signer_rejected_document",
      "description": "Triggered when the Signer rejected signing a Document"
    },
    {
      "id": "user_rejected_document",
      "description": "Triggered when document has been cancelled."
    },
    {
      "id": "document_processing_failed",
      "description": "Unprocessable document, either invalid or the system couldn't process it"
    }
  ]
}
```

## Workspaces / Accounts

> `list`/`get`/`create`/`update`/`delete` were previously (incorrectly) marked
> _production-only_ in this doc. All five were re-verified live against the
> sandbox on 2026-08-08 with a plain API key — none of them are restricted to
> production. Only the logo/stats/theme endpoints below remain out of CLI
> scope / unverified.

### `GET /v1/accounts`
SDK `workspaces.list` · CLI `assinafy workspaces list`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": [
    {
      "id": "102d25a489f34a275d31a16045fd",
      "name": "MT",
      "roles": [
        "owner"
      ],
      "is_delete_allowed": true,
      "created_at": "2026-05-12T18:05:11Z"
    }
  ]
}
```

### `POST /v1/accounts`
SDK `workspaces.create` · CLI `assinafy workspaces create`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "id": "103ee217b741cf6de6d751a45477",
    "name": "Audit Live Workspace 1786226722112",
    "primary_color": null,
    "secondary_color": null,
    "created_at": "2026-08-08T22:05:22Z"
  }
}
```

### `DELETE /v1/accounts/{accountId}`
SDK `workspaces.delete` · CLI `assinafy workspaces delete`

Optional request body `{ "force": true }` cancels an active paid subscription
automatically; otherwise deleting a workspace with one active returns `400`.

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": []
}
```

### `GET /v1/accounts/{accountId}`
SDK `workspaces.get` · CLI `assinafy workspaces get`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "id": "102d25a489f34a275d31a16045fd",
    "name": "MT",
    "primary_color": null,
    "secondary_color": null,
    "created_at": "2026-05-12T18:05:11Z"
  }
}
```

### `PUT /v1/accounts/{accountId}`
SDK `workspaces.update` · CLI `assinafy workspaces update`

**Request body**
```json
{ "name": "Audit Live Workspace 1786226722112 (updated)" }
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "id": "103ee217b741cf6de6d751a45477",
    "name": "Audit Live Workspace 1786226722112 (updated)",
    "primary_color": null,
    "secondary_color": null,
    "created_at": "2026-08-08T22:05:22Z"
  }
}
```

### `DELETE /v1/accounts/{accountId}/logo`
_out-of-scope for the CLI_ · _production-only_

_Not exercised live (out of CLI scope); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/accounts/{accountId}/logo`
_out-of-scope for the CLI_ · _production-only_

_Not exercised live (out of CLI scope); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `POST /v1/accounts/{accountId}/logo`
_out-of-scope for the CLI_ · _production-only_

_Not exercised live (out of CLI scope); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/accounts/{accountId}/stats`
_out-of-scope for the CLI_ · _production-only_

_Not exercised live (out of CLI scope); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/accounts/{accountId}/theme`
_out-of-scope for the CLI_ · _production-only_

_Not exercised live (out of CLI scope); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

## Authentication

### `POST /v1/auth/link-social-login`
_out-of-scope for the CLI_

_Not exercised live (out of CLI scope); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `PUT /v1/authentication/change-password`
SDK `auth.changePassword` · CLI `assinafy auth change-password`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `PUT /v1/authentication/request-password-reset`
SDK `auth.requestPasswordReset` · CLI `assinafy auth request-password-reset`

**Response 404** — for an email with no Assinafy user account (live-verified;
note the API distinguishes "no such user" from success here, rather than
returning a uniform response — factor this in if building enumeration-safe UX)
```json
{
  "status": 404,
  "data": null,
  "message": "Usuário não localizado."
}
```

### `PUT /v1/authentication/reset-password`
SDK `auth.resetPassword` · CLI `assinafy auth reset-password`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `POST /v1/authentication/social-login`
SDK `auth.socialLogin` · CLI `assinafy auth social-login`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `POST /v1/login`
SDK `auth.login` · CLI `assinafy auth login`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `DELETE /v1/users/api-keys`
SDK `auth.deleteApiKey` · CLI `assinafy auth api-keys delete`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/users/api-keys`
SDK `auth.getApiKey` · CLI `assinafy auth api-keys get`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "api_key": "************************************************************NEWq"
  }
}
```

### `POST /v1/users/api-keys`
SDK `auth.createApiKey` · CLI `assinafy auth api-keys create`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

## Users

### `GET /v1/users/self`
_out-of-scope for the CLI_ · _production-only_

_Not exercised live (out of CLI scope); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/users/self/stats`
_out-of-scope for the CLI_ · _production-only_

_Not exercised live (out of CLI scope); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

## Signer-side (access-code) flows

### `POST /v1/documents/{documentId}/assignments/{assignmentId}`
SDK `signerDocuments.sign` · CLI `assinafy signer sign`

Sign a document with input fields (`collect` method): submit the signer's item
values, completing their items. For **virtual** assignments the signer must
first confirm their data via `PUT /v1/documents/{documentId}/signers/confirm-data`,
otherwise this returns `400` ("Signer data must be confirmed before signing").
The request body is a bare JSON **array** of item entries (not an object).

_Not exercised live (requires a real signer OTP access-code from an emailed
signing link); request/response derived from the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

**Request body**
```json
[
  {
    "itemId": "615606efcde1a39c9d21e30e",
    "fieldId": "6152120297080d55bdd13197",
    "pageId": "615213ed81b071f4293b2fc2",
    "value": "Signed by Sonny Bayer"
  }
]
```

**Response 200** — `data` is an opaque object on success (the spec doesn't document its fields)
```json
{
  "status": 200,
  "message": "",
  "data": {}
}
```

**Response 400** — virtual assignment, signer hasn't confirmed their data yet
```json
{
  "status": 400,
  "data": null,
  "message": "Signer data must be confirmed before signing"
}
```

### `PUT /v1/documents/{documentId}/assignments/{assignmentId}/reject`
SDK `signerDocuments.decline` · CLI `assinafy signer decline`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `PUT /v1/documents/{documentId}/signers/confirm-data`
SDK `signerDocuments.confirmData` · CLI `assinafy signer confirm-data`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/public/documents/{documentId}`
SDK `documents.getPublic` · CLI `assinafy documents public`

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "resource": "document",
    "id": "103b0beff2fabee48849e2a07aba",
    "name": "audit-audit0720.pdf",
    "page_count": "1",
    "created_by": "Multica Test"
  }
}
```

### `PUT /v1/public/documents/{documentId}/send-token`
SDK `documents.sendToken` · CLI `assinafy documents send-token`

Requires the document to be in `pending_signature` status (i.e. a signature
request/assignment is already active) — returns 400 ("O documento não está
com status de assinatura pendente.") otherwise.

**Request body**
```json
{
  "recipient": "bill@febacapital.com",
  "channel": "email"
}
```

**Response 200**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "document": {
      "resource": "document",
      "id": "103b0beff2fabee48849e2a07aba",
      "name": "audit-audit0720.pdf",
      "page_count": "1",
      "created_by": "Multica Test"
    },
    "channel": "email",
    "recipient": "bill@febacapital.com"
  }
}
```

### `GET /v1/sign`
SDK `signerDocuments.getAssignment` · CLI `assinafy signer assignment`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `POST /v1/signature`
SDK `signerDocuments.uploadSignature` · CLI `assinafy signer upload-signature`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/signature/{signatureType}`
SDK `signerDocuments.downloadSignature` · CLI `assinafy signer download-signature`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/signers/{signerId}/document`
SDK `signerDocuments.getCurrent` · CLI `assinafy signer document`

**Query params**
```json
{
  "signer-access-code": "bogus-access-code-000"
}
```

**Response 401**
```json
{
  "status": 401,
  "data": null,
  "message": "Credenciais inválidas."
}
```

### `GET /v1/signers/{signerId}/documents`
SDK `signerDocuments.list` · CLI `assinafy signer documents`

**Query params**
```json
{
  "signer-access-code": "bogus-access-code-000"
}
```

**Response 401**
```json
{
  "status": 401,
  "data": null,
  "message": "Credenciais inválidas."
}
```

### `GET /v1/signers/{signerId}/documents/{documentId}/download/{artifactName}`
SDK `signerDocuments.download` · CLI `assinafy signer download`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/signers/{signerId}/documents/search`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `PUT /v1/signers/accept-terms`
SDK `signerDocuments.acceptTerms` · CLI `assinafy signer accept-terms`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `PUT /v1/signers/documents/decline-multiple`
SDK `signerDocuments.declineMultiple` · CLI `assinafy signer decline-multiple`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `PUT /v1/signers/documents/sign-multiple`
SDK `signerDocuments.signMultiple` · CLI `assinafy signer sign-multiple`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._

### `GET /v1/signers/self`
SDK `signerDocuments.self` · CLI `assinafy signer self`

**Query params**
```json
{
  "signer-access-code": "bogus-access-code-000"
}
```

**Response 401**
```json
{
  "status": 401,
  "data": null,
  "message": "Credenciais inválidas."
}
```

### `POST /v1/verify`
SDK `signerDocuments.verifyEmail` · CLI `assinafy signer verify-email`

_Not exercised live (requires interactive login or a signer OTP access-code); see the [OpenAPI spec](https://api.assinafy.com.br/v1/docs)._
