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
  update [options] <id>     Update a workspace
  delete|rm [options] <id>  Delete a workspace
  help [command]            display help for command
```

### `assinafy workspaces create`

```text
Usage: assinafy workspaces create [options]

Create a workspace (account)

Options:
  --name <name>            Workspace name
  --primary-color <hex>    Primary brand color
  --secondary-color <hex>  Secondary brand color
  -h, --help               display help for command
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

### `assinafy workspaces update`

```text
Usage: assinafy workspaces update [options] <id>

Update a workspace

Arguments:
  id                       Account/workspace ID

Options:
  --name <name>            New name
  --primary-color <hex>    Primary brand color (pass empty to clear)
  --secondary-color <hex>  Secondary brand color (pass empty to clear)
  -h, --help               display help for command
```

### `assinafy workspaces delete`

```text
Usage: assinafy workspaces delete|rm [options] <id>

Delete a workspace

Arguments:
  id          Account/workspace ID

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

