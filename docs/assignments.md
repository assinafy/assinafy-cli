# `assinafy assignments`

## `assinafy assignments`

```text
Usage: assinafy assignments [options] [command]

Create and manage signing assignments

Options:
  -h, --help                                                   display help for command

Commands:
  create [options] <documentId>                                Create a signing assignment for a document
  estimate-cost [options] <documentId>                         Estimate the credit cost of an assignment
  reset-expiration [options] <documentId> <assignmentId>       Update or clear an assignment expiration date
  resend <documentId> <assignmentId> <signerId>                Resend the signing notification to a signer
  estimate-resend-cost <documentId> <assignmentId> <signerId>  Estimate the cost of resending a signer notification
  whatsapp-notifications <documentId> <assignmentId>           List WhatsApp notifications sent for an assignment
  help [command]                                               display help for command
```

### `assinafy assignments create`

```text
Usage: assinafy assignments create [options] <documentId>

Create a signing assignment for a document

Arguments:
  documentId              Document ID

Options:
  --signer-ids <csv>      Comma-separated signer IDs
  --signers <json>        JSON array of signer refs (with verification_method,
                          step, …)
  --method <method>       virtual or collect (default: "virtual")
  --message <message>     Message shown to signers
  --expires-at <iso8601>  Expiration timestamp
  --copy-receivers <csv>  Comma-separated emails to CC
  -h, --help              display help for command
```

### `assinafy assignments estimate-cost`

```text
Usage: assinafy assignments estimate-cost [options] <documentId>

Estimate the credit cost of an assignment

Arguments:
  documentId          Document ID

Options:
  --signer-ids <csv>  Comma-separated signer IDs
  --signers <json>    JSON array of signer refs
  -h, --help          display help for command
```

### `assinafy assignments reset-expiration`

```text
Usage: assinafy assignments reset-expiration [options] <documentId> <assignmentId>

Update or clear an assignment expiration date

Arguments:
  documentId              Document ID
  assignmentId            Assignment ID

Options:
  --expires-at <iso8601>  New expiration timestamp
  --clear                 Remove the expiration entirely
  -h, --help              display help for command
```

### `assinafy assignments resend`

```text
Usage: assinafy assignments resend [options] <documentId> <assignmentId> <signerId>

Resend the signing notification to a signer

Arguments:
  documentId    Document ID
  assignmentId  Assignment ID
  signerId      Signer ID

Options:
  -h, --help    display help for command
```

### `assinafy assignments estimate-resend-cost`

```text
Usage: assinafy assignments estimate-resend-cost [options] <documentId> <assignmentId> <signerId>

Estimate the cost of resending a signer notification

Arguments:
  documentId    Document ID
  assignmentId  Assignment ID
  signerId      Signer ID

Options:
  -h, --help    display help for command
```

### `assinafy assignments whatsapp-notifications`

```text
Usage: assinafy assignments whatsapp-notifications [options] <documentId> <assignmentId>

List WhatsApp notifications sent for an assignment

Arguments:
  documentId    Document ID
  assignmentId  Assignment ID

Options:
  -h, --help    display help for command
```

