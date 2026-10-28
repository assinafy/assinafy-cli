#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_SHA:?The successful CI commit is required}"
: "${GH_REPO:?The GitHub repository is required}"

if [ "$(git rev-parse HEAD)" != "$RELEASE_SHA" ]; then
  echo "Checkout must match the successful CI commit" >&2
  exit 1
fi
if ! git merge-base --is-ancestor "$RELEASE_SHA" refs/remotes/origin/main; then
  echo "Release commit must be reachable from main" >&2
  exit 1
fi

tag="$(node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';
import { compareSemver } from './scripts/semver-greater.mjs';
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
compareSemver(version, version);
if (lock.version !== version || lock.packages?.['']?.version !== version) {
  throw new Error('Package and lockfile versions must match');
}
if (!readFileSync('CHANGELOG.md', 'utf8').split('\n').some(line => line.startsWith(`## [${version}] - `))) {
  throw new Error('The release version needs a dated changelog entry');
}
process.stdout.write(`v${version}`);
NODE
)"

if git show-ref --verify --quiet "refs/tags/$tag"; then
  if [ "$(git cat-file -t "refs/tags/$tag")" != "tag" ]; then
    echo "Release tags must be annotated or signed" >&2
    exit 1
  fi
  tagged_commit="$(git rev-list -n 1 "refs/tags/$tag")"
  if [ "$tagged_commit" != "$RELEASE_SHA" ]; then
    if ! git merge-base --is-ancestor "$tagged_commit" "$RELEASE_SHA"; then
      echo "Existing release tag is outside this commit's history" >&2
      exit 1
    fi
    echo "$tag already identifies an earlier commit; bump the version for a new release"
    exit 0
  fi
else
  tag_object="$(gh api --method POST "repos/$GH_REPO/git/tags" \
    -f "tag=$tag" -f "message=$tag" -f "object=$RELEASE_SHA" -f type=commit --jq .sha)"
  gh api --method POST "repos/$GH_REPO/git/refs" \
    -f "ref=refs/tags/$tag" -f "sha=$tag_object" >/dev/null
fi

# GITHUB_TOKEN-created tags do not trigger the publisher's push event.
gh workflow run release.yml --repo "$GH_REPO" --ref main --raw-field "tag=$tag"
echo "Started Release for $tag"
