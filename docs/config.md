# `assinafy config`

## `assinafy config`

```text
Usage: assinafy config [options] [command]

Manage credentials, profiles, and settings

Options:
  -h, --help           display help for command

Commands:
  set [options]        Save credentials/settings into the active profile. Uses
                       the global --api-key, --token, --account-id, --base-url
                       flags plus --webhook-secret.
  get                  Show the effective configuration (secrets masked)
  list|profiles        List configured profiles
  use <profile>        Set the default profile
  remove|rm <profile>  Delete a profile from the config file
  path                 Print the config file path
  help [command]       display help for command
```

### `assinafy config set`

```text
Usage: assinafy config set [options]

Save credentials/settings into the active profile. Uses the global --api-key,
--token, --account-id, --base-url flags plus --webhook-secret.

Options:
  --webhook-secret <secret>  Shared secret for verifying webhooks
  -h, --help                 display help for command
```

### `assinafy config get`

```text
Usage: assinafy config get [options]

Show the effective configuration (secrets masked)

Options:
  -h, --help  display help for command
```

### `assinafy config list`

```text
Usage: assinafy config list|profiles [options]

List configured profiles

Options:
  -h, --help  display help for command
```

### `assinafy config use`

```text
Usage: assinafy config use [options] <profile>

Set the default profile

Arguments:
  profile     Profile name to make default

Options:
  -h, --help  display help for command
```

### `assinafy config remove`

```text
Usage: assinafy config remove|rm [options] <profile>

Delete a profile from the config file

Arguments:
  profile     Profile name to delete

Options:
  -h, --help  display help for command
```

### `assinafy config path`

```text
Usage: assinafy config path [options]

Print the config file path

Options:
  -h, --help  display help for command
```

