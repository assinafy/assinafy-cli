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
recipient data in fixtures or documentation.

`npm test` exercises SDK requests and responses, validation, CLI behavior, and
OAuth callbacks using controlled transports, synthetic data, and local loopback
servers. These checks require no Assinafy credentials. Release verification also
checks the current public production API documentation, generated files, packaged
CLI and SDK consumers, installers, reproducible archives, and checksums before
publishing the verified artifacts.

For publishing, follow [docs/releasing.md](./docs/releasing.md). Keep changes at the
shared root cause, reuse existing helpers, and include the smallest regression test
that proves non-trivial behavior.
