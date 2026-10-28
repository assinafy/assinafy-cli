# `assinafy contracts`

## `assinafy contracts`

```text
Usage: assinafy contracts [options] [command]

Track contract terms, amendments, renewals and terminations (CLM)

Options:
  -h, --help                        display help for command

Commands:
  list [options]                    List workspace contract terms
  get <documentId>                  Read a document’s contract terms or
                                    amendment link
  set [options] <documentId>        Set terms or link an amendment; null clears,
                                    omitted fields stay unchanged
  related <documentId>              Read the root contract and every linked
                                    instrument
  renew [options] <documentId>      Start the next term using the current term
                                    or a later end_date
  terminate [options] <documentId>  Terminate tracked terms and stop lifecycle
                                    alerts
  help [command]                    display help for command
```

### `assinafy contracts list`

```text
Usage: assinafy contracts list [options]

List workspace contract terms

Options:
  --page <n>                  Page number to fetch
  --per-page <n>              Items per page
  --search <query>            Filter by a search query
  --sort <field>              end_date or updated_at; prefix with - for
                              descending
  --status <csv>              draft, active, expired, terminated
                              (comma-separated)
  --counterparty <query>      Counterparty name or exact CPF/CNPJ
  --end-date-from <date>      Earliest end date (YYYY-MM-DD)
  --end-date-to <date>        Latest end date (YYYY-MM-DD)
  --ending-within-days <n>    Ends within 0–3650 days; 0 includes today in
                              Brasília
  --external-system <system>  External reference system
  --external-id <id>          External reference ID
  --expand <relation>         Embed document
  -h, --help                  display help for command
```

### `assinafy contracts get`

```text
Usage: assinafy contracts get [options] <documentId>

Read a document’s contract terms or amendment link

Arguments:
  documentId  Document ID

Options:
  -h, --help  display help for command
```

### `assinafy contracts set`

```text
Usage: assinafy contracts set [options] <documentId>

Set terms or link an amendment; null clears, omitted fields stay unchanged

Arguments:
  documentId     Document ID

Options:
  --data <json>  JSON terms or amendment link; include updated_at for conflict
                 detection
  -h, --help     display help for command
```

### `assinafy contracts related`

```text
Usage: assinafy contracts related [options] <documentId>

Read the root contract and every linked instrument

Arguments:
  documentId  Contract or amendment document ID

Options:
  -h, --help  display help for command
```

### `assinafy contracts renew`

```text
Usage: assinafy contracts renew [options] <documentId>

Start the next term using the current term or a later end_date

Arguments:
  documentId     Document ID

Options:
  --data <json>  JSON with term or end_date, optional value and updated_at
  -y, --yes      Skip confirmation
  -h, --help     display help for command
```

### `assinafy contracts terminate`

```text
Usage: assinafy contracts terminate [options] <documentId>

Terminate tracked terms and stop lifecycle alerts

Arguments:
  documentId     Document ID

Options:
  --data <json>  JSON with optional reason and updated_at
  -y, --yes      Skip confirmation
  -h, --help     display help for command
```
