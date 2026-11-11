# `assinafy signer`

## `assinafy signer`

```text
Usage: assinafy signer [options] [command]

Signer-side flows and public artifact downloads

Options:
  -h, --help                                             display help for command

Commands:
  theme [options]                                        Read the signing workspace brand
  logo [options]                                         Download the signing workspace logo
  certified-copy [options]                               Send a new certified-copy link to the original signing contact
  download-copy [options]                                Download a PDF using a certified-copy link token
  resend-download-link [options]                         Send a new link using an expired download token
  document [options] <signerId>                          Fetch the signer's current document
  documents [options] <signerId>                         List the signer's documents
  search [options] <signerId> <query>                    Search the signer's documents
  download [options] <signerId> <documentId> <artifact>  Download the original with a signer code; use download-copy for certified files
  self [options]                                         Fetch the signer's own profile
  identity-status [options]                              Fetch biometric verification status and the private capture URL
  identity-start [options]                               Open a biometric verification session with the signer’s explicit consent
  accept-terms [options]                                 Accept the platform terms as the signer
  verify-code|verify-email [options]                     Verify an email or WhatsApp OTP for a signer
  certificate-start [options]                            Start an ICP-Brasil A1/A3 signature and return the Web PKI token
  certificate-complete [options]                         Complete an ICP-Brasil A1/A3 signature after Web PKI has signed the token
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

### `assinafy signer theme`

```text
Usage: assinafy signer theme [options]

Read the signing workspace brand

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  -h, --help            display help for command
```

### `assinafy signer logo`

```text
Usage: assinafy signer logo [options]

Download the signing workspace logo

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  -o, --output <path>   Output file path
  --force               Overwrite the output file if it already exists
  -h, --help            display help for command
```

### `assinafy signer certified-copy`

```text
Usage: assinafy signer certified-copy [options]

Send a new certified-copy link to the original signing contact

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --document-id <id>    Another document in the same envelope
  -h, --help            display help for command
```

### `assinafy signer download-copy`

```text
Usage: assinafy signer download-copy [options]

Download a PDF using a certified-copy link token

Options:
  --download-token <token>  Private certified-copy link token (env:
                            ASSINAFY_DOWNLOAD_TOKEN)
  -o, --output <path>       Output file path
  --force                   Overwrite the output file if it already exists
  --artifact <name>         PDF artifact (choices: "certificated", "pades",
                            default: "certificated")
  -h, --help                display help for command
```

### `assinafy signer resend-download-link`

```text
Usage: assinafy signer resend-download-link [options]

Send a new link using an expired download token

Options:
  --download-token <token>  Private certified-copy link token (env:
                            ASSINAFY_DOWNLOAD_TOKEN)
  -h, --help                display help for command
```

### `assinafy signer document`

```text
Usage: assinafy signer document [options] <signerId>

Fetch the signer's current document

Arguments:
  signerId              Signer ID

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --expand <relation>   Include the envelope (choices: "envelope")
  -h, --help            display help for command
```

### `assinafy signer documents`

```text
Usage: assinafy signer documents [options] <signerId>

List the signer's documents

Arguments:
  signerId              Signer ID

