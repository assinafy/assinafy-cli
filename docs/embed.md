# `assinafy embed`

## `assinafy embed`

```text
Usage: assinafy embed [options] [command]

Embedded signing origins and sessions

Options:
  -h, --help                                      display help for command

Commands:
  origins                                         Manage origins allowed to embed signing pages
  session <documentId> <assignmentId> <signerId>  Mint a private iframe URL valid for five minutes
  exchange [options]                              Consume a session token (Assinafy embed page operation)
  help [command]                                  display help for command
```

### `assinafy embed origins`

```text
Usage: assinafy embed origins [options] [command]

Manage origins allowed to embed signing pages

Options:
  -h, --help                   display help for command

Commands:
  list                         List allowed origins
  create [options]             Allow an exact origin
  update [options] <originId>  Replace an allowed origin
  delete [options] <originId>  Remove an allowed origin
  help [command]               display help for command
```

#### `assinafy embed origins list`

```text
Usage: assinafy embed origins list [options]

List allowed origins

Options:
  -h, --help  display help for command
```

#### `assinafy embed origins create`

```text
Usage: assinafy embed origins create [options]

Allow an exact origin

Options:
  --origin <url>  HTTPS origin (HTTP allowed for localhost/127.0.0.1)
  -h, --help      display help for command
```

#### `assinafy embed origins update`

```text
Usage: assinafy embed origins update [options] <originId>

Replace an allowed origin

Arguments:
  originId        Origin ID

Options:
  --origin <url>  New exact origin
  -h, --help      display help for command
```

#### `assinafy embed origins delete`

```text
Usage: assinafy embed origins delete [options] <originId>

Remove an allowed origin

Arguments:
  originId    Origin ID

Options:
  -y, --yes   Skip confirmation
  -h, --help  display help for command
```

### `assinafy embed session`

```text
Usage: assinafy embed session [options] <documentId> <assignmentId> <signerId>

Mint a private iframe URL valid for five minutes

Arguments:
  documentId    Document ID
  assignmentId  Assignment ID
  signerId      Signer ID

Options:
  -h, --help    display help for command
```

### `assinafy embed exchange`

```text
Usage: assinafy embed exchange [options]

Consume a session token (Assinafy embed page operation)

Options:
  --session-token <token>  Private session token (env:
                           ASSINAFY_EMBED_SESSION_TOKEN)
  --parent-origin <url>    Origin hosting the iframe
  -h, --help               display help for command
```
