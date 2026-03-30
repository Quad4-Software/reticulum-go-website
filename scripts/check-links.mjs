#!/usr/bin/env node
/**
 * Extracts http(s) URLs from README and frontend sources, then checks they respond.
 * Skips URLs matching scripts/link-check-ignore.txt (substring match).
 * Usage: node scripts/check-links.mjs  (run from repository root)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IGNORE_FILE = join(__dirname, 'link-check-ignore.txt');

const DEFAULT_IGNORE = [
	'schema.org',
	'localhost',
	'127.0.0.1',
	'example.com',
	'placehold',
	'mailto:',
	'data:',
	'javascript:'
];

function loadIgnores() {
	const lines = [...DEFAULT_IGNORE];
	if (existsSync(IGNORE_FILE)) {
		const raw = readFileSync(IGNORE_FILE, 'utf8');
		for (const line of raw.split('\n')) {
			const t = line.trim();
			if (!t || t.startsWith('#')) continue;
			lines.push(t);
		}
	}
	return lines;
}

function shouldSkip(url, ignores) {
	const u = url.toLowerCase();
	return ignores.some((p) => u.includes(p.toLowerCase()));
}

function walkDir(dir, out, skipNames) {
	let names;
	try {
		names = readdirSync(dir);
	} catch {
		return;
	}
	for (const name of names) {
		if (skipNames.has(name)) continue;
		const p = join(dir, name);
		let st;
		try {
			st = statSync(p);
		} catch {
			continue;
		}
		if (st.isDirectory()) walkDir(p, out, skipNames);
		else out.push(p);
	}
}

const URL_RE = /https?:\/\/[^\s\)\]\}'"`>]+/gi;

function normalizeUrl(raw) {
	if (raw.includes('{') || raw.includes('}')) return null;
	let u = raw.replace(/[.,;:)]+$/, '');
	if (u.endsWith('">')) u = u.slice(0, -2);
	return u;
}

function extractUrlsFromFile(path) {
	const text = readFileSync(path, 'utf8');
	const found = new Set();
	let m;
	URL_RE.lastIndex = 0;
	while ((m = URL_RE.exec(text)) !== null) {
		const u = normalizeUrl(m[0]);
		if (!u || !(u.startsWith('http://') || u.startsWith('https://'))) continue;
		found.add(u);
	}
	return [...found];
}

async function probe(url) {
	const timeout = 12_000;
	const signal = AbortSignal.timeout(timeout);
	const base = {
		redirect: 'follow',
		signal,
		headers: { 'User-Agent': 'reticulum-go-link-check/1.0' }
	};
	let res = await fetch(url, { method: 'HEAD', ...base }).catch(() => null);
	if (res && (res.status === 405 || res.status === 501)) {
		res = await fetch(url, { method: 'GET', ...base }).catch(() => null);
	}
	if (!res) return { ok: false, status: 'network error' };
	if (res.status >= 200 && res.status < 400) return { ok: true, status: res.status };
	if (res.status === 403 || res.status === 429) return { ok: true, status: res.status };
	return { ok: false, status: res.status };
}

async function main() {
	const ignores = loadIgnores();
	const files = [];

	for (const rel of ['README.md', 'LICENSE']) {
		const p = join(ROOT, rel);
		if (existsSync(p)) files.push(p);
	}

	const frontendSrc = join(ROOT, 'frontend', 'src');
	const skip = new Set(['node_modules', '.svelte-kit', 'build', 'coverage', 'test-results']);
	walkDir(frontendSrc, files, skip);

	const urlToSources = new Map();
	for (const file of files) {
		let rel = file.replace(ROOT + '/', '');
		for (const u of extractUrlsFromFile(file)) {
			if (shouldSkip(u, ignores)) continue;
			if (!urlToSources.has(u)) urlToSources.set(u, []);
			urlToSources.get(u).push(rel);
		}
	}

	const urls = [...urlToSources.keys()].sort();
	if (urls.length === 0) {
		console.log('check-links: no external URLs to verify.');
		process.exit(0);
	}

	console.log(`check-links: probing ${urls.length} unique URL(s)...\n`);

	const failures = [];
	const concurrency = 5;
	let next = 0;

	async function worker() {
		for (;;) {
			const idx = next++;
			if (idx >= urls.length) return;
			const url = urls[idx];
			const result = await probe(url);
			if (!result.ok) {
				failures.push({ url, ...result, sources: urlToSources.get(url) });
				console.error(`FAIL ${url} (${result.status})`);
				console.error(`  in: ${urlToSources.get(url).join(', ')}`);
			} else {
				console.log(`ok   ${url} [${result.status}]`);
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));

	if (failures.length > 0) {
		console.error(`\ncheck-links: ${failures.length} failure(s).`);
		process.exit(1);
	}
	console.log('\ncheck-links: all URLs responded.');
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