Options:
  --envelope <id>       Filter by envelope ID
  --access-code <code>  Signer access code (omit to use your API key or token)
                        (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --page <n>            Page number to fetch
  --per-page <n>        Items per page
  --search <query>      Filter by a search query
  --sort <field>        Sort by field
  -h, --help            display help for command
```

### `assinafy signer search`

```text
Usage: assinafy signer search [options] <signerId> <query>

Search the signer's documents

Arguments:
  signerId              Signer ID
  query                 Search text

Options:
  --envelope <id>       Filter by envelope ID
  --access-code <code>  Signer access code (omit to use your API key or token)
                        (env: ASSINAFY_SIGNER_ACCESS_CODE)
  -h, --help            display help for command
```

### `assinafy signer download`

```text
Usage: assinafy signer download [options] <signerId> <documentId> <artifact>

Download the original with a signer code; use download-copy for certified files

Arguments:
  signerId              Signer ID
  documentId            Document ID
  artifact              original | certificated | certificate-page | pades |
                        bundle

Options:
  --access-code <code>  Signer access code (required by the current API) (env:
                        ASSINAFY_SIGNER_ACCESS_CODE)
  -o, --output <path>   Output file path
  --force               Overwrite the output file if it already exists
  -h, --help            display help for command
```

### `assinafy signer self`

```text
Usage: assinafy signer self [options]

Fetch the signer's own profile

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  -h, --help            display help for command
```

### `assinafy signer identity-status`

```text
Usage: assinafy signer identity-status [options]

Fetch biometric verification status and the private capture URL

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  -h, --help            display help for command
```

### `assinafy signer identity-start`

```text
Usage: assinafy signer identity-start [options]

Open a biometric verification session with the signer’s explicit consent

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --consent             The signer explicitly consents to biometric processing
  -h, --help            display help for command
```

### `assinafy signer accept-terms`

```text
Usage: assinafy signer accept-terms [options]

Accept the platform terms as the signer

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  -h, --help            display help for command
```

### `assinafy signer verify-code`

```text
Usage: assinafy signer verify-code|verify-email [options]

Verify an email or WhatsApp OTP for a signer

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --code <otp>          Verification code (env: ASSINAFY_VERIFICATION_CODE)
  -h, --help            display help for command
```

### `assinafy signer certificate-start`

```text
Usage: assinafy signer certificate-start [options]

Start an ICP-Brasil A1/A3 signature and return the Web PKI token

Options:
  --document-id <id>    Select a document of the same envelope
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  -h, --help            display help for command
```

### `assinafy signer certificate-complete`

```text
Usage: assinafy signer certificate-complete [options]

Complete an ICP-Brasil A1/A3 signature after Web PKI has signed the token

Options:
  --document-id <id>           Select a document of the same envelope
  --access-code <code>         Signer access code (env:
                               ASSINAFY_SIGNER_ACCESS_CODE)
  --certificate-token <token>  Operation token returned by certificate-start
                               (env: ASSINAFY_CERTIFICATE_TOKEN)
  -h, --help                   display help for command
```

### `assinafy signer confirm-data`

```text
Usage: assinafy signer confirm-data [options] <documentId>

Confirm a signer's contact data

Arguments:
  documentId            Document ID

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --full-name <name>    Full name to confirm
  --email <email>       Email to confirm
  --phone <number>      WhatsApp phone number to confirm
  --government-id <id>  Government ID (e.g. CPF) to confirm
  --accept-terms        Also accept the platform terms
  -h, --help            display help for command
```

### `assinafy signer upload-signature`

```text
Usage: assinafy signer upload-signature [options]

Upload the signer's signature or initial image

Options:
  --access-code <code>   Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --file <path>          Path to the signature image (PNG)
  --type <type>          signature or initial (default: "signature")
  --content-type <mime>  Image MIME type (default: "image/png")
  --reuse                Mark the signer's signature as reusable in future
                         processes
  --no-reuse             Disable reuse of the signer's signature in future
                         processes
  -h, --help             display help for command
```

### `assinafy signer download-signature`

```text
Usage: assinafy signer download-signature [options]

Download the signer's signature or initial image

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --type <type>         signature or initial (default: "signature")
  -o, --output <path>   Output file path
  --force               Overwrite the output file if it already exists
  -h, --help            display help for command
```

### `assinafy signer assignment`

```text
Usage: assinafy signer assignment [options]

Fetch the assignment as the signer sees it

Options:
  --document-id <id>    Select another document of the same envelope
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --accept-terms        Pass has_accepted_terms=true
  --expand <relation>   Include the envelope (choices: "envelope")
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
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --entries <json>      JSON array of { itemId, fieldId, pageId, value }
                        entries; use [] for virtual assignments
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
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --reason <reason>     Reason for declining
  -h, --help            display help for command
```

### `assinafy signer sign-multiple`

```text
Usage: assinafy signer sign-multiple [options]

Sign multiple documents at once

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --document-ids <csv>  Comma-separated document IDs
  -h, --help            display help for command
```

### `assinafy signer decline-multiple`

```text
Usage: assinafy signer decline-multiple [options]

Decline multiple documents at once

Options:
  --access-code <code>  Signer access code (env: ASSINAFY_SIGNER_ACCESS_CODE)
  --document-ids <csv>  Comma-separated document IDs
  --reason <reason>     Reason for declining
  -h, --help            display help for command
```
