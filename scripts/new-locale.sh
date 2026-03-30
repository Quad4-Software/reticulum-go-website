#!/bin/sh
# Create a new UI locale file from English. Usage: ./scripts/new-locale.sh <code>

set -e
LANG_CODE="${1:?Usage: $0 <locale-code> (example: fr)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/frontend/src/lib/i18n/locales/en.json"
DST="$ROOT/frontend/src/lib/i18n/locales/${LANG_CODE}.json"
cp "$SRC" "$DST"
echo "Created $DST"
echo "Next: add '${LANG_CODE}' to LOCALES and LOCALE_LABELS in frontend/src/lib/site-config.ts"
