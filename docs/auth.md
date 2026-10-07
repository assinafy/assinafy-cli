# `assinafy auth`

## `assinafy auth`

```text
Usage: assinafy auth [options] [command]

Authentication, password management, and personal API keys

Options:
  -h, --help                      display help for command

Commands:
  login [options] <email>         Exchange email + password (and a two-factor
                                  code when enabled) for a JWT access token (no
                                  existing credentials required)
  social-login [options]          Exchange a provider token for an Assinafy JWT
                                  (no existing credentials required)
  link-social-login [options]     Link a Google identity to the authenticated
                                  user
  change-password [options]       Change the authenticated user's password
  request-password-reset <email>  Email a password-reset link to the user (no
                                  existing credentials required)
  reset-password [options]        Complete a password reset with the emailed
                                  token (no existing credentials required)
  api-keys                        Manage the current user personal API key
  mfa                             Two-factor authentication: login verification,
                                  enrollment, and recovery codes
  help [command]                  display help for command
```

### `assinafy auth login`

```text
Usage: assinafy auth login [options] <email>

Exchange email + password (and a two-factor code when enabled) for a JWT access
token (no existing credentials required)

Arguments:
  email                  Account email

Options:
  --password <password>  Password (prompted if omitted) (env: ASSINAFY_PASSWORD)
  --mfa-code <code>      Authenticator or recovery code (prompted if required
                         and omitted) (env: ASSINAFY_MFA_CODE)
  -h, --help             display help for command
```

### `assinafy auth social-login`

```text
Usage: assinafy auth social-login [options]

Exchange a provider token for an Assinafy JWT (no existing credentials required)

Options:
  --provider <provider>     OAuth provider (choices: "google")
  --provider-token <token>  Provider token (env: ASSINAFY_PROVIDER_TOKEN)
  --accept-terms            Accept the platform terms
  -h, --help                display help for command
```

### `assinafy auth link-social-login`

```text
Usage: assinafy auth link-social-login [options]

Link a Google identity to the authenticated user

Options:
  --provider-token <token>  Google identity token (env: ASSINAFY_PROVIDER_TOKEN)
  -h, --help                display help for command
```

### `assinafy auth change-password`

```text
Usage: assinafy auth change-password [options]

Change the authenticated user's password

Options:
  --email <email>            Account email
  --password <password>      Current password (prompted if omitted) (env:
                             ASSINAFY_PASSWORD)
  --new-password <password>  New password (prompted if omitted) (env:
                             ASSINAFY_NEW_PASSWORD)
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
  --reset-token <token>      Reset token from the email (env:
                             ASSINAFY_RESET_TOKEN)
  --new-password <password>  New password (prompted if omitted) (env:
                             ASSINAFY_NEW_PASSWORD)
  -h, --help                 display help for command
```

### `assinafy auth api-keys`

```text
Usage: assinafy auth api-keys [options] [command]

Manage the current user personal API key

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
  --password <password>  Account password (prompted if omitted) (env:
                         ASSINAFY_PASSWORD)
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

### `assinafy auth mfa`

```text
Usage: assinafy auth mfa [options] [command]

Two-factor authentication: login verification, enrollment, and recovery codes

Options:
  -h, --help                      display help for command

Commands:
  verify [options]                Complete a two-factor login with the mfa_token
                                  from login (no existing credentials required)
  list|ls                         List enrolled two-factor methods and remaining
                                  recovery codes
  enroll [options]                Start authenticator enrollment; prints the
                                  one-time secret and provisioning URI
  confirm [options] <methodId>    Activate an enrolled authenticator and print
                                  the one-time recovery codes
  recovery-codes [options]        Issue ten new recovery codes and invalidate
                                  the previous set
  remove|rm [options] <methodId>  Remove a two-factor method (the last one also
                                  discards recovery codes)
  help [command]                  display help for command
```

#### `assinafy auth mfa verify`

```text
Usage: assinafy auth mfa verify [options]

Complete a two-factor login with the mfa_token from login (no existing
credentials required)

Options:
  --mfa-token <token>  Challenge token returned by login (env:
                       ASSINAFY_MFA_TOKEN)
  --mfa-code <code>    Authenticator or recovery code (prompted if required and
                       omitted) (env: ASSINAFY_MFA_CODE)
  -h, --help           display help for command
```

#### `assinafy auth mfa list`

```text
Usage: assinafy auth mfa list|ls [options]

List enrolled two-factor methods and remaining recovery codes

Options:
  -h, --help  display help for command
```

#### `assinafy auth mfa enroll`

```text
Usage: assinafy auth mfa enroll [options]

Start authenticator enrollment; prints the one-time secret and provisioning URI

Options:
  --label <label>  Name for the authenticator
  -h, --help       display help for command
```

#### `assinafy auth mfa confirm`

```text
Usage: assinafy auth mfa confirm [options] <methodId>

Activate an enrolled authenticator and print the one-time recovery codes

Arguments:
  methodId               Method ID returned by enroll

Options:
  --code <code>          Live code from the new authenticator
  --password <password>  Current password (only when replacing a confirmed
                         method) (env: ASSINAFY_PASSWORD)
  --reauth-code <code>   Code from the current authenticator or a recovery code
                         (only when replacing)
  -h, --help             display help for command
```

#### `assinafy auth mfa recovery-codes`

```text
Usage: assinafy auth mfa recovery-codes [options]

Issue ten new recovery codes and invalidate the previous set

Options:
  --password <password>  Current password (env: ASSINAFY_PASSWORD)
  --mfa-code <code>      Authenticator or recovery code (prompted if required
                         and omitted) (env: ASSINAFY_MFA_CODE)
  -h, --help             display help for command
```

#### `assinafy auth mfa remove`

```text
Usage: assinafy auth mfa remove|rm [options] <methodId>

Remove a two-factor method (the last one also discards recovery codes)

Arguments:
  methodId               Method ID

Options:
  --password <password>  Current password (env: ASSINAFY_PASSWORD)
  --mfa-code <code>      Authenticator or recovery code (prompted if required
                         and omitted) (env: ASSINAFY_MFA_CODE)
  -y, --yes              Skip the confirmation prompt
  -h, --help             display help for command
```
