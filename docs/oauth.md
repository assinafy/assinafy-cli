# `assinafy oauth`

## `assinafy oauth`

```text
Usage: assinafy oauth [options] [command]

OAuth 2.1 authorization, PKCE, token rotation, and OpenID Connect

Options:
  -h, --help           display help for command

Commands:
  connect [options]    Open browser consent for a public OAuth app, receive its
                       loopback return, and print tokens
  metadata             Read protected-resource metadata from the API origin
  discovery <issuer>   Read authorization-server metadata from an HTTPS issuer
  authorize [options]  Create an authorization URL and a sensitive PKCE/state
                       request; save the JSON securely
  exchange [options]   Validate the callback against a saved authorization
                       request and exchange its code
  refresh [options]    Rotate a refresh token once; securely persist the full
                       response before using it
  revoke [options]     Revoke an access or refresh token for this application
  userinfo             Read OIDC claims using --token / ASSINAFY_TOKEN with
                       openid scope
  help [command]       display help for command
```

### `assinafy oauth connect`

```text
Usage: assinafy oauth connect [options]

Open browser consent for a public OAuth app, receive its loopback return, and
print tokens

Options:
  --client-id <id>      OAuth application client ID (default:
                        "96BZZ0sZTb2NkEXt1GCaIRCTprI2YKHZr8JDHawuXUyCLC88", env:
                        ASSINAFY_OAUTH_CLIENT_ID)
  --redirect-uri <uri>  Exactly registered HTTPS relay URI (default:
                        "https://integrations.assinafy.com.br/assinafy-cli/oauth-callback")
  --scope <scopes>      Space-separated scopes; the default requests every
                        published scope (default: "account:read documents:read
                        documents:write templates:read templates:write
                        webhooks:write openid profile email offline_access")
  --timeout <seconds>   Wait for browser consent (1–600 seconds) (default:
                        "180")
  --no-browser          Print the authorization URL without opening the system
                        browser
  -h, --help            display help for command
```

### `assinafy oauth metadata`

```text
Usage: assinafy oauth metadata [options]

Read protected-resource metadata from the API origin

Options:
  -h, --help  display help for command
```

### `assinafy oauth discovery`

```text
Usage: assinafy oauth discovery [options] <issuer>

Read authorization-server metadata from an HTTPS issuer

Arguments:
  issuer      Issuer from protected-resource metadata

Options:
  -h, --help  display help for command
```

### `assinafy oauth authorize`

```text
Usage: assinafy oauth authorize [options]

Create an authorization URL and a sensitive PKCE/state request; save the JSON
securely

Options:
  --client-id <id>      OAuth application client ID (default:
                        "96BZZ0sZTb2NkEXt1GCaIRCTprI2YKHZr8JDHawuXUyCLC88", env:
                        ASSINAFY_OAUTH_CLIENT_ID)
  --redirect-uri <uri>  Exactly registered HTTPS callback URI
  --scope <scopes>      Space-separated scopes; offline_access requests refresh
                        tokens
  -h, --help            display help for command
```

### `assinafy oauth exchange`

```text
Usage: assinafy oauth exchange [options]

Validate the callback against a saved authorization request and exchange its
code

Options:
  --request <path>          Private JSON file returned by oauth authorize
  --callback-url <url>      Complete callback URL with code, state, and iss
                            (env: ASSINAFY_OAUTH_CALLBACK_URL)
  --client-secret <secret>  Confidential application secret; omit for public
                            applications (env: ASSINAFY_OAUTH_CLIENT_SECRET)
  -h, --help                display help for command
```

### `assinafy oauth refresh`

```text
Usage: assinafy oauth refresh [options]

Rotate a refresh token once; securely persist the full response before using it

Options:
  --client-id <id>          OAuth application client ID (default:
                            "96BZZ0sZTb2NkEXt1GCaIRCTprI2YKHZr8JDHawuXUyCLC88",
                            env: ASSINAFY_OAUTH_CLIENT_ID)
  --client-secret <secret>  Confidential application secret; omit for public
                            applications (env: ASSINAFY_OAUTH_CLIENT_SECRET)
  --refresh-token <token>   Current refresh token (env:
                            ASSINAFY_OAUTH_REFRESH_TOKEN)
  --resource <uri>          Resource indicator used during authorization
  -h, --help                display help for command
```

### `assinafy oauth revoke`

```text
Usage: assinafy oauth revoke [options]

Revoke an access or refresh token for this application

Options:
  --client-id <id>          OAuth application client ID (default:
                            "96BZZ0sZTb2NkEXt1GCaIRCTprI2YKHZr8JDHawuXUyCLC88",
                            env: ASSINAFY_OAUTH_CLIENT_ID)
  --client-secret <secret>  Confidential application secret; omit for public
                            applications (env: ASSINAFY_OAUTH_CLIENT_SECRET)
  --revoke-token <token>    Token to revoke (env: ASSINAFY_OAUTH_REVOKE_TOKEN)
  --token-type-hint <type>  Type of token being revoked (choices:
                            "access_token", "refresh_token")
  -h, --help                display help for command
```

### `assinafy oauth userinfo`

```text
Usage: assinafy oauth userinfo [options]

Read OIDC claims using --token / ASSINAFY_TOKEN with openid scope

Options:
  -h, --help  display help for command
```
