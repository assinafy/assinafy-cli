# `assinafy users`

## `assinafy users`

```text
Usage: assinafy users [options] [command]

Show the authenticated user and personal preferences

Options:
  -h, --help                            display help for command

Commands:
  self                                  Show the authenticated user's profile
                                        and accounts
  stats [options]                       Show document KPIs across the user's
                                        accounts
  notification-preferences|preferences  Manage owner-facing email notification
                                        preferences
  help [command]                        display help for command
```

### `assinafy users self`

```text
Usage: assinafy users self [options]

Show the authenticated user's profile and accounts

Options:
  -h, --help  display help for command
```

### `assinafy users stats`

```text
Usage: assinafy users stats [options]

Show document KPIs across the user's accounts

Options:
  --granularity <value>  monthly or daily (default: "monthly")
  --month <yyyy-mm>      Month required for daily granularity
  -h, --help             display help for command
```

### `assinafy users notification-preferences`

```text
Usage: assinafy users notification-preferences|preferences [options] [command]

Manage owner-facing email notification preferences

Options:
  -h, --help        display help for command

Commands:
  get               Show all owner-facing email notification preferences
  update [options]  Merge one or more owner-facing email notification
                    preferences
  help [command]    display help for command
```

#### `assinafy users notification-preferences get`

```text
Usage: assinafy users notification-preferences get [options]

Show all owner-facing email notification preferences

Options:
  -h, --help  display help for command
```

#### `assinafy users notification-preferences update`

```text
Usage: assinafy users notification-preferences update [options]

Merge one or more owner-facing email notification preferences

Options:
  --set <json>  JSON object mapping notification codes to booleans
  -h, --help    display help for command
```
