#!/usr/bin/env node
/**
 * Enforces size limits on frontend production build output.
 * Run after `pnpm build` in frontend/ (or set FRONTEND_BUILD_DIR).
 *
 * Env:
 *   FRONTEND_BUILD_DIR  default: <repo>/frontend/build
 *   BUNDLE_BUDGET_TOTAL_MB   default: 28
 *   BUNDLE_BUDGET_MAX_JS_MB    default: 12 (largest single .js asset)
 *
 * Bundled RNode firmware binaries under rnode-firmware/ are excluded from the
 * total. They are intentional static assets, not SPA/WASM bundle growth.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BUILD_DIR = process.env.FRONTEND_BUILD_DIR ?? join(ROOT, 'frontend', 'build');
const MAX_TOTAL_BYTES =
	Number.parseFloat(process.env.BUNDLE_BUDGET_TOTAL_MB ?? '28', 10) * 1024 * 1024;
const MAX_JS_BYTES =
	Number.parseFloat(process.env.BUNDLE_BUDGET_MAX_JS_MB ?? '12', 10) * 1024 * 1024;

function walkFiles(dir, out) {
	let names;
	try {
		names = readdirSync(dir);
	} catch {
		return;
	}
	for (const name of names) {
		const p = join(dir, name);
		let st;
		try {
			st = statSync(p);
		} catch {
			continue;
		}
		if (st.isDirectory()) walkFiles(p, out);
		else out.push({ path: p, size: st.size });
	}
}

/** Firmware blobs shipped for the RNode flasher. Not part of the SPA budget. */
function isExcludedFromTotal(filePath) {
	const norm = filePath.split(sep).join('/');
	return norm.includes('/rnode-firmware/') && norm.endsWith('.bin');
}

function main() {
	const files = [];
	try {
		statSync(BUILD_DIR);
	} catch {
		console.error(`bundle-budget: missing build directory: ${BUILD_DIR}`);
		console.error('Run: cd frontend && pnpm build');
		process.exit(1);
	}
	walkFiles(BUILD_DIR, files);

	let total = 0;
	let excluded = 0;
	let largestJs = { path: '', size: 0 };

	for (const f of files) {
		if (isExcludedFromTotal(f.path)) {
			excluded += f.size;
			continue;
		}
		total += f.size;
		if (f.path.endsWith('.js') && !f.path.endsWith('.map') && f.size > largestJs.size) {
			largestJs = { path: f.path, size: f.size };
		}
	}

	const totalMb = (total / (1024 * 1024)).toFixed(2);
	const maxMb = (MAX_TOTAL_BYTES / (1024 * 1024)).toFixed(1);
	const excludedMb = (excluded / (1024 * 1024)).toFixed(2);
	console.log(`bundle-budget: total ${totalMb} MB (limit ${maxMb} MB)`);
	if (excluded > 0) {
		console.log(
			`bundle-budget: excluded ${excludedMb} MB of rnode-firmware/*.bin (not counted)`
		);
	}
	console.log(
		`bundle-budget: largest .js ${(largestJs.size / (1024 * 1024)).toFixed(2)} MB — ${largestJs.path.replace(ROOT + '/', '')}`
	);

	if (total > MAX_TOTAL_BYTES) {
		console.error(`bundle-budget: FAIL total exceeds ${maxMb} MB`);
		process.exit(1);
	}
	if (largestJs.size > MAX_JS_BYTES) {
		console.error(
			`bundle-budget: FAIL largest .js exceeds ${(MAX_JS_BYTES / (1024 * 1024)).toFixed(0)} MB`
		);
		process.exit(1);
	}
	console.log('bundle-budget: OK');
	process.exit(0);
}

main();
