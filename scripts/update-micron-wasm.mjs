#!/usr/bin/env node
/**
 * Fetches the latest Micron-Parser-Go release into frontend/static:
 * - micron-parser-go.wasm
 * - micron-wasm_exec.js (from web.zip, must match the WASM Go version)
 * and refreshes frontend/static/wasm-sri.json.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATIC_DIR = path.join(ROOT, 'frontend', 'static');
const WASM_NAME = 'micron-parser-go.wasm';
const WASM_PATH = path.join(STATIC_DIR, WASM_NAME);
const MICRON_EXEC_NAME = 'micron-wasm_exec.js';
const MICRON_EXEC_PATH = path.join(STATIC_DIR, MICRON_EXEC_NAME);
const SRI_PATH = path.join(STATIC_DIR, 'wasm-sri.json');
const RELEASE_API =
	'https://api.github.com/repos/Quad4-Software/Micron-Parser-Go/releases/latest';

const WASM_FILES = ['reticulum-go.wasm', 'micron-parser-go.wasm'];

function sha256Hex(buf) {
	return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha384Sri(buf) {
	const hash = crypto.createHash('sha384').update(buf).digest('base64');
	return `sha384-${hash}`;
}

function writeWasmSriManifest() {
	/** @type {Record<string, { sha256: string, sri: string, bytes: number }>} */
	const assets = {};
	for (const name of WASM_FILES) {
		const filePath = path.join(STATIC_DIR, name);
		if (!fs.existsSync(filePath)) continue;
		const buf = fs.readFileSync(filePath);
		assets[`/${name}`] = {
			sha256: sha256Hex(buf),
			sri: sha384Sri(buf),
			bytes: buf.byteLength
		};
	}
	const payload = {
		updatedAt: new Date().toISOString(),
		assets
	};
	fs.writeFileSync(SRI_PATH, JSON.stringify(payload, null, 2) + '\n');
	console.log(`Wrote ${path.relative(ROOT, SRI_PATH)}`);
	return payload;
}

async function fetchJson(url) {
	const res = await fetch(url, {
		headers: {
			Accept: 'application/vnd.github+json',
			'User-Agent': 'reticulum-go-website-update-micron-wasm'
		}
	});
	if (!res.ok) {
		throw new Error(`GET ${url} failed: HTTP ${res.status}`);
	}
	return res.json();
}

async function fetchBuffer(url) {
	const res = await fetch(url, {
		headers: {
			Accept: 'application/octet-stream',
			'User-Agent': 'reticulum-go-website-update-micron-wasm'
		},
		redirect: 'follow'
	});
	if (!res.ok) {
		throw new Error(`GET ${url} failed: HTTP ${res.status}`);
	}
	return Buffer.from(await res.arrayBuffer());
}

function parseShaSums(text) {
	/** @type {Map<string, string>} */
	const map = new Map();
	for (const line of text.split('\n')) {
		const m = line.trim().match(/^([a-fA-F0-9]{64})\s+(\S+)$/);
		if (m) map.set(m[2], m[1].toLowerCase());
	}
	return map;
}

/**
 * Extract web/wasm_exec.js from the release web.zip via system unzip.
 */
function extractWasmExecFromZip(zipBuf) {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'micron-web-'));
	try {
		const zipPath = path.join(tmp, 'web.zip');
		fs.writeFileSync(zipPath, zipBuf);
		execFileSync('unzip', ['-qo', zipPath, 'web/wasm_exec.js', '-d', tmp], {
			stdio: 'pipe'
		});
		const execPath = path.join(tmp, 'web', 'wasm_exec.js');
		if (!fs.existsSync(execPath)) {
			throw new Error('web.zip missing web/wasm_exec.js');
		}
		return fs.readFileSync(execPath);
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

async function main() {
	fs.mkdirSync(STATIC_DIR, { recursive: true });

	console.log(`Fetching latest release metadata from ${RELEASE_API}`);
	const release = await fetchJson(RELEASE_API);
	const tag = release.tag_name ?? 'unknown';
	const assets = Array.isArray(release.assets) ? release.assets : [];
	const wasmAsset = assets.find((a) => a.name === WASM_NAME);
	if (!wasmAsset?.browser_download_url) {
		throw new Error(`Release ${tag} has no ${WASM_NAME} asset`);
	}

	console.log(`Downloading ${WASM_NAME} (${tag})…`);
	const wasmBuf = await fetchBuffer(wasmAsset.browser_download_url);
	const digest = release.assets?.find((a) => a.name === WASM_NAME)?.digest;
	const expectedFromDigest =
		typeof digest === 'string' && digest.startsWith('sha256:')
			? digest.slice('sha256:'.length).toLowerCase()
			: null;

	const sumsAsset = assets.find((a) => a.name === 'SHASUMS256.txt');
	let expectedFromSums = null;
	if (sumsAsset?.browser_download_url) {
		const sumsText = (await fetchBuffer(sumsAsset.browser_download_url)).toString('utf8');
		expectedFromSums = parseShaSums(sumsText).get(WASM_NAME) ?? null;
	}

	const actual = sha256Hex(wasmBuf);
	const expected = expectedFromDigest ?? expectedFromSums;
	if (expected && actual !== expected) {
		throw new Error(`SHA-256 mismatch for ${WASM_NAME}: expected ${expected}, got ${actual}`);
	}
	if (expected) {
		console.log(`Verified SHA-256 ${actual}`);
	} else {
		console.warn('No release checksum found; writing file with computed hash only');
		console.log(`Computed SHA-256 ${actual}`);
	}

	fs.writeFileSync(WASM_PATH, wasmBuf);
	console.log(`Wrote ${path.relative(ROOT, WASM_PATH)} (${wasmBuf.byteLength} bytes)`);

	const zipAsset = assets.find((a) => a.name === 'web.zip');
	if (!zipAsset?.browser_download_url) {
		throw new Error(`Release ${tag} has no web.zip (needed for matching wasm_exec.js)`);
	}
	console.log('Downloading web.zip for matching wasm_exec.js…');
	const zipBuf = await fetchBuffer(zipAsset.browser_download_url);
	const execBuf = extractWasmExecFromZip(zipBuf);
	fs.writeFileSync(MICRON_EXEC_PATH, execBuf);
	console.log(`Wrote ${path.relative(ROOT, MICRON_EXEC_PATH)} (${execBuf.byteLength} bytes)`);

	const manifest = writeWasmSriManifest();
	const entry = manifest.assets[`/${WASM_NAME}`];
	console.log(`SRI ${entry.sri}`);
	console.log(`Done. Micron WASM + wasm_exec updated to ${tag}.`);
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
