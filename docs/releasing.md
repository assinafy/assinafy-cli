# Release runbook

Releases originate from the source GitLab repository. Its push mirror must send
branches and `v*` tags to GitHub; GitHub Release objects are created by
`.github/workflows/release.yml`, not by the mirror.

## One-time repository setup

- Create a protected GitHub environment named `release` for the publish job.
- Configure npm trusted publishing for this GitHub repository, workflow
  `release.yml`, and environment `release`. No long-lived npm token is used.
- Allow the repository `GITHUB_TOKEN` to write GitHub Releases and Packages.
- Enable GitHub immutable releases so published tags and assets cannot be changed.
- Protect `v*` tags and require review on the `release` environment so arbitrary
  commits cannot enter the privileged publish job.
- If policy requires authenticity independent of GitHub Release hosting, configure
  an organization-approved signature or provenance attestation and publish its
  verification procedure. `SHA256SUMS` alone verifies integrity within the same
  release authority, not an independently trusted signer.

## Publish

1. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and
   `npm run pack:release` on the release commit.
2. Set `package.json` to the exact SemVer version and push the matching signed or
   annotated `vX.Y.Z` tag from GitLab.
3. Confirm the GitHub workflow verifies that exact tag/commit, uploads its checked
   artifact, publishes both registries, and only then publishes the draft release.

Prerelease versions advance the `next` registry tag and are not marked as the
latest GitHub release. Stable versions advance `latest`. The workflow compares
SemVer precedence before moving either registry/GitHub pointer; an older backfill
is published under a version-specific `backfill-*` tag. A failed run is safe to
dispatch again with the same tag: existing packages/assets are verified or skipped,
and published GitHub Release assets are never overwritten.

Push one release tag at a time and let its workflow finish before pushing the next.
Same-tag push and recovery runs are serialized. Separate versions do not share a
GitHub concurrency group because that platform drops older pending runs; the publish
job instead fails before mutation if any other release workflow is active. Monotonic
SemVer promotion also prevents a later backfill from moving `latest`/`next` backwards.
Retry the refused tag afterward.
