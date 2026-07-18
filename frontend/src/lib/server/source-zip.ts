import { access, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { RETICULUM_GO_GITHUB, RETICULUM_GO_SOURCE_ZIP_PATH } from '$lib/source-mirrors';

export { RETICULUM_GO_SOURCE_ZIP_PATH as SOURCE_ZIP_DOWNLOAD_PATH };

const REPO_OWNER = 'Quad4-Software';
const REPO_NAME = 'Reticulum-Go';
const API_BASE = 'https://api.github.com';
const META_FILE = 'meta.json';

export type SourceZipMeta = {
	tag: string;
	fetchedAt: string;
	filename: string;
	bytes: number;
	sourceUrl: string;
};

function cacheDir(): string {
	return process.env.SOURCE_ZIP_CACHE_DIR?.trim() || join(tmpdir(), 'reticulum-go-source-cache');
}

function metaPath(): string {
	return join(cacheDir(), META_FILE);
}

function zipPath(filename: string): string {
	return join(cacheDir(), filename);
}

async function pathExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

export async function getSourceZipMeta(): Promise<SourceZipMeta | null> {
	try {
		const raw = await readFile(metaPath(), 'utf8');
		const meta = JSON.parse(raw) as SourceZipMeta;
		if (!meta?.tag || !meta?.filename) return null;
		if (!(await pathExists(zipPath(meta.filename)))) return null;
		return meta;
	} catch {
		return null;
	}
}

async function fetchLatestTag(): Promise<string | null> {
	try {
		const response = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/tags?per_page=1`, {
			headers: { Accept: 'application/vnd.github+json' },
			signal: AbortSignal.timeout(20_000)
		});
		if (!response.ok) return null;
		const tags = (await response.json()) as Array<{ name?: string }>;
		if (!Array.isArray(tags) || tags.length === 0) return null;
		return tags[0]?.name || null;
	} catch {
		return null;
	}
}

async function downloadZip(tag: string, destPath: string): Promise<number> {
	const sourceUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/zipball/${encodeURIComponent(tag)}`;
	const response = await fetch(sourceUrl, {
		headers: {
			Accept: 'application/vnd.github+json',
			'User-Agent': 'reticulum-go-website-source-cache'
		},
		redirect: 'follow',
		signal: AbortSignal.timeout(180_000)
	});
	if (!response.ok || !response.body) {
		throw new Error(`zip download failed: HTTP ${response.status}`);
	}

	const tmpPath = `${destPath}.partial`;
	const nodeReadable = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream);
	await pipeline(nodeReadable, createWriteStream(tmpPath));
	await rename(tmpPath, destPath);
	const info = await stat(destPath);
	return info.size;
}

let refreshInFlight: Promise<SourceZipMeta | null> | null = null;

/**
 * Ensure a current Reticulum-Go source zip is on disk.
 * Refreshes when missing or when the latest GitHub tag differs.
 */
export async function ensureSourceZip(): Promise<SourceZipMeta | null> {
	if (refreshInFlight) return refreshInFlight;
	refreshInFlight = (async () => {
		try {
			await mkdir(cacheDir(), { recursive: true });
			const tag = await fetchLatestTag();
			if (!tag) {
				console.error('[source-zip] could not resolve latest tag');
				return getSourceZipMeta();
			}

			const existing = await getSourceZipMeta();
			if (existing?.tag === tag && (await pathExists(zipPath(existing.filename)))) {
				return existing;
			}

			const filename = `Reticulum-Go-${tag.replace(/^v/, '')}.zip`;
			const dest = zipPath(filename);
			console.info(`[source-zip] fetching ${tag} into ${dest}`);
			const bytes = await downloadZip(tag, dest);
			const meta: SourceZipMeta = {
				tag,
				fetchedAt: new Date().toISOString(),
				filename,
				bytes,
				sourceUrl: `${RETICULUM_GO_GITHUB}/archive/refs/tags/${tag}.zip`
			};
			await writeFile(metaPath(), JSON.stringify(meta, null, 2) + '\n', 'utf8');
			console.info(`[source-zip] cached ${filename} (${bytes} bytes)`);
			return meta;
		} catch (err) {
			console.error('[source-zip] refresh failed', err);
			return getSourceZipMeta();
		} finally {
			refreshInFlight = null;
		}
	})();
	return refreshInFlight;
}

export async function openSourceZipStream(): Promise<{
	meta: SourceZipMeta;
	stream: ReadableStream<Uint8Array>;
} | null> {
	const meta = (await ensureSourceZip()) ?? (await getSourceZipMeta());
	if (!meta) return null;
	const path = zipPath(meta.filename);
	if (!(await pathExists(path))) return null;
	const nodeStream = createReadStream(path);
	const stream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
	return { meta, stream };
}
