# `assinafy tags`

## `assinafy tags`

```text
Usage: assinafy tags [options] [command]

Manage workspace tags

Options:
  -h, --help                display help for command

Commands:
  list [options]            List workspace tags (alphabetical)
  create [options]          Create a tag
  update [options] <id>     Update a tag name and/or color
  delete|rm [options] <id>  Delete a tag
  help [command]            display help for command
```

### `assinafy tags list`

```text
Usage: assinafy tags list [options]

List workspace tags (alphabetical)

Options:
  --search <query>  Case-insensitive name filter
  -h, --help        display help for command
```

### `assinafy tags create`

```text
Usage: assinafy tags create [options]

Create a tag

Options:
  --name <name>  Tag name (unique per workspace)
  --color <hex>  6-char hex color, with or without leading #
  -h, --help     display help for command
```

### `assinafy tags update`

```text
Usage: assinafy tags update [options] <id>

Update a tag name and/or color

Arguments:
  id             Tag ID

Options:
  --name <name>  New name
  --color <hex>  6-char hex color
  --clear-color  Clear the color
  -h, --help     display help for command
```

### `assinafy tags delete`

```text
Usage: assinafy tags delete|rm [options] <id>

Delete a tag

Arguments:
  id          Tag ID

Options:
  --force     Detach the tag from everything first
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

