/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BUILD_DIR = 'build';
const MANIFEST_FILE = path.join(BUILD_DIR, 'sri-manifest.json');

const manifest = {};

function calculateSRI(filePath) {
	const fileBuffer = fs.readFileSync(filePath);
	const hash = crypto.createHash('sha384').update(fileBuffer).digest('base64');
	return `sha384-${hash}`;
}

function processHtmlFile(filePath) {
	let content = fs.readFileSync(filePath, 'utf8');
	let modified = false;

	// Process scripts
	content = content.replace(
		/<script\s+([\s\S]*?)src=["'](.+?)["']([\s\S]*?)><\/script>/gi,
		(match, before, src, after) => {
			if (src.startsWith('http') || src.startsWith('//')) return match;

			const assetPath = path.join(BUILD_DIR, src.startsWith('/') ? src.slice(1) : src);

			if (fs.existsSync(assetPath)) {
				const sri = calculateSRI(assetPath);
				modified = true;
				const cleanBefore = before
					.replace(/\s+integrity=["'].*?["']/g, '')
					.replace(/\s+crossorigin=["'].*?["']/g, '');
				return `<script ${cleanBefore}src="${src}" integrity="${sri}" crossorigin="anonymous"${after}></script>`;
			}
			return match;
		}
	);

	// Process links (stylesheets)
	content = content.replace(
		/<link\s+([\s\S]*?)href=["'](.+?)["']([\s\S]*?)>/gi,
		(match, before, href, after) => {
			if (href.startsWith('http') || href.startsWith('//')) return match;

			if (
				!before.includes('rel="stylesheet"') &&
				!after.includes('rel="stylesheet"') &&
				!before.includes("rel='stylesheet'") &&
				!after.includes("rel='stylesheet'")
			) {
				return match;
			}

			const assetPath = path.join(BUILD_DIR, href.startsWith('/') ? href.slice(1) : href);

			if (fs.existsSync(assetPath)) {
				const sri = calculateSRI(assetPath);
				modified = true;
				const cleanBefore = before
					.replace(/\s+integrity=["'].*?["']/g, '')
					.replace(/\s+crossorigin=["'].*?["']/g, '');
				return `<link ${cleanBefore}href="${href}" integrity="${sri}" crossorigin="anonymous"${after}>`;
			}
			return match;
		}
	);

	if (modified) {
		fs.writeFileSync(filePath, content);
	}
}

function walkDir(dir, callback) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			walkDir(filePath, callback);
		} else {
			callback(filePath);
		}
	}
}

console.log('Generating Subresource Integrity (SRI) hashes...');
if (fs.existsSync(BUILD_DIR)) {
	// First pass: generate hashes for all files for the manifest
	walkDir(BUILD_DIR, (filePath) => {
		const relativePath = '/' + path.relative(BUILD_DIR, filePath).replace(/\\/g, '/');
		manifest[relativePath] = calculateSRI(filePath);
	});

	// Second pass: update HTML files with SRI attributes
	walkDir(BUILD_DIR, (filePath) => {
		if (filePath.endsWith('.html')) {
			processHtmlFile(filePath);
		}
	});

	fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
	console.log(`SRI manifest created: ${MANIFEST_FILE}`);

	const wasmAssets = {};
	walkDir(BUILD_DIR, (filePath) => {
		if (!filePath.endsWith('.wasm')) return;
		const relativePath = '/' + path.relative(BUILD_DIR, filePath).replace(/\\/g, '/');
		const buf = fs.readFileSync(filePath);
		const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
		const sri = calculateSRI(filePath);
		wasmAssets[relativePath] = { sha256, sri, bytes: buf.byteLength };
		manifest[relativePath] = sri;
	});

	const reticulum = wasmAssets['/reticulum-go.wasm'];
	const wasmVersionPath = path.join(BUILD_DIR, 'wasm-version.json');
	fs.writeFileSync(
		wasmVersionPath,
		JSON.stringify(
			{
				sha256: reticulum?.sha256 ?? null,
				assets: wasmAssets
			},
			null,
			2
		)
	);
	console.log(`WASM version file created: ${wasmVersionPath}`);

	const wasmSriPath = path.join(BUILD_DIR, 'wasm-sri.json');
	fs.writeFileSync(
		wasmSriPath,
		JSON.stringify(
			{
				updatedAt: new Date().toISOString(),
				assets: Object.fromEntries(
					Object.entries(wasmAssets).map(([p, meta]) => [
						p,
						{ sha256: meta.sha256, sri: meta.sri, bytes: meta.bytes }
					])
				)
			},
			null,
			2
		)
	);
	console.log(`WASM SRI file created: ${wasmSriPath}`);

	fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

	console.log('SRI generation complete.');
} else {
	console.error(`Build directory "${BUILD_DIR}" not found.`);
	process.exit(1);
}
