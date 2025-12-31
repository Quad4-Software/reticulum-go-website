#!/bin/bash
set -euo pipefail

cp svelte.config.node.js svelte.config.js

sed -i "s/export const ssr = false;/export const ssr = true;/" src/routes/+layout.ts
sed -i "s/export const prerender = true;/export const prerender = false;/" src/routes/+layout.ts

node -e "
const fs = require('fs');
let content = fs.readFileSync('svelte.config.js', 'utf8');

content = content.replace(
  /entries: \['\*', '\/docs\/introduction', '\/docs\/usage']/,
  'entries: []'
);

content = content.replace(
  /prerender: \{[\s\S]*?\},/,
  'prerender: { entries: [] },'
);

fs.writeFileSync('svelte.config.js', content);
"

