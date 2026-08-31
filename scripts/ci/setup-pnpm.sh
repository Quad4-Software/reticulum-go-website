#!/bin/sh
# Enable corepack and activate the pnpm version pinned in frontend/package.json (packageManager).
# Shims go under a user-writable bin dir so CI runners without write access to /usr/local/bin work.
set -eu

PNPM_VERSION="${PNPM_VERSION:-11.10.0}"
PNPM_BIN_DIR="${PNPM_BIN_DIR:-${HOME}/.local/bin}"

mkdir -p "${PNPM_BIN_DIR}"
export PATH="${PNPM_BIN_DIR}:/usr/local/bin:${PATH}"

corepack enable --install-directory "${PNPM_BIN_DIR}"
corepack prepare "pnpm@${PNPM_VERSION}" --activate

if [ -n "${GITHUB_PATH:-}" ]; then
	echo "${PNPM_BIN_DIR}" >> "${GITHUB_PATH}"
fi
if [ -n "${GITHUB_ENV:-}" ]; then
	echo "PATH=${PNPM_BIN_DIR}:/usr/local/bin:${PATH}" >> "${GITHUB_ENV}"
fi

pnpm --version
