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

For publishing, follow [docs/releasing.md](./docs/releasing.md). Keep changes at the
shared root cause, reuse existing helpers, and include the smallest regression test
that proves non-trivial behavior.
