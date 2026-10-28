# Release runbook

This repository is hosted directly on GitHub. After a push to `main` passes the
complete CI matrix, `.github/workflows/tag-release.yml` creates an annotated
`v<package.json version>` tag at that exact tested commit and starts
`.github/workflows/release.yml`. Release objects, packages and assets are published
after the release verification job succeeds.

## One-time repository setup

- Create a protected GitHub environment named `release` for the publish job.
- Configure npm trusted publishing for this GitHub repository, workflow
  `release.yml`, and environment `release`. No long-lived npm token is used.
- Allow the repository `GITHUB_TOKEN` to create tags, dispatch Actions workflows,
  and write GitHub Releases and Packages. No additional personal access token is
  required; the workflows request these permissions only in the relevant jobs.
- Enable GitHub immutable releases so published tags and assets cannot be changed.
- Protect `v*` tags against updates and deletion while allowing the tagging
  workflow to create them. Require review on the `release` environment if
  publication needs human approval; without approval rules publication proceeds
  automatically once verification succeeds.
- If policy requires authenticity independent of GitHub Release hosting, configure
  an organization-approved signature or provenance attestation and publish its
  verification procedure. `SHA256SUMS` alone verifies integrity within the same
  release authority, not an independently trusted signer.

## Publish

1. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`,
   `npm run docs:api`, `npm run verify:api-docs`, and `npm run pack:release` on
   the release commit. Commit the generated API reference when the official
   contract changes.
2. Use `npm version patch --no-git-tag-version` or
   `npm version minor --no-git-tag-version` to update both package files. Add a
   dated changelog entry for that version and commit the changes to `main` through
   the repository's normal review process. Push `main`; no local release tag is
   needed for new versions.
3. Confirm `CI` succeeds, `Tag Release` creates the annotated tag and starts
   `Release`, and `Release` verifies that exact tag/commit, uploads its checked
   artifact, publishes both registries, and then publishes the draft release.

The automatic tagging job accepts only successful push runs of `CI` on this
repository's `main`; pull requests, failed CI and manually dispatched CI do not
release. The package and lockfile versions must agree and have a dated changelog
entry. A version already tagged on an earlier ancestor is skipped. Re-running
the successful CI for the same tagged commit resumes publication without moving
the tag. Conflicting or lightweight tags fail without overwriting them.

The tagging job explicitly dispatches `release.yml`, because tags created with
`GITHUB_TOKEN` do not start another workflow through its `push` trigger. The
publisher retains tag-push and manual-dispatch support for existing tags and
recovery. If a release tag was already prepared locally before enabling automatic
tagging, push `main` and that annotated tag together with
`git push --atomic origin main vX.Y.Z`; its original target remains unchanged.

The `publish` job depends on `verify`, which runs the automated SDK and CLI tests,
type and lint checks, current public production API contract check, generated-file
checks, packaged consumer checks, installer checks, and reproducible archive and
checksum validation. It then uploads one verified payload for publication. Tests
use controlled transports and local servers; verification requires no Assinafy
account credentials. Publishing retains its protected `release` environment and
registry authentication.

Prerelease versions advance the `next` registry tag and are not marked as the
latest GitHub release. Stable versions advance `latest`. The workflow compares
SemVer precedence before moving either registry/GitHub pointer; an older backfill
is published under a version-specific `backfill-*` tag. A failed run is safe to
dispatch again with the same tag: existing packages/assets are verified or skipped,
and published GitHub Release assets are never overwritten.

Merge one release version at a time and let its workflow finish before the next.
Same-tag push and recovery runs are serialized. Separate versions do not share a
GitHub concurrency group because that platform drops older pending runs; the publish
job instead fails before mutation if any other release workflow is active. Monotonic
SemVer promotion also prevents a later backfill from moving `latest`/`next` backwards.
Retry the refused tag afterward with
`gh workflow run release.yml --ref main -f tag=vX.Y.Z`. This also resumes a release
if tag creation succeeded but dispatch or publication failed.
