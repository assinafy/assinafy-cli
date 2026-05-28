# `assinafy templates`

## `assinafy templates`

```text
Usage: assinafy templates [options] [command]

List and inspect document templates

Options:
  -h, --help                                     display help for command

Commands:
  list [options]                                 List templates in the workspace
  get <id>                                       Show a template by ID
  download-page [options] <templateId> <pageId>  Download a template page as a JPEG
  help [command]                                 display help for command
```

### `assinafy templates list`

```text
Usage: assinafy templates list [options]

List templates in the workspace

Options:
  --page <n>        Page number to fetch
  --per-page <n>    Items per page
  --search <query>  Filter results by a search query
  --sort <field>    Sort by field (prefix with - for descending)
  -h, --help        display help for command
```

### `assinafy templates get`

```text
Usage: assinafy templates get [options] <id>

Show a template by ID

Arguments:
  id          Template ID

Options:
  -h, --help  display help for command
```

### `assinafy templates download-page`

```text
Usage: assinafy templates download-page [options] <templateId> <pageId>

Download a template page as a JPEG

Arguments:
  templateId           Template ID
  pageId               Page ID

Options:
  -o, --output <path>  Output file path
  -h, --help           display help for command
```

