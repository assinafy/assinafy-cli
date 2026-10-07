# `assinafy webhooks`

## `assinafy webhooks`

```text
Usage: assinafy webhooks [options] [command]

Manage webhook endpoints, the primary subscription, and delivery history

Options:
  -h, --help            display help for command

Commands:
  endpoints             Manage webhook endpoints and their signing secrets
  register [options]    Register (or replace) the account's oldest webhook
                        endpoint
  get                   Show the account's oldest webhook endpoint
  inactivate            Inactivate the account's oldest webhook endpoint without
                        deleting it
  event-types           List supported webhook event types
  dispatches [options]  List webhook delivery history
  retry <dispatchId>    Retry delivery of a specific dispatch
  help [command]        display help for command
```

### `assinafy webhooks endpoints`

```text
Usage: assinafy webhooks endpoints [options] [command]

Manage webhook endpoints and their signing secrets

Options:
  -h, --help                            display help for command

Commands:
  list|ls                               List webhook endpoints, oldest first
  create [options]                      Register a webhook endpoint (1 per
                                        account, up to 3 on paid plans)
  get <endpointId>                      Show one webhook endpoint
  update [options] <endpointId>         Update the given fields of a webhook
                                        endpoint
  delete|rm [options] <endpointId>      Delete a webhook endpoint and free its
                                        slot
  secret <endpointId>                   Print the endpoint signing secret
                                        (signing must be enabled; not available
                                        via OAuth)
  rotate-secret [options] <endpointId>  Replace the endpoint signing secret; the
                                        old one stops working immediately
  help [command]                        display help for command
```

#### `assinafy webhooks endpoints list`

```text
Usage: assinafy webhooks endpoints list|ls [options]

List webhook endpoints, oldest first

Options:
  -h, --help  display help for command
```

#### `assinafy webhooks endpoints create`

```text
Usage: assinafy webhooks endpoints create [options]

Register a webhook endpoint (1 per account, up to 3 on paid plans)

Options:
  --url <url>      Endpoint URL to receive events
  --email <email>  Contact email for delivery problems
  --name <name>    Label to tell endpoints apart
  --events <csv>   Comma-separated event names
  --active         Deliver events to this endpoint
  --inactive       Stop delivering events
  --signing        Sign deliveries (Standard Webhooks)
  --no-signing     Disable signing and discard the secret
  -h, --help       display help for command
```

#### `assinafy webhooks endpoints get`

```text
Usage: assinafy webhooks endpoints get [options] <endpointId>

Show one webhook endpoint

Arguments:
  endpointId  Endpoint ID

Options:
  -h, --help  display help for command
```

#### `assinafy webhooks endpoints update`

```text
Usage: assinafy webhooks endpoints update [options] <endpointId>

Update the given fields of a webhook endpoint

Arguments:
  endpointId       Endpoint ID

Options:
  --url <url>      Endpoint URL to receive events
  --email <email>  Contact email for delivery problems
  --name <name>    Label to tell endpoints apart
  --events <csv>   Comma-separated event names
  --active         Deliver events to this endpoint
  --inactive       Stop delivering events
  --signing        Sign deliveries (Standard Webhooks)
  --no-signing     Disable signing and discard the secret
  -h, --help       display help for command
```

#### `assinafy webhooks endpoints delete`

```text
Usage: assinafy webhooks endpoints delete|rm [options] <endpointId>

Delete a webhook endpoint and free its slot

Arguments:
  endpointId  Endpoint ID

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

#### `assinafy webhooks endpoints secret`

```text
Usage: assinafy webhooks endpoints secret [options] <endpointId>

Print the endpoint signing secret (signing must be enabled; not available via
OAuth)

Arguments:
  endpointId  Endpoint ID

Options:
  -h, --help  display help for command
```

#### `assinafy webhooks endpoints rotate-secret`

```text
Usage: assinafy webhooks endpoints rotate-secret [options] <endpointId>

Replace the endpoint signing secret; the old one stops working immediately

Arguments:
  endpointId  Endpoint ID

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

### `assinafy webhooks register`

```text
Usage: assinafy webhooks register [options]

Register (or replace) the account's oldest webhook endpoint

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

Show the account's oldest webhook endpoint

Options:
  -h, --help  display help for command
```

### `assinafy webhooks inactivate`

```text
Usage: assinafy webhooks inactivate [options]

Inactivate the account's oldest webhook endpoint without deleting it

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
  --endpoint <endpointId>  Only deliveries to this webhook endpoint
  --event <event>          Filter by event name
  --delivered <bool>       Filter by delivery status (true/false)
  --from <unix>            Start of time range (unix seconds)
  --to <unix>              End of time range (unix seconds)
  --page <n>               Page number to fetch
  --per-page <n>           Items per page
  --sort <field>           Sort by created_at (prefix with - for descending)
  -h, --help               display help for command
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
