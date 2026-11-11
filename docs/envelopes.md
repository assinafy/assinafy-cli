# `assinafy envelopes`

## `assinafy envelopes`

```text
Usage: assinafy envelopes [options] [command]

Send and manage groups of documents

Options:
  -h, --help                                           display help for command

Commands:
  list [options]                                       List workspace envelopes
  create [options]                                     Create an envelope and send invitations
  estimate-cost [options]                              Estimate without sending or charging
  get <envelopeId>                                     Read an envelope and its documents
  update [options] <envelopeId>                        Rename, change message, or reorder documents
  cancel [options] <envelopeId>                        Cancel open documents and notify recipients
  delete [options] <envelopeId>                        Delete a closed envelope, keeping its documents
  activities [options] <envelopeId>                    Read a page of document activities
  download [options] <envelopeId>                      Download a ZIP of document artifacts
  resend <envelopeId> <signerId>                       Resend one signer’s envelope invitation; paid channels cost credits
  add-document [options] <envelopeId>                  Add a processed document and notify its envelope signers
  remove-document [options] <envelopeId> <documentId>  Cancel and remove an open document, notifying its recipients
  help [command]                                       display help for command
```

### `assinafy envelopes list`

```text
Usage: assinafy envelopes list [options]

List workspace envelopes

Options:
  --page <n>         Page number to fetch
  --per-page <n>     Items per page
  --search <text>    Part of the envelope name
  --status <status>  Document lifecycle group (choices: "open", "closed")
  -h, --help         display help for command
```

### `assinafy envelopes create`

```text
Usage: assinafy envelopes create [options]

Create an envelope and send invitations

Options:
  --data <json>            Envelope JSON: name, signers, documents, optional
                           max_total_credits
  --idempotency-key <key>  Creation key for recovering a lost response
  -h, --help               display help for command
```

### `assinafy envelopes estimate-cost`

```text
Usage: assinafy envelopes estimate-cost [options]

Estimate without sending or charging

Options:
  --data <json>  Envelope JSON: name, signers, documents, optional
                 max_total_credits
  -h, --help     display help for command
```

### `assinafy envelopes get`

```text
Usage: assinafy envelopes get [options] <envelopeId>

Read an envelope and its documents

Arguments:
  envelopeId  Envelope ID

Options:
  -h, --help  display help for command
```

### `assinafy envelopes update`

```text
Usage: assinafy envelopes update [options] <envelopeId>

Rename, change message, or reorder documents

Arguments:
  envelopeId     Envelope ID

Options:
  --data <json>  Partial JSON: name, message (null clears), document_ids
  -h, --help     display help for command
```

### `assinafy envelopes cancel`

```text
Usage: assinafy envelopes cancel [options] <envelopeId>

Cancel open documents and notify recipients

Arguments:
  envelopeId  Envelope ID

Options:
  -y, --yes   Skip confirmation
  -h, --help  display help for command
```

### `assinafy envelopes delete`

```text
Usage: assinafy envelopes delete [options] <envelopeId>

Delete a closed envelope, keeping its documents

Arguments:
  envelopeId  Envelope ID

Options:
  -y, --yes   Skip confirmation
  -h, --help  display help for command
```

### `assinafy envelopes activities`

```text
Usage: assinafy envelopes activities [options] <envelopeId>

Read a page of document activities

Arguments:
  envelopeId      Envelope ID

Options:
  --page <n>      Page number to fetch
  --per-page <n>  Items per page
  --sort <field>  id or -id
  -h, --help      display help for command
```

### `assinafy envelopes download`

```text
Usage: assinafy envelopes download [options] <envelopeId>

Download a ZIP of document artifacts

Arguments:
  envelopeId           Envelope ID

Options:
  -o, --output <path>  Output file path
  --force              Overwrite the output file if it already exists
  --artifact <name>    original, certificated, certificate-page, pades, bundle
                       (default: "certificated")
  -h, --help           display help for command
```

### `assinafy envelopes resend`

```text
Usage: assinafy envelopes resend [options] <envelopeId> <signerId>

Resend one signer’s envelope invitation; paid channels cost credits

Arguments:
  envelopeId  Envelope ID
  signerId    Signer ID

Options:
  -h, --help  display help for command
```

### `assinafy envelopes add-document`

```text
Usage: assinafy envelopes add-document [options] <envelopeId>

Add a processed document and notify its envelope signers

Arguments:
  envelopeId     Envelope ID

Options:
  --data <json>  JSON: id, signer_ids, optional method, entries, expires_at,
                 copy_receiver_ids, max_total_credits
  -h, --help     display help for command
```

### `assinafy envelopes remove-document`

```text
Usage: assinafy envelopes remove-document [options] <envelopeId> <documentId>

Cancel and remove an open document, notifying its recipients

Arguments:
  envelopeId  Envelope ID
  documentId  Document ID

Options:
  -y, --yes   Skip confirmation
  -h, --help  display help for command
```
