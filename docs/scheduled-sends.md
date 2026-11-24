# `assinafy scheduled-sends`

## `assinafy scheduled-sends`

```text
Usage: assinafy scheduled-sends [options] [command]

List, cancel or send queued requests (staging)

Options:
  -h, --help                          display help for command

Commands:
  list [options]                      List queued assignments and envelopes
  cancel [options] <scheduledSendId>  Cancel a pending request without sending
  send [options] <scheduledSendId>    Send now, charging the current cost and
                                      notifying signers
  help [command]                      display help for command
```

### `assinafy scheduled-sends list`

```text
Usage: assinafy scheduled-sends list [options]

List queued assignments and envelopes

Options:
  --page <n>       Page number to fetch
  --per-page <n>   Items per page
  --document <id>  Filter by document ID
  -h, --help       display help for command
```

### `assinafy scheduled-sends cancel`

```text
Usage: assinafy scheduled-sends cancel [options] <scheduledSendId>

Cancel a pending request without sending

Arguments:
  scheduledSendId  Scheduled send ID

Options:
  -y, --yes        Skip confirmation
  -h, --help       display help for command
```

### `assinafy scheduled-sends send`

```text
Usage: assinafy scheduled-sends send [options] <scheduledSendId>

Send now, charging the current cost and notifying signers

Arguments:
  scheduledSendId  Scheduled send ID

Options:
  -y, --yes        Skip confirmation
  -h, --help       display help for command
```
