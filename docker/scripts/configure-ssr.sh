#!/bin/bash
set -euo pipefail

sed -i "s/export const ssr = false;/export const ssr = true;/" src/routes/+layout.ts
sed -i "s/export const prerender = true;/export const prerender = false;/" src/routes/+layout.ts
