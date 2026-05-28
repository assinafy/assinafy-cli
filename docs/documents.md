# `assinafy documents`

## `assinafy documents`

```text
Usage: assinafy documents [options] [command]

Upload, list, download, and manage documents

Options:
  -h, --help                                     display help for command

Commands:
  upload [options] <file>                        Upload a PDF to the workspace
  list [options]                                 List workspace documents
  get <id>                                       Show details for a document
  download [options] <id>                        Download a document artifact
  thumbnail [options] <id>                       Download the document thumbnail (JPEG)
  download-page [options] <id> <pageId>          Download a single document page (JPEG)
  activities <id>                                Show the activity log for a document
  delete|rm [options] <id>                       Delete a document
  tags <id>                                      List the tags attached to a document
  tags-set <id> [names...]                       Replace a document tag set (names; unknown names are auto-created)
  tags-add <id> <names...>                       Attach additional tags by name without removing existing ones
  tags-remove <id> <tagId>                       Detach a single tag from a document
  create-from-template [options] <templateId>    Create a document from a template
  estimate-template-cost [options] <templateId>  Estimate the credit cost of creating a document from a template
  verify <hash>                                  Verify a document by its signature hash
  statuses                                       List every possible document status
  public <id>                                    Public (unauthenticated) lookup of basic document info
  send-token [options] <id>                      Send a 6-digit verification token to a signer
  progress <id>                                  Show signing progress for a document
  wait [options] <id>                            Poll a document until it is ready (or fails / times out)
  help [command]                                 display help for command
```

### `assinafy documents upload`

```text
Usage: assinafy documents upload [options] <file>

Upload a PDF to the workspace

Arguments:
  file               Path to the PDF file

Options:
  --name <name>      Override the document name (defaults to the file name)
  --metadata <json>  JSON object of metadata to attach
  --wait             Wait until the document finishes processing
  -h, --help         display help for command
```

### `assinafy documents list`

```text
Usage: assinafy documents list [options]

List workspace documents

Options:
  --status <status>  Filter by document status
  --method <method>  Filter by signature method (virtual or collect)
  --tags <ids>       Comma-separated tag IDs (AND semantics)
  --page <n>         Page number to fetch
  --per-page <n>     Items per page
  --search <query>   Filter results by a search query
  --sort <field>     Sort by field (prefix with - for descending)
  -h, --help         display help for command
```

### `assinafy documents get`

```text
Usage: assinafy documents get [options] <id>

Show details for a document

Arguments:
  id          Document ID

Options:
  -h, --help  display help for command
```

### `assinafy documents download`

```text
Usage: assinafy documents download [options] <id>

Download a document artifact

Arguments:
  id                   Document ID

Options:
  --artifact <name>    original | certificated | certificate-page | bundle
                       (default: "certificated")
  -o, --output <path>  Output file path
  -h, --help           display help for command
```

### `assinafy documents thumbnail`

```text
Usage: assinafy documents thumbnail [options] <id>

Download the document thumbnail (JPEG)

Arguments:
  id                   Document ID

Options:
  -o, --output <path>  Output file path
  -h, --help           display help for command
```

### `assinafy documents download-page`

```text
Usage: assinafy documents download-page [options] <id> <pageId>

Download a single document page (JPEG)

Arguments:
  id                   Document ID
  pageId               Page ID

Options:
  -o, --output <path>  Output file path
  -h, --help           display help for command
```

### `assinafy documents activities`

```text
Usage: assinafy documents activities [options] <id>

Show the activity log for a document

Arguments:
  id          Document ID

Options:
  -h, --help  display help for command
```

### `assinafy documents delete`

```text
Usage: assinafy documents delete|rm [options] <id>

Delete a document

Arguments:
  id          Document ID

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

### `assinafy documents tags`

```text
Usage: assinafy documents tags [options] <id>

List the tags attached to a document

Arguments:
  id          Document ID

Options:
  -h, --help  display help for command
```

### `assinafy documents tags-set`

```text
Usage: assinafy documents tags-set [options] <id> [names...]

Replace a document tag set (names; unknown names are auto-created)

Arguments:
  id          Document ID
  names       Tag names (pass none to detach all)

Options:
  -h, --help  display help for command
```

### `assinafy documents tags-add`

```text
Usage: assinafy documents tags-add [options] <id> <names...>

Attach additional tags by name without removing existing ones

Arguments:
  id          Document ID
  names       Tag names to attach

Options:
  -h, --help  display help for command
```

### `assinafy documents tags-remove`

```text
Usage: assinafy documents tags-remove [options] <id> <tagId>

Detach a single tag from a document

Arguments:
  id          Document ID
  tagId       Tag ID to detach

Options:
  -h, --help  display help for command
```

### `assinafy documents create-from-template`

```text
Usage: assinafy documents create-from-template [options] <templateId>

Create a document from a template

Arguments:
  templateId              Template ID

Options:
  --signers <json>        JSON array of signers, e.g.
                          '[{"role_id":"r","id":"s","verification_method":"Email","notification_methods":["Email"]}]'
  --name <name>           Document name
  --message <message>     Message shown to signers
  --expires-at <iso8601>  Expiration timestamp
  --tags <names>          Comma-separated tag names to attach
  --editor-fields <json>  JSON array of editor field placements
  -h, --help              display help for command
```

### `assinafy documents estimate-template-cost`

```text
Usage: assinafy documents estimate-template-cost [options] <templateId>

Estimate the credit cost of creating a document from a template

Arguments:
  templateId        Template ID

Options:
  --signers <json>  JSON array of signers
  -h, --help        display help for command
```

### `assinafy documents verify`

```text
Usage: assinafy documents verify [options] <hash>

Verify a document by its signature hash

Arguments:
  hash        Signature hash

Options:
  -h, --help  display help for command
```

### `assinafy documents statuses`

```text
Usage: assinafy documents statuses [options]

List every possible document status

Options:
  -h, --help  display help for command
```

### `assinafy documents public`

```text
Usage: assinafy documents public [options] <id>

Public (unauthenticated) lookup of basic document info

Arguments:
  id          Document ID

Options:
  -h, --help  display help for command
```

### `assinafy documents send-token`

```text
Usage: assinafy documents send-token [options] <id>

Send a 6-digit verification token to a signer

Arguments:
  id                   Document ID

Options:
  --recipient <value>  Email address or phone number
  --channel <channel>  email or whatsapp (default: "email")
  -h, --help           display help for command
```

### `assinafy documents progress`

```text
Usage: assinafy documents progress [options] <id>

Show signing progress for a document

Arguments:
  id          Document ID

Options:
  -h, --help  display help for command
```

### `assinafy documents wait`

```text
Usage: assinafy documents wait [options] <id>

Poll a document until it is ready (or fails / times out)

Arguments:
  id               Document ID

Options:
  --timeout <ms>   Maximum time to wait in milliseconds (default: "30000")
  --interval <ms>  Poll interval in milliseconds (default: "2000")
  -h, --help       display help for command
```

