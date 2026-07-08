#!/usr/bin/env node
/**
 * Validate website documentation under frontend/src/lib/docs.
 * - Nav slugs in docs-config.ts match markdown files
 * - No orphan English doc pages outside the nav
 * - Internal /docs/ links resolve to known slugs
 * - No unreplaced sibling .md links left from upstream sync
 *
 * Usage: node scripts/check-docs.mjs  (from repository root)
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'frontend/src/lib/docs');
const DOCS_CONFIG = join(ROOT, 'frontend/src/lib/docs-config.ts');

const LEGACY_REDIRECTS = {
	introduction: 'overview',
	usage: 'getting-started'
};

function readNavSlugs() {
	const source = readFileSync(DOCS_CONFIG, 'utf8');
	const slugs = [...source.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
	if (slugs.length === 0) {
		throw new Error('docs-config.ts: no slugs found');
	}
	return slugs;
}

function readEnglishDocSlugs() {
	return readdirSync(DOCS_DIR)
		.filter((name) => name.endsWith('.md') && !/\.[a-z]{2}\.md$/.test(name))
		.map((name) => name.slice(0, -3))
		.sort();
}

function resolveDocSlug(slug) {
	return LEGACY_REDIRECTS[slug] ?? slug;
}

function checkNavAndFiles(navSlugs, fileSlugs) {
	const navSet = new Set(navSlugs);
	const fileSet = new Set(fileSlugs);
	const errors = [];

	for (const slug of navSlugs) {
		if (!fileSet.has(slug)) {
			errors.push(`missing markdown for nav slug: ${slug}`);
		}
	}

	for (const slug of fileSlugs) {
		if (!navSet.has(slug)) {
			errors.push(`orphan doc file not listed in docs-config.ts: ${slug}.md`);
		}
	}

	return errors;
}

function checkDocLinks(navSlugs) {
	const known = new Set(navSlugs);
	const internalLinkRe = /\]\((\/docs\/[a-z0-9-]+)(#[^)]+)?\)/g;
	const rawMdLinkRe = /\]\(([a-z0-9-]+)\.md(#[^)]+)?\)/g;
	const errors = [];

	for (const slug of readdirSync(DOCS_DIR)) {
		if (!slug.endsWith('.md') || /\.[a-z]{2}\.md$/.test(slug)) continue;
		const path = join(DOCS_DIR, slug);
		const content = readFileSync(path, 'utf8');

		for (const match of content.matchAll(internalLinkRe)) {
			const target = resolveDocSlug(match[1].slice('/docs/'.length));
			if (!known.has(target)) {
				errors.push(`${slug}: broken internal link ${match[1]}`);
			}
		}

		for (const match of content.matchAll(rawMdLinkRe)) {
			errors.push(`${slug}: unreplaced markdown link (${match[1]}.md) — run make docs-sync`);
		}
	}

	return errors;
}

function main() {
	if (!existsSync(DOCS_CONFIG)) {
		console.error('check-docs: docs-config.ts not found');
		process.exit(1);
	}
	if (!existsSync(DOCS_DIR)) {
		console.error('check-docs: docs directory not found');
		process.exit(1);
	}

	const navSlugs = readNavSlugs();
	const fileSlugs = readEnglishDocSlugs();
	const errors = [...checkNavAndFiles(navSlugs, fileSlugs), ...checkDocLinks(navSlugs)];

	if (errors.length > 0) {
		console.error(`check-docs: ${errors.length} problem(s):`);
		for (const err of errors) {
			console.error(`  - ${err}`);
		}
		process.exit(1);
	}

	console.log(
		`check-docs: OK (${navSlugs.length} nav slugs, ${fileSlugs.length} English pages, internal links valid)`
	);
}

main();
