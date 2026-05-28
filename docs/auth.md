# `assinafy auth`

## `assinafy auth`

```text
Usage: assinafy auth [options] [command]

Authentication, password management, and personal API keys

Options:
  -h, --help                      display help for command

Commands:
  login [options] <email>         Exchange email + password for a JWT access
                                  token (no existing credentials required)
  social-login [options]          Exchange a provider token for an Assinafy JWT
                                  (no existing credentials required)
  change-password [options]       Change the authenticated user's password
                                  (requires --token or ASSINAFY_TOKEN)
  request-password-reset <email>  Email a password-reset link to the user (no
                                  existing credentials required)
  reset-password [options]        Complete a password reset with the emailed
                                  token (no existing credentials required)
  api-keys                        Manage the current user personal API key
                                  (requires --token or ASSINAFY_TOKEN)
  help [command]                  display help for command
```

### `assinafy auth login`

```text
Usage: assinafy auth login [options] <email>

Exchange email + password for a JWT access token (no existing credentials
required)

Arguments:
  email                  Account email

Options:
  --password <password>  Password (prompted if omitted)
  -h, --help             display help for command
```

### `assinafy auth social-login`

```text
Usage: assinafy auth social-login [options]

Exchange a provider token for an Assinafy JWT (no existing credentials required)

Options:
  --provider <provider>     OAuth provider (e.g. google)
  --provider-token <token>  Provider token
  --accept-terms            Accept the platform terms
  -h, --help                display help for command
```

### `assinafy auth change-password`

```text
Usage: assinafy auth change-password [options]

Change the authenticated user's password (requires --token or ASSINAFY_TOKEN)

Options:
  --email <email>            Account email
  --password <password>      Current password (prompted if omitted)
  --new-password <password>  New password (prompted if omitted)
  -h, --help                 display help for command
```

### `assinafy auth request-password-reset`

```text
Usage: assinafy auth request-password-reset [options] <email>

Email a password-reset link to the user (no existing credentials required)

Arguments:
  email       Account email

Options:
  -h, --help  display help for command
```

### `assinafy auth reset-password`

```text
Usage: assinafy auth reset-password [options]

Complete a password reset with the emailed token (no existing credentials
required)

Options:
  --email <email>            Account email
  --token <token>            Reset token from the email
  --new-password <password>  New password (prompted if omitted)
  -h, --help                 display help for command
```

### `assinafy auth api-keys`

```text
Usage: assinafy auth api-keys [options] [command]

Manage the current user personal API key (requires --token or ASSINAFY_TOKEN)

Options:
  -h, --help           display help for command

Commands:
  create [options]     Generate (and rotate) the current user API key
  get                  Show the masked current API key
  delete|rm [options]  Revoke the current API key
  help [command]       display help for command
```

#### `assinafy auth api-keys create`

```text
Usage: assinafy auth api-keys create [options]

Generate (and rotate) the current user API key

Options:
  --password <password>  Account password (prompted if omitted)
  -h, --help             display help for command
```

#### `assinafy auth api-keys get`

```text
Usage: assinafy auth api-keys get [options]

Show the masked current API key

Options:
  -h, --help  display help for command
```

#### `assinafy auth api-keys delete`

```text
Usage: assinafy auth api-keys delete|rm [options]

Revoke the current API key

Options:
  -y, --yes   Skip the confirmation prompt
  -h, --help  display help for command
```

