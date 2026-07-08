#!/bin/sh
# Sync English documentation from a Reticulum-Go checkout into the website.
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
SRC="${RETICULUM_GO_DOCS:-$ROOT/../Reticulum/Reticulum-Go/docs/en}"
DEST="$ROOT/frontend/src/lib/docs"
GH_REPO="${RETICULUM_GO_GITHUB:-https://github.com/Quad4-Software/Reticulum-Go/blob/master}"

if [ ! -d "$SRC" ]; then
	echo "sync-docs.sh: source directory not found: $SRC" >&2
	echo "Set RETICULUM_GO_DOCS to docs/en inside a Reticulum-Go clone." >&2
	exit 1
fi

mkdir -p "$DEST"

for f in "$SRC"/*.md; do
	base=$(basename "$f")
	[ "$base" = "README.md" ] && continue
	cp "$f" "$DEST/$base"
done

for f in "$DEST"/*.md; do
	case "$f" in
		*.*.md) continue ;;
	esac
	sed -i \
		-e 's|\](\([a-z0-9-]*\)\.md\(#\?[a-zA-Z0-9_-]*\)\?)|](/docs/\1\2)|g' \
		-e "s|\](../../README\.md)|](${GH_REPO}/README.md)|g" \
		-e "s|\](../../COMPATIBILITY\.md)|](${GH_REPO}/COMPATIBILITY.md)|g" \
		-e "s|\](../../SECURITY\.md)|](${GH_REPO}/SECURITY.md)|g" \
		-e "s|\](../../LICENSE)|](${GH_REPO}/LICENSE)|g" \
		"$f"
done

echo "Synced $(ls "$DEST"/*.md 2>/dev/null | wc -l) English docs into $DEST"
