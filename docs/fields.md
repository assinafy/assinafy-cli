# `assinafy fields`

## `assinafy fields`

```text
Usage: assinafy fields [options] [command]

Manage custom field definitions used by collect assignments

Options:
  -h, --help                       display help for command

Commands:
  create [options]                 Create a custom field definition
  list [options]                   List field definitions
  get <id>                         Show a field definition by ID
  update [options] <id>            Update a field definition
  delete|rm [options] <id>         Delete a field definition
  validate [options] <id> <value>  Validate a value against a field definition
  validate-multiple [options]      Validate multiple field values at once
  types                            List the platform's supported field types
  help [command]                   display help for command
```

### `assinafy fields create`

```text
Usage: assinafy fields create [options]

Create a custom field definition

Options:
  --type <type>    Field type (see `fields types`)
  --name <name>    Field name
  --regex <regex>  Validation regex
  --required       Mark the field as required
  --inactive       Create the field inactive
  -h, --help       display help for command
```

### `assinafy fields list`

```text
Usage: assinafy fields list [options]

List field definitions

Options:
  --include-inactive  Include inactive fields
  --include-standard  Include standard fields (signature, initial, …)
  -h, --help          display help for command
```

### `assinafy fields get`

```text
Usage: assinafy fields get [options] <id>

Show a field definition by ID

Arguments:
  id          Field ID

Options:
  -h, --help  display help for command
```

### `assinafy fields update`

```text
Usage: assinafy fields update [options] <id>

Update a field definition

Arguments:
  id               Field ID

Options:
  --type <type>    Field type
  --name <name>    Field name
  --regex <regex>  Validation regex
  --required       Mark as required
  --optional       Mark as not required
  --active         Activate the field
  --inactive       Deactivate the field
  -h, --help       display help for command
```

### `assinafy fields delete`

```text
Usage: assinafy fields delete|rm [options] <id>

Delete a field definition

Arguments:
  id          Field ID

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

### `assinafy fields validate`

```text
Usage: assinafy fields validate [options] <id> <value>

Validate a value against a field definition

Arguments:
  id                           Field ID
  value                        Value to validate

Options:
  --signer-access-code <code>  Signer access code (for signer-side validation)
  -h, --help                   display help for command
```

### `assinafy fields validate-multiple`

```text
Usage: assinafy fields validate-multiple [options]

Validate multiple field values at once

Options:
  --entries <json>             JSON array of { field_id, value } entries
  --signer-access-code <code>  Signer access code
  -h, --help                   display help for command
```

### `assinafy fields types`

```text
Usage: assinafy fields types [options]

List the platform's supported field types

Options:
  -h, --help  display help for command
```

