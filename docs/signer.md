# `assinafy signer`

## `assinafy signer`

```text
Usage: assinafy signer [options] [command]

Signer-side flows authenticated by a signer access code

Options:
  -h, --help                                             display help for command

Commands:
  document [options] <signerId>                          Fetch the signer's current document
  documents [options] <signerId>                         List the signer's documents
  download [options] <signerId> <documentId> <artifact>  Download a signer document artifact
  self [options]                                         Fetch the signer's own profile
  accept-terms [options]                                 Accept the platform terms as the signer
  verify-email [options]                                 Verify the email OTP for a signer
  confirm-data [options] <documentId>                    Confirm a signer's contact data
  upload-signature [options]                             Upload the signer's signature or initial image
  download-signature [options]                           Download the signer's signature or initial image
  assignment [options]                                   Fetch the assignment as the signer sees it
  sign [options] <documentId> <assignmentId>             Sign a document as the signer
  decline [options] <documentId> <assignmentId>          Decline an assignment as the signer
  sign-multiple [options]                                Sign multiple documents at once
  decline-multiple [options]                             Decline multiple documents at once
  help [command]                                         display help for command
```

### `assinafy signer document`

```text
Usage: assinafy signer document [options] <signerId>

Fetch the signer's current document

Arguments:
  signerId              Signer ID

Options:
  --access-code <code>  Signer access code
  -h, --help            display help for command
```

### `assinafy signer documents`

```text
Usage: assinafy signer documents [options] <signerId>

List the signer's documents

Arguments:
  signerId              Signer ID

Options:
  --access-code <code>  Signer access code
  --page <n>            Page number to fetch
  --per-page <n>        Items per page
  --search <query>      Filter results by a search query
  --sort <field>        Sort by field (prefix with - for descending)
  -h, --help            display help for command
```

### `assinafy signer download`

```text
Usage: assinafy signer download [options] <signerId> <documentId> <artifact>

Download a signer document artifact

Arguments:
  signerId              Signer ID
  documentId            Document ID
  artifact              original | certificated | certificate-page | bundle

Options:
  --access-code <code>  Signer access code
  -o, --output <path>   Output file path
  -h, --help            display help for command
```

### `assinafy signer self`

```text
Usage: assinafy signer self [options]

Fetch the signer's own profile

Options:
  --access-code <code>  Signer access code
  -h, --help            display help for command
```

### `assinafy signer accept-terms`

```text
Usage: assinafy signer accept-terms [options]

Accept the platform terms as the signer

Options:
  --access-code <code>  Signer access code
  -h, --help            display help for command
```

### `assinafy signer verify-email`

```text
Usage: assinafy signer verify-email [options]

Verify the email OTP for a signer

Options:
  --access-code <code>  Signer access code
  --code <otp>          Verification code
  -h, --help            display help for command
```

### `assinafy signer confirm-data`

```text
Usage: assinafy signer confirm-data [options] <documentId>

Confirm a signer's contact data

Arguments:
  documentId            Document ID

Options:
  --access-code <code>  Signer access code
  --email <email>       Email to confirm
  --phone <number>      WhatsApp phone number to confirm
  --accept-terms        Also accept the platform terms
  -h, --help            display help for command
```

### `assinafy signer upload-signature`

```text
Usage: assinafy signer upload-signature [options]

Upload the signer's signature or initial image

Options:
  --access-code <code>   Signer access code
  --file <path>          Path to the signature image (PNG)
  --type <type>          signature or initial (default: "signature")
  --content-type <mime>  Image MIME type (default: "image/png")
  -h, --help             display help for command
```

### `assinafy signer download-signature`

```text
Usage: assinafy signer download-signature [options]

Download the signer's signature or initial image

Options:
  --access-code <code>  Signer access code
  --type <type>         signature or initial (default: "signature")
  -o, --output <path>   Output file path
  -h, --help            display help for command
```

### `assinafy signer assignment`

```text
Usage: assinafy signer assignment [options]

Fetch the assignment as the signer sees it

Options:
  --access-code <code>  Signer access code
  --accept-terms        Pass has_accepted_terms=true
  -h, --help            display help for command
```

### `assinafy signer sign`

```text
Usage: assinafy signer sign [options] <documentId> <assignmentId>

Sign a document as the signer

Arguments:
  documentId            Document ID
  assignmentId          Assignment ID

Options:
  --access-code <code>  Signer access code
  --entries <json>      JSON array of { itemId, fieldId, pageId, value } entries
  -h, --help            display help for command
```

### `assinafy signer decline`

```text
Usage: assinafy signer decline [options] <documentId> <assignmentId>

Decline an assignment as the signer

Arguments:
  documentId            Document ID
  assignmentId          Assignment ID

Options:
  --access-code <code>  Signer access code
  --reason <reason>     Reason for declining
  -h, --help            display help for command
```

### `assinafy signer sign-multiple`

```text
Usage: assinafy signer sign-multiple [options]

Sign multiple documents at once

Options:
  --access-code <code>  Signer access code
  --document-ids <csv>  Comma-separated document IDs
  -h, --help            display help for command
```

### `assinafy signer decline-multiple`

```text
Usage: assinafy signer decline-multiple [options]

Decline multiple documents at once

Options:
  --access-code <code>  Signer access code
  --document-ids <csv>  Comma-separated document IDs
  --reason <reason>     Reason for declining
  -h, --help            display help for command
```

