# `assinafy webhooks`

## `assinafy webhooks`

```text
Usage: assinafy webhooks [options] [command]

Manage webhook subscriptions and delivery history

Options:
  -h, --help            display help for command

Commands:
  register [options]    Register (or replace) the workspace webhook subscription
  get                   Show the current webhook subscription
  delete|rm [options]   Delete the webhook subscription
  inactivate            Inactivate the webhook subscription without deleting it
  event-types           List supported webhook event types
  dispatches [options]  List webhook delivery history
  retry <dispatchId>    Retry delivery of a specific dispatch
  help [command]        display help for command
```

### `assinafy webhooks register`

```text
Usage: assinafy webhooks register [options]

Register (or replace) the workspace webhook subscription

Options:
  --url <url>      Endpoint URL to receive events
  --email <email>  Contact email for delivery problems
  --events <csv>   Comma-separated event names (defaults to a sensible set)
  --inactive       Register the subscription as inactive
  -h, --help       display help for command
```

### `assinafy webhooks get`

```text
Usage: assinafy webhooks get [options]

Show the current webhook subscription

Options:
  -h, --help  display help for command
```

### `assinafy webhooks delete`

```text
Usage: assinafy webhooks delete|rm [options]

Delete the webhook subscription

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

### `assinafy webhooks inactivate`

```text
Usage: assinafy webhooks inactivate [options]

Inactivate the webhook subscription without deleting it

Options:
  -h, --help  display help for command
```

### `assinafy webhooks event-types`

```text
Usage: assinafy webhooks event-types [options]

List supported webhook event types

Options:
  -h, --help  display help for command
```

### `assinafy webhooks dispatches`

```text
Usage: assinafy webhooks dispatches [options]

List webhook delivery history

Options:
  --event <event>     Filter by event name
  --delivered <bool>  Filter by delivery status (true/false)
  --from <unix>       Start of time range (unix seconds)
  --to <unix>         End of time range (unix seconds)
  --page <n>          Page number to fetch
  --per-page <n>      Items per page
  --search <query>    Filter results by a search query
  --sort <field>      Sort by field (prefix with - for descending)
  -h, --help          display help for command
```

### `assinafy webhooks retry`

```text
Usage: assinafy webhooks retry [options] <dispatchId>

Retry delivery of a specific dispatch

Arguments:
  dispatchId  Dispatch ID

Options:
  -h, --help  display help for command
```

