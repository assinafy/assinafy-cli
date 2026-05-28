# `assinafy signers`

## `assinafy signers`

```text
Usage: assinafy signers [options] [command]

Create, list, and manage signers

Options:
  -h, --help                display help for command

Commands:
  create [options]          Create a signer (reuses an existing one with the
                            same email)
  list [options]            List signers in the workspace
  get <id>                  Show a signer by ID
  update [options] <id>     Update a signer
  delete|rm [options] <id>  Delete a signer
  find-by-email <email>     Find a signer by email address
  help [command]            display help for command
```

### `assinafy signers create`

```text
Usage: assinafy signers create [options]

Create a signer (reuses an existing one with the same email)

Options:
  --name <name>      Signer full name
  --email <email>    Email address
  --phone <number>   WhatsApp phone number (E.164)
  --cpf <cpf>        Brazilian tax ID (CPF); non-digits are stripped
  --metadata <json>  JSON object of metadata
  -h, --help         display help for command
```

### `assinafy signers list`

```text
Usage: assinafy signers list [options]

List signers in the workspace

Options:
  --page <n>        Page number to fetch
  --per-page <n>    Items per page
  --search <query>  Filter results by a search query
  --sort <field>    Sort by field (prefix with - for descending)
  -h, --help        display help for command
```

### `assinafy signers get`

```text
Usage: assinafy signers get [options] <id>

Show a signer by ID

Arguments:
  id          Signer ID

Options:
  -h, --help  display help for command
```

### `assinafy signers update`

```text
Usage: assinafy signers update [options] <id>

Update a signer

Arguments:
  id                Signer ID

Options:
  --name <name>     Signer full name
  --email <email>   Email address
  --phone <number>  WhatsApp phone number (E.164)
  --cpf <cpf>       Brazilian tax ID (CPF)
  -h, --help        display help for command
```

### `assinafy signers delete`

```text
Usage: assinafy signers delete|rm [options] <id>

Delete a signer

Arguments:
  id          Signer ID

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

### `assinafy signers find-by-email`

```text
Usage: assinafy signers find-by-email [options] <email>

Find a signer by email address

Arguments:
  email       Email address

Options:
  -h, --help  display help for command
```

