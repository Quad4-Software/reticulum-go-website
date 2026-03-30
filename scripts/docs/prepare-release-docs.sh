#!/bin/sh
# Build per-locale docs zips under releases/ and, in CI, write commit metadata to GITHUB_OUTPUT.
#
# When GITHUB_OUTPUT is set (GitHub Actions / Gitea Actions), requires GITHUB_SHA or GITEA_SHA.
# Local runs: omit GITHUB_OUTPUT; only make docs-zip runs.
set -eu

SHA="${GITHUB_SHA:-${GITEA_SHA:-}}"
OUT="${GITHUB_OUTPUT:-}"
REF_NAME="${GITHUB_REF_NAME:-${GITEA_REF_NAME:-}}"

if [ -n "$OUT" ]; then
	if [ -z "$SHA" ]; then
		echo "prepare-release-docs.sh: GITHUB_OUTPUT set but GITHUB_SHA and GITEA_SHA are empty" >&2
		exit 1
	fi
	FULL_HASH="$SHA"
	COMMIT_MSG=$(git log -1 --format=%B "$SHA" 2>/dev/null || echo "Release ${REF_NAME:-unknown}")
	echo "full_hash=${FULL_HASH}" >> "$OUT"
	echo "commit_msg<<EOF" >> "$OUT"
	echo "$COMMIT_MSG" >> "$OUT"
	echo "EOF" >> "$OUT"
fi

make docs-zip
