# OAuth connections for marketplace apps

Assinafy uses OAuth 2.1 authorization code with mandatory S256 PKCE for public and confidential clients. The SDK implements the four published resource operations plus authorization-server discovery, authorization URL creation, and callback validation. The [official integration guide](https://api.assinafy.com.br/v1/docs) defines the protocol; [api-reference.md](./api-reference.md#oauth) contains the complete published HTTP request and response examples.

Use a separate connection for each customer workspace. An OAuth access token carries the consenting user's permissions, the granted scopes, and exactly one workspace. It never grants billing, workspace creation/deletion, API-key management, or other platform administration. An API key remains available for direct owner integrations. Signer access codes remain a separate authentication mechanism.

Use `oauth.userinfo()` for the consenting user's profile. Production rejects OAuth application tokens for `users.self`, user statistics and notification preferences, workspace statistics, API-key lookup, webhook subscription/delivery/event-type reads, and WhatsApp notification history. These operations require the owner or first-party credential supported by their endpoint. Requesting additional OAuth scopes does not grant access to them.

## Register the application

In Assinafy settings, create an OAuth application with its display name, permitted scopes, and exact HTTPS redirect URIs. Redirects cannot contain fragments. Plain HTTP localhost callbacks are not supported; use an HTTPS development endpoint or tunnel. Public clients omit a secret. Confidential clients keep their secret on the server and use `client_secret_post`, never browser code, a distributed binary, or a repository.

Production endpoints:

| Purpose | URL |
| --- | --- |
| Protected-resource discovery | `https://api.assinafy.com.br/.well-known/oauth-protected-resource` |
| Issuer | `https://auth.assinafy.com.br` |
| Authorization-server discovery | `https://auth.assinafy.com.br/.well-known/oauth-authorization-server` |
| Authorization | `https://auth.assinafy.com.br/oauth/authorize` |
| Token | `https://api.assinafy.com.br/v1/oauth/token` |
| Revocation | `https://api.assinafy.com.br/v1/oauth/revoke` |
| UserInfo | `https://api.assinafy.com.br/v1/oauth/userinfo` |
| Resource indicator | `https://api.assinafy.com.br` |

The resource indicator is an origin, distinct from the SDK `baseUrl`, which includes `/v1`. Discover the issuer and endpoints for the environment you use. A sandbox API-key account does not imply that the same deployment supports OAuth or that production application credentials work there.

## Choose scopes

| Scope | Purpose |
| --- | --- |
| `documents:read` | Read documents and signing state. |
| `documents:write` | Upload and manage documents and request signatures. |
| `templates:read` | Read templates. |
| `templates:write` | Permitted template operations. |
| `account:read` | Read the selected workspace. |
| `openid` | Request OpenID Connect identity and UserInfo. |
| `profile` | Include permitted profile claims. |
| `email` | Include permitted email claims. |
| `offline_access` | Request rotating refresh tokens for background work. |

`oauth connect` requests all nine published scopes by default so the CLI can access documents, templates, the selected workspace, and UserInfo, and obtain refresh tokens. The public application registration must permit all nine. Existing connections need a new authorization with the larger scope set; refreshing an old token does not add permissions. Use `--scope` to explicitly select fewer scopes when needed. For other applications, request only scopes they use. Resource metadata lists API scopes; authorization-server metadata also describes authentication features such as `offline_access`. The returned `scope` string is authoritative for the access token; do not infer granted scopes from what the browser requested. A scope never bypasses a user's role or the token's workspace boundary. Billing, subscriptions, workspace membership, credential management, and administration remain unavailable to OAuth tokens; those CLI operations require the non-OAuth credential documented for each endpoint.

## Discover and start authorization

```ts
import { AssinafyClient } from '@assinafy/cli/api';

const oauthClient = new AssinafyClient({ allowUnauthenticated: true });
const resource = await oauthClient.oauth.metadata();
const server = await oauthClient.oauth.discovery(resource.authorization_servers[0]!);
const request = await oauthClient.oauth.authorize({
  clientId: process.env.ASSINAFY_OAUTH_CLIENT_ID!,
  redirectUri: 'https://example.com/assinafy/callback',
  scopes: ['documents:read', 'documents:write', 'account:read', 'offline_access'],
});
```

`metadata()` has no input or body. Its direct JSON response is:

```json
{
  "resource": "https://api.assinafy.com.br",
  "authorization_servers": ["https://auth.assinafy.com.br"],
  "scopes_supported": ["documents:read", "documents:write", "templates:read", "templates:write", "account:read", "openid", "profile", "email"],
  "bearer_methods_supported": ["header"]
}
```

`discovery(issuer)` has no request body and returns `IOAuthAuthorizationServer`, including:

```json
{
  "issuer": "https://auth.assinafy.com.br",
  "authorization_endpoint": "https://auth.assinafy.com.br/oauth/authorize",
  "token_endpoint": "https://api.assinafy.com.br/v1/oauth/token",
  "revocation_endpoint": "https://api.assinafy.com.br/v1/oauth/revoke",
  "userinfo_endpoint": "https://api.assinafy.com.br/v1/oauth/userinfo",
  "jwks_uri": "https://auth.assinafy.com.br/.well-known/jwks.json",
  "scopes_supported": ["documents:read", "documents:write", "templates:read", "templates:write", "account:read", "openid", "profile", "email", "offline_access"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "none"],
  "authorization_response_iss_parameter_supported": true,
  "client_id_metadata_document_supported": true
}
```

`authorize(options)` performs both discovery requests and returns this complete `IOAuthAuthorizationRequest` shape. Values below are illustrations; each real invocation generates fresh cryptographic randomness. `nonce` is included only when `openid` is requested.

```ts
interface IOAuthAuthorizationRequest {
  authorization_url: string;
  code_verifier: string;
  state: string;
  issuer: string;
  client_id: string;
  redirect_uri: string;
  resource: string;
  nonce?: string;
}
```

The authorization URL contains `response_type=code`, `client_id`, `redirect_uri`, a space-separated `scope`, random `state`, `code_challenge=BASE64URL(SHA256(code_verifier))`, `code_challenge_method=S256`, `resource`, and optional `nonce`. The verifier is 43 base64url characters generated from 32 random bytes. Never put the verifier or client secret in the authorization URL.

Store the entire request server-side in the initiating user's authenticated session with a short expiry. Bind it to that user and consume it once. Redirect the browser to `request.authorization_url`; Assinafy handles login, workspace selection, and consent. The SDK creates protocol values, but does not implement your session store, browser routing, expiry, or single-use consumption.

## Validate the callback and exchange the code

A successful callback includes `code`, `state`, and `iss`:

```text
https://example.com/assinafy/callback?code=example_code&state=example_state&iss=https%3A%2F%2Fauth.assinafy.com.br
```

Load and atomically consume the pending request for the same user. Pass the complete callback URL and stored request to the SDK:

```ts
const tokens = await oauthClient.oauth.exchangeCode(
  callbackUrl,
  pendingRequest,
  process.env.ASSINAFY_OAUTH_CLIENT_SECRET, // undefined for a public app
);
```

`exchangeCode(callbackUrl, request, clientSecret?)` checks the callback origin/path and registered query parameters, rejects duplicate protocol parameters, compares `state` in constant time, and requires the exact stored issuer. It rejects denied authorization before calling the token endpoint. Authorization codes expire after 60 seconds and can be used once. Exchange immediately and never retry a code blindly after a timeout.

An authorization error raises `ValidationError` with a bounded OAuth error code in `errors.oauthError` and the message, without retaining the callback URL. Unrecognized formats become `unknown_error`. For `invalid_scope`, check that the application registration permits every requested scope, including `offline_access`; do not treat the browser return as successful authorization.

For applications that already perform callback validation, `token(payload)` accepts the same complete code grant directly:

```json
{
  "grant_type": "authorization_code",
  "client_id": "example_client_id",
  "client_secret": "example_client_secret",
  "code": "example_authorization_code",
  "redirect_uri": "https://example.com/assinafy/callback",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
  "resource": "https://api.assinafy.com.br"
}
```

The SDK posts JSON. Omit `client_secret` for public clients. `resource` is optional in the token request; if provided, use the authorization resource. A direct `token()` call does not validate a browser callback, state, issuer, or session. The verifier must contain 43–128 RFC 7636 unreserved characters.

Both methods return the direct `IOAuthTokenResponse`, without an Assinafy `{ data }` envelope:

```json
{
  "access_token": "example_access_token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "documents:read documents:write account:read openid profile email",
  "refresh_token": "example_refresh_token",
  "id_token": "example_id_token"
}
```

`refresh_token` is optional and depends on `offline_access`. `id_token` is optional and depends on `openid`. The SDK preserves optional null values from the server. Calculate expiration from the time the token response is received and the returned `expires_in`.

If you use an ID token to establish identity, validate it with an OIDC library using the discovered JWKS: signature, allowed algorithm, issuer, audience, expiry, and the stored nonce. The SDK returns the token; it does not verify JWT signatures or claims. Decoding a JWT is not identity verification.

## Bind the token to its workspace

```ts
const connected = new AssinafyClient({ token: tokens.access_token });
const { data: workspaces } = await connected.workspaces.list();
if (workspaces.length !== 1) throw new Error('Expected one authorized workspace');
const accountId = workspaces[0]!.id;

const workspaceClient = new AssinafyClient({
  token: tokens.access_token,
  accountId,
});
const documents = await workspaceClient.documents.list({ page: 1, per_page: 20 });
```

Persist the workspace ID with the application's tenant/customer ID, issuer, resource, client ID, granted scopes, expiry, and encrypted tokens. Obtain the workspace ID from the authenticated `/accounts` response, not a callback query or an untrusted front end. OAuth `GET /accounts` exposes only the authorized workspace. All data access in a marketplace application must select the connection belonging to the current tenant.

## Refresh without losing the connection

`token(payload)` accepts the refresh grant:

```ts
const next = await oauthClient.oauth.token({
  grant_type: 'refresh_token',
  client_id: process.env.ASSINAFY_OAUTH_CLIENT_ID!,
  client_secret: process.env.ASSINAFY_OAUTH_CLIENT_SECRET,
  refresh_token: storedRefreshToken,
  resource: 'https://api.assinafy.com.br',
});
```

The complete wire body is:

```json
{
  "grant_type": "refresh_token",
  "client_id": "example_client_id",
  "client_secret": "example_client_secret",
  "refresh_token": "example_current_refresh_token",
  "resource": "https://api.assinafy.com.br"
}
```

Its response has the same token shape above, with new access and refresh values. Each successful refresh consumes the previous refresh token. Reusing it revokes the entire connection. Serialize refreshes per connection across every worker and process; atomically store the complete new response before releasing the lock or using it. A lock local to one process is insufficient for a distributed application.

The documented authorization lifetime is 30 days and is not extended by refresh. A transport timeout can leave rotation outcome unknown; do not replay the old token automatically. Mark that connection for recovery/reconnection. On `invalid_grant`, require new consent. The SDK has no automatic refresh or request retry and never persists tokens. Construct a new authenticated `AssinafyClient` with the current access token after rotation.

## UserInfo and disconnect

`userinfo()` uses the current bearer token and requires `openid`; `profile` and `email` control optional claims. It has no request body and returns flat `IOAuthUserInfo`:

```ts
const identity = await new AssinafyClient({ token: tokens.access_token }).oauth.userinfo();
```

```json
{
  "sub": "example_user_id",
  "name": "Example User",
  "email": "user@example.com",
  "email_verified": true
}
```

Only `sub` is mandatory; other claims can be missing or null. Prefer the stable subject over an email address as an identity key, and include the issuer in that key.

To disconnect, `revoke(payload)` posts:

```json
{
  "token": "example_refresh_token",
  "client_id": "example_client_id",
  "client_secret": "example_client_secret",
  "token_type_hint": "refresh_token"
}
```

```ts
await oauthClient.oauth.revoke({
  token: storedRefreshToken,
  client_id: process.env.ASSINAFY_OAUTH_CLIENT_ID!,
  client_secret: process.env.ASSINAFY_OAUTH_CLIENT_SECRET,
  token_type_hint: 'refresh_token',
});
```

`token_type_hint` is optional and accepts `access_token` or `refresh_token`. Successful revocation returns HTTP 200 with no required response body; the SDK resolves to `undefined`. Unknown/already revoked tokens also succeed for an authenticated client. Invalid client authentication returns 401. Revoke the connection before removing local credentials when possible, then mark it disconnected and stop its background work. CLI success prints `{ "revoked": true }`, a local confirmation rather than an API response payload.

## CLI flow

### Automatic browser return

The distributed CLI includes the official **Public** application's client ID, `96BZZ0sZTb2NkEXt1GCaIRCTprI2YKHZr8JDHawuXUyCLC88`. This public identifier is not a secret. The CLI uses PKCE S256 and the scopes `account:read documents:read documents:write templates:read templates:write openid profile email offline_access`; keep the registered permissions consistent with the requested scopes. No client secret is used by `oauth connect`, including when `ASSINAFY_OAUTH_CLIENT_SECRET` is set for another application.

Application maintainers must deploy the callback from `integrations-generic-callback` and register this exact HTTPS URI, without an extension or trailing slash:

```text
https://integrations.assinafy.com.br/assinafy-cli/oauth-callback
```

Leave `ASSINAFY_OAUTH_CLIENT_ID` unset to use the official application. `connect`, `authorize`, `refresh`, and `revoke` resolve the client ID in this order: `--client-id`, `ASSINAFY_OAUTH_CLIENT_ID`, then the bundled ID. Use an override for your own application or another environment, with that application's registered callback and permissions. SDK calls still require an explicit client ID. Use a private directory outside the repository. On POSIX shells:

```bash
umask 077
assinafy oauth connect --json > tokens.json
unset ASSINAFY_API_KEY
export ASSINAFY_TOKEN="$(jq -er '.access_token' tokens.json)"
assinafy workspaces list --json
# Select the single returned workspace as ASSINAFY_ACCOUNT_ID.
assinafy documents list --json
```

`oauth connect` opens the system browser, waits for approval, and prints the complete flat token response described in the token-exchange section above. The authorization URL and browser instructions go to stderr, including with `--json` or `--quiet`; token output goes to stdout. It does not save a profile, persist tokens, or automatically refresh them. On Windows, restrict the output directory ACL before writing credentials.

| Option | Behavior |
| --- | --- |
| `--client-id <id>` | Override the bundled public application ID; takes precedence over `ASSINAFY_OAUTH_CLIENT_ID`. |
| `--redirect-uri <uri>` | Registered HTTPS relay URI; defaults to the extensionless URL above. Query parameters and fragments are unsupported for this browser relay. |
| `--scope '<scopes>'` | Space-separated scopes; defaults to `account:read documents:read documents:write templates:read templates:write openid profile email offline_access`. |
| `--timeout <seconds>` | Browser response deadline, 1–600 seconds; default 180. API calls use the SDK's network timeout. |
| `--no-browser` | Print the authorization URL for manual opening; the local listener still receives the return automatically. |

The browser must run on the same computer as the CLI. A browser on your laptop cannot reach a listener in a remote SSH session or container without deliberate port forwarding; use the manual flow below when appropriate. Ctrl+C cancels and closes the listener. If browser launch is unavailable, open the printed URL on the same computer. An expired authorization code requires a fresh connection attempt; it is never retried automatically.

The callback protocol is:

1. Discover the API resource and issuer, generate a random 32-byte PKCE verifier and state, and bind an ephemeral port on `127.0.0.1` only.
2. Set `state` to `<43-character base64url random value>.<local port>` and send the registered HTTPS `redirect_uri` with the S256 challenge. Keep the verifier in the CLI process.
3. After consent, Assinafy returns `code`, `state`, and `iss` (or `error`) to the HTTPS page. The code is single-use and expires 60 seconds after approval.
4. The standalone page clears its query from browser history, checks the exact state syntax (including rejection of trailing line breaks), port range, issuer allowlist, parameter uniqueness, and exactly one nonblank code or error, then navigates to `http://127.0.0.1:<port>/callback` with only `code`, `state`, `iss`, or `error`.
5. The CLI accepts only GET on `/callback` with the exact loopback Host, the original state, and the discovered issuer. Malformed or unrelated requests do not consume the pending connection. A valid authorization response is accepted once; the browser receives a page clearing its query and directing the user to the terminal.
6. Close the listener and remove its timeout/signal handlers. Reconstruct the response against the saved HTTPS redirect URI and call `oauth.exchangeCode`; the token request still uses that exact HTTPS URI. Tokens and the PKCE verifier are never sent to the callback site.

The local return page uses the logo, colors, Mona Sans fonts, and responsive layout hosted at `https://integrations.assinafy.com.br`. It distinguishes a received response, authorization failure, and invalid return. A received response does not confirm token exchange; check the CLI exit status and output. Browser history is cleared before loading assets, every response sends `Referrer-Policy: no-referrer`, and CSP permits only the fixed history script plus that origin's styles, images, and fonts. No callback parameters are included in the HTML or asset URLs. Public font responses must allow cross-origin loading from the temporary loopback origin.

The shared callback page accepts the production and staging issuers configured by the integration site. A custom issuer needs a compatible relay allowlist as well as `--base-url` and `--redirect-uri`. Do not add access logging, analytics, third-party scripts, or caching to callback routes. Deploy the site and register the application before using the default URL; installing the CLI does not deploy that site.

### Manual authorization and exchange

For a server application or an existing callback handler, provision `ASSINAFY_OAUTH_CLIENT_ID` and, for a confidential app, `ASSINAFY_OAUTH_CLIENT_SECRET` through your secret manager. Use a private directory outside the repository:

```bash
umask 077
assinafy oauth metadata --json
assinafy oauth discovery https://auth.assinafy.com.br --json
assinafy oauth authorize \
  --redirect-uri https://example.com/assinafy/callback \
  --scope 'documents:read documents:write account:read offline_access' \
  --json > pending-request.json
jq -r '.authorization_url' pending-request.json
```

Open the displayed URL and complete consent. Your HTTPS callback handler must capture the complete callback URL and supply it through `ASSINAFY_OAUTH_CALLBACK_URL` in the same private session. Then:

```bash
assinafy oauth exchange --request pending-request.json --json > tokens.json
unset ASSINAFY_API_KEY
export ASSINAFY_TOKEN="$(jq -er '.access_token' tokens.json)"
assinafy workspaces list --json
```

Select the single returned workspace as `ASSINAFY_ACCOUNT_ID`. Remove the consumed pending request. `authorize` does not launch a browser or start a listener; its state format is intended for your own callback, not the integration site's loopback relay.

### Token use and rotation

An API key wins when both credential types are supplied at the same precedence level. A higher-precedence `--token` overrides environment or profile credentials as a group. Avoid leaving a stale `ASSINAFY_API_KEY` in an OAuth session.

Provision the current refresh token as `ASSINAFY_OAUTH_REFRESH_TOKEN`; `assinafy oauth refresh --resource https://api.assinafy.com.br --json` emits the rotated token response. Save to a private new file and atomically replace the previous file only on success. Never launch concurrent refresh commands. Use `ASSINAFY_OAUTH_REVOKE_TOKEN` for `assinafy oauth revoke --token-type-hint refresh_token --json`. For UserInfo, request `openid` during consent and run `assinafy oauth userinfo --json` with the access token.

Request files, callback URLs, token output, and environment variables are sensitive. Protect them using the OS's user-only permissions, keep them out of logs and version control, and remove consumed requests. The CLI's temporary listener serves only a browser handoff; token storage and connection lifecycle remain the caller's responsibility.

## Failures and application lifecycle

| Result | Application behavior |
| --- | --- |
| `400 invalid_grant` | Code expired/used or refresh no longer usable; reconnect rather than retrying the old grant. |
| `401 invalid_client` | Check application type, client ID, client secret, and environment. |
| API `401` | Access token invalid/expired; perform one serialized refresh if the connection is recoverable. |
| `403` with `insufficient_scope` | Read `ApiError.wwwAuthenticate`; obtain consent for the missing scope. |
| Other `403` | Check user role, selected workspace, or a platform-administration restriction. |
| `429` | Respect `ApiError.retryAfter`; retry only operations whose semantics allow it. |
| Network failure on token exchange/refresh | Outcome may be ambiguous; never blindly replay a one-time credential. |

`ApiError.responseData` preserves `{ error, error_description? }` for OAuth failures. `wwwAuthenticate` preserves the Bearer challenge, including `scope` and `resource_metadata` when supplied. JSON CLI errors expose these as `error.details`, `error.wwwAuthenticate`, and `error.retryAfter`. Axios configuration and request credentials are not attached to SDK errors.

Unverified apps are limited to 25 workspaces by the documented platform policy. Complete application verification before wider marketplace distribution. Provide connection status, a user-triggered reconnect/disconnect flow, and tenant-scoped background jobs. Keep secrets on the server, use least-privilege scopes, and require the customer to consent to each connection.
