#!/usr/bin/env node
/**
 * Sync real RNode firmware builds into frontend/static/rnode-firmware.
 *
 * Downloads curated board packages from the latest Official and
 * microReticulum_Firmware GitHub releases, extracts the main firmware
 * .bin for each board, and writes catalog.json with checksums.
 * Tiny-Reticulum-Go remains a coming-soon catalog slot until artifacts exist.
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'frontend/static/rnode-firmware');
const CATALOG_PATH = path.join(OUT_DIR, 'catalog.json');

const OFFICIAL_REPO = 'markqvist/RNode_Firmware';
const MICRO_REPO = 'attermann/microReticulum_Firmware';

/** Boards mirrored for offline flasher use. */
const BOARD_PACKAGES = [
	{
		asset: 'rnode_firmware_heltec32v3.zip',
		binName: 'rnode_firmware_heltec32v3.bin',
		boardId: 'heltec-v3',
		boardLabel: 'Heltec WiFi LoRa 32 V3',
		chip: 'esp32s3'
	},
	{
		asset: 'rnode_firmware_heltec32v2.zip',
		binName: 'rnode_firmware_heltec32v2.bin',
		boardId: 'heltec-v2',
		boardLabel: 'Heltec WiFi LoRa 32 V2',
		chip: 'esp32'
	},
	{
		asset: 'rnode_firmware_tbeam.zip',
		binName: 'rnode_firmware_tbeam.bin',
		boardId: 'tbeam',
		boardLabel: 'LilyGO T-Beam',
		chip: 'esp32'
	},
	{
		asset: 'rnode_firmware_tdeck.zip',
		binName: 'rnode_firmware_tdeck.bin',
		boardId: 't-deck',
		boardLabel: 'LilyGO T-Deck',
		chip: 'esp32s3'
	},
	{
		asset: 'rnode_firmware_rak4631.zip',
		binName: 'rnode_firmware_rak4631.bin',
		boardId: 'rak4631',
		boardLabel: 'RAK4631',
		chip: 'nrf52'
	},
	{
		asset: 'rnode_firmware_techo.zip',
		binName: 'rnode_firmware_techo.bin',
		boardId: 't-echo',
		boardLabel: 'LilyGO T-Echo',
		chip: 'nrf52'
	},
	{
		asset: 'rnode_firmware_esp32_generic.zip',
		binName: 'rnode_firmware_esp32_generic.bin',
		boardId: 'generic-esp32',
		boardLabel: 'Generic ESP32',
		chip: 'esp32'
	}
];

const GH_HEADERS = {
	Accept: 'application/vnd.github+json',
	'User-Agent': 'rnode-firmware-sync'
};

/**
 * @param {Uint8Array | Buffer} data
 */
function sha256Hex(data) {
	return createHash('sha256').update(data).digest('hex');
}

/**
 * @param {string} url
 */
async function fetchBytes(url) {
	const res = await fetch(url, { headers: GH_HEADERS });
	if (!res.ok) throw new Error(`GET ${url} failed: HTTP ${res.status}`);
	return Buffer.from(await res.arrayBuffer());
}

/**
 * @param {string} repo
 */
async function fetchLatestRelease(repo) {
	const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
		headers: GH_HEADERS
	});
	if (!res.ok) throw new Error(`Latest release for ${repo} failed: HTTP ${res.status}`);
	return res.json();
}

/**
 * @param {Buffer} zipBytes
 * @param {string} wantedName
 */
async function extractBinFromZip(zipBytes, wantedName) {
	const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'rnode-fw-'));
	const zipPath = path.join(tmpRoot, 'pkg.zip');
	try {
		await fs.writeFile(zipPath, zipBytes);
		const listed = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });
		if (listed.status !== 0) {
			throw new Error(listed.stderr || 'unzip -Z1 failed');
		}
		const names = listed.stdout.split('\n').map((s) => s.trim()).filter(Boolean);
		const match =
			names.find((n) => n === wantedName) ||
			names.find((n) => n.endsWith(`/${wantedName}`)) ||
			names.find((n) => path.basename(n) === wantedName);
		if (!match) {
			throw new Error(
				`Missing ${wantedName} in zip. bins: ${names.filter((n) => n.endsWith('.bin')).join(', ') || '(none)'}`
			);
		}
		const extracted = spawnSync('unzip', ['-p', zipPath, match], { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 });
		if (extracted.status !== 0) {
			throw new Error(extracted.stderr?.toString() || `unzip -p ${match} failed`);
		}
		return Buffer.from(extracted.stdout);
	} finally {
		await fs.rm(tmpRoot, { recursive: true, force: true });
	}
}

