# `assinafy send`

## `assinafy send`

```text
Usage: assinafy send [options] <file>

Upload a PDF, create signers, and request signatures in one step

Arguments:
  file                    Path to the PDF file

Options:
  --signer <spec>         Signer as "Name <email-or-phone>" (repeatable)
                          (default: [])
  --signers <json>        JSON array of signer objects (overrides --signer)
  --message <message>     Message shown to signers
  --expires-at <iso8601>  Expiration timestamp
  --copy-receivers <csv>  Comma-separated emails to CC
  --metadata <json>       JSON object of metadata to attach to the document
  --no-wait               Do not wait for the document to finish processing
  -h, --help              display help for command
```

