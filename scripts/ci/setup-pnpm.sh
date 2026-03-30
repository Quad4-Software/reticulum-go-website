#!/bin/sh
# Enable corepack and activate the pnpm version pinned in frontend/package.json (packageManager).
set -eu

PNPM_VERSION="${PNPM_VERSION:-10.32.1}"

export PATH="/usr/local/bin:$PATH"
corepack enable
corepack prepare "pnpm@${PNPM_VERSION}" --activate
pnpm --version