/**
 * @param {string} dir
 */
async function wipeFirmwareBins(dir) {
	await fs.mkdir(dir, { recursive: true });
	const names = await fs.readdir(dir);
	for (const name of names) {
		if (name.endsWith('.bin') || name.endsWith('.zip')) {
			await fs.unlink(path.join(dir, name));
		}
	}
}

/**
 * @param {object} release
 * @param {'official' | 'microreticulum'} source
 * @param {string} outDir
 * @param {string} version
 */
async function syncSource(release, source, outDir, version) {
	/** @type {import('../frontend/src/lib/rnode-flasher/types').CatalogEntry[]} */
	const entries = [];
	/** @type {Array<{ name: string, browser_download_url: string }>} */
	const assets = release.assets ?? [];
	const byName = new Map(assets.map((a) => [a.name, a]));

	await wipeFirmwareBins(outDir);

	for (const board of BOARD_PACKAGES) {
		const asset = byName.get(board.asset);
		if (!asset) {
			console.warn(`Skip ${source}/${board.asset}: not in release ${version}`);
			continue;
		}
		process.stdout.write(`Downloading ${source}/${board.asset}...\n`);
		const zipBytes = await fetchBytes(asset.browser_download_url);
		const binBytes = await extractBinFromZip(zipBytes, board.binName);
		const outName = board.binName;
		const outPath = path.join(outDir, outName);
		await fs.writeFile(outPath, binBytes);
		const sha256 = sha256Hex(binBytes);
		const rel = path.posix.join(source === 'official' ? 'official' : 'microreticulum', outName);
		entries.push({
			id: `${source}-${board.boardId}`,
			name: outName,
			source,
			version,
			boardId: board.boardId,
			boardLabel: board.boardLabel,
			chip: board.chip,
			path: rel,
			sha256,
			available: true,
			comingSoon: false
		});
		console.log(`  wrote ${rel} (${binBytes.byteLength} bytes)`);
	}
	return entries;
}

async function main() {
	await fs.mkdir(path.join(OUT_DIR, 'official'), { recursive: true });
	await fs.mkdir(path.join(OUT_DIR, 'microreticulum'), { recursive: true });

	const officialRelease = await fetchLatestRelease(OFFICIAL_REPO);
	const microRelease = await fetchLatestRelease(MICRO_REPO);
	const officialTag = String(officialRelease.tag_name ?? 'unknown');
	const microTag = String(microRelease.tag_name ?? 'unknown');

	const official = await syncSource(
		officialRelease,
		'official',
		path.join(OUT_DIR, 'official'),
		officialTag
	);
	const micro = await syncSource(
		microRelease,
		'microreticulum',
		path.join(OUT_DIR, 'microreticulum'),
		microTag
	);

	/** @type {import('../frontend/src/lib/rnode-flasher/types').CatalogEntry[]} */
	const entries = [
		...official,
		...micro,
		{
			id: 'tiny-reticulum-go-placeholder',
			name: 'Tiny-Reticulum-Go',
			source: 'tiny-reticulum-go',
			version: 'pending',
			boardId: 'generic-esp32',
			boardLabel: 'Generic ESP32',
			chip: 'esp32',
			path: '',
			sha256: '',
			available: false,
			comingSoon: true
		}
	];

	const catalog = {
		generatedAt: new Date().toISOString(),
		sources: {
			official: { repo: OFFICIAL_REPO, latestTag: officialTag },
			microreticulum: { repo: MICRO_REPO, latestTag: microTag },
			tinyReticulumGo: { status: 'coming-soon' }
		},
		entries
	};

	await fs.writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
	console.log(
		`Wrote ${entries.length} catalog entries (${official.length} official, ${micro.length} micro) to ${path.relative(ROOT, CATALOG_PATH)}`
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
