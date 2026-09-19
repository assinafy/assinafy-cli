# Contributing

Use Node.js 24 LTS for development; Node.js 22.12 and 26 remain CI compatibility
targets. Install exactly from the lockfile and run the complete local gate:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run verify:bundle
npm run verify:api-docs
```

Run `npm run docs` after CLI help changes and `npm run docs:api` only when syncing
the official OpenAPI reference. Never place credentials, live object IDs, or test
recipient data in fixtures or documentation. Live sandbox testing is opt-in and is
described in `.env.example`; it must not target production.

GitHub's `Sandbox contract` workflow checks the current production OpenAPI and runs
the disposable sandbox lifecycle weekly and on demand. In the GitHub repository's
**Settings → Environments → sandbox → Environment secrets**, configure these four
secrets. The workflow maps them to the script's local environment variables:

| GitHub `sandbox` environment secret | Local script variable |
| --- | --- |
| `ASSINAFY_SANDBOX_API_KEY` | `ASSINAFY_API_KEY` |
| `ASSINAFY_SANDBOX_ACCOUNT_ID` | `ASSINAFY_ACCOUNT_ID` |
| `ASSINAFY_SANDBOX_TEST_EMAIL` | `ASSINAFY_TEST_EMAIL` |
| `ASSINAFY_SANDBOX_TEST_EMAIL_ALT` | `ASSINAFY_TEST_EMAIL_ALT` |

Use a valid sandbox owner API key and a workspace accessible to that key. Both
email recipients must be controlled test addresses. A local `.env` file is not
uploaded to GitHub Actions; configure the secrets separately. The public OAuth
client ID bundled with the CLI does not authenticate this lifecycle test.

To configure secrets with GitHub CLI, run each command and enter the value at its
protected prompt instead of putting it in command arguments:

```bash
gh secret set ASSINAFY_SANDBOX_API_KEY --repo assinafy/assinafy-cli --env sandbox
gh secret set ASSINAFY_SANDBOX_ACCOUNT_ID --repo assinafy/assinafy-cli --env sandbox
gh secret set ASSINAFY_SANDBOX_TEST_EMAIL --repo assinafy/assinafy-cli --env sandbox
gh secret set ASSINAFY_SANDBOX_TEST_EMAIL_ALT --repo assinafy/assinafy-cli --env sandbox
```

Without configuration, an optional local run reports `SKIPPED` and exits zero.
With `ASSINAFY_SANDBOX_REQUIRED=1`, missing or whitespace-only values report
`FAILED` and exit 2. The dependent bundled CLI check runs only after preceding
steps succeed, and the release remains blocked until live verification succeeds.

The live run sends one signing verification-token email and removes its temporary
workspace and resources. A `PASS_WITH_EXCLUSIONS` result is successful only when
every exclusion is an expected
sandbox drift, safety skip, or unavailable optional artifact listed in its summary.

For publishing, follow [docs/releasing.md](./docs/releasing.md). Keep changes at the
shared root cause, reuse existing helpers, and include the smallest regression test
that proves non-trivial behavior.
