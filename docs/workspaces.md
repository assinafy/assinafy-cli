# `assinafy workspaces`

## `assinafy workspaces`

```text
Usage: assinafy workspaces|accounts [options] [command]

Manage workspaces (accounts)

Options:
  -h, --help                display help for command

Commands:
  create [options]          Create a workspace (account)
  list                      List workspaces you can access
  get <id>                  Show a workspace by ID
  theme <id>                Show public branding for a workspace
  stats [options] <id>      Show document KPIs for a workspace
  logo                      Manage a workspace logo
  update [options] <id>     Update a workspace
  delete|rm [options] <id>  Delete a workspace
  help [command]            display help for command
```

### `assinafy workspaces create`

```text
Usage: assinafy workspaces create [options]

Create a workspace (account)

Options:
  --name <name>                 Workspace name
  --notification-sender <type>  Notification sender: User or Account
  --primary-color <hex>         Primary brand color
  --secondary-color <hex>       Secondary brand color
  -h, --help                    display help for command
```

### `assinafy workspaces list`

```text
Usage: assinafy workspaces list [options]

List workspaces you can access

Options:
  -h, --help  display help for command
```

### `assinafy workspaces get`

```text
Usage: assinafy workspaces get [options] <id>

Show a workspace by ID

Arguments:
  id          Account/workspace ID

Options:
  -h, --help  display help for command
```

### `assinafy workspaces theme`

```text
Usage: assinafy workspaces theme [options] <id>

Show public branding for a workspace

Arguments:
  id          Account/workspace ID

Options:
  -h, --help  display help for command
```

### `assinafy workspaces stats`

```text
Usage: assinafy workspaces stats [options] <id>

Show document KPIs for a workspace

Arguments:
  id                     Account/workspace ID

Options:
  --granularity <value>  monthly or daily (default: "monthly")
  --month <yyyy-mm>      Month required for daily granularity
  -h, --help             display help for command
```

### `assinafy workspaces logo`

```text
Usage: assinafy workspaces logo [options] [command]

Manage a workspace logo

Options:
  -h, --help                    display help for command

Commands:
  download [options] <id>       Download the workspace logo
  upload [options] <id> <file>  Upload or replace the workspace logo
  delete|rm [options] <id>      Delete the workspace logo
  help [command]                display help for command
```

#### `assinafy workspaces logo download`

```text
Usage: assinafy workspaces logo download [options] <id>

Download the workspace logo

Arguments:
  id                   Account/workspace ID

Options:
  -o, --output <path>  Output file path
  --force              Overwrite the output file if it already exists
  -h, --help           display help for command
```

#### `assinafy workspaces logo upload`

```text
Usage: assinafy workspaces logo upload [options] <id> <file>

Upload or replace the workspace logo

Arguments:
  id                     Account/workspace ID
  file                   Logo image path

Options:
  --content-type <mime>  Image MIME type (inferred from extension)
  -h, --help             display help for command
```

#### `assinafy workspaces logo delete`

```text
Usage: assinafy workspaces logo delete|rm [options] <id>

Delete the workspace logo

Arguments:
  id          Account/workspace ID

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

### `assinafy workspaces update`

```text
Usage: assinafy workspaces update [options] <id>

Update a workspace

Arguments:
  id                            Account/workspace ID

Options:
  --name <name>                 New name
  --notification-sender <type>  Notification sender: User or Account
  --primary-color <hex>         Primary brand color (pass empty to clear)
  --secondary-color <hex>       Secondary brand color (pass empty to clear)
  -h, --help                    display help for command
```

### `assinafy workspaces delete`

```text
Usage: assinafy workspaces delete|rm [options] <id>

Delete a workspace

Arguments:
  id          Account/workspace ID

Options:
  --force     Cancel an active paid subscription automatically and delete anyway
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```
