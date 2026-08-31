import {
	access,
	mkdir,
	readFile,
	rename,
	rm,
	stat,
	writeFile
} from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { dirname, join, normalize, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import JSZip from 'jszip';
import {
	RETICULUM_MIRROR_PATH,
	RETICULUM_UPSTREAM,
	RETICULUM_WEBSITE_REPO
} from '$lib/reticulum-mirror';

const REPO_OWNER = 'markqvist';
const REPO_NAME = 'reticulum_website';
const API_BASE = 'https://api.github.com';
const BRANCH = 'master';
const META_FILE = 'meta.json';
const SITE_DIR = 'site';

export type ReticulumSiteMirrorMeta = {
	sha: string;
	fetchedAt: string;
	fileCount: number;
	bytes: number;
	sourceUrl: string;
	upstream: string;
	repo: string;
};

const MIME_BY_EXT: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.htm': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.pdf': 'application/pdf',
	'.epub': 'application/epub+zip',
	'.txt': 'text/plain; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.map': 'application/json',
	'.wasm': 'application/wasm'
};

function cacheDir(): string {
	return (
		process.env.RETICULUM_SITE_MIRROR_CACHE_DIR?.trim() ||
		join(tmpdir(), 'reticulum-site-mirror-cache')
	);
}

function metaPath(): string {
	return join(cacheDir(), META_FILE);
}

function siteRoot(): string {
	return join(cacheDir(), SITE_DIR);
}

async function pathExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

export async function getReticulumSiteMirrorMeta(): Promise<ReticulumSiteMirrorMeta | null> {
	try {
		const raw = await readFile(metaPath(), 'utf8');
		const meta = JSON.parse(raw) as ReticulumSiteMirrorMeta;
		if (!meta?.sha || !(await pathExists(siteRoot()))) return null;
		return meta;
	} catch {
		return null;
	}
}

async function fetchBranchSha(): Promise<string | null> {
	try {
		const response = await fetch(
			`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}?per_page=1`,
			{
				headers: {
					Accept: 'application/vnd.github+json',
					'User-Agent': 'reticulum-go-website-reticulum-mirror'
				},
				signal: AbortSignal.timeout(30_000)
			}
		);
		if (!response.ok) return null;
		const body = (await response.json()) as { sha?: string };
		return typeof body.sha === 'string' ? body.sha : null;
	} catch {
		return null;
	}
}

async function downloadZipball(destPath: string): Promise<void> {
	const sourceUrl = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/zipball/${BRANCH}`;
	const response = await fetch(sourceUrl, {
		headers: {
			Accept: 'application/vnd.github+json',
			'User-Agent': 'reticulum-go-website-reticulum-mirror'
		},
		redirect: 'follow',
		signal: AbortSignal.timeout(300_000)
	});
	if (!response.ok || !response.body) {
		throw new Error(`reticulum site zipball failed: HTTP ${response.status}`);
	}
	const tmpPath = `${destPath}.partial`;
	const nodeReadable = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream);
	await pipeline(nodeReadable, createWriteStream(tmpPath));
	await rename(tmpPath, destPath);
}

/**
 * Extract docs/ (built site + manuals) and root LICENSE into the mirror cache.
 */
async function extractSiteFromZip(zipPath: string, destRoot: string): Promise<{
	fileCount: number;
	bytes: number;
}> {
	const zip = await JSZip.loadAsync(await readFile(zipPath));
	const names = Object.keys(zip.files);
	const docsPrefix = names
		.map((name) => {
			const match = name.match(/^[^/]+\/docs\//);
			return match ? match[0] : null;
		})
		.find((prefix): prefix is string => Boolean(prefix));
	if (!docsPrefix) {
		throw new Error('reticulum site zipball missing docs/ tree');
	}

	const licenseEntry = names.find((name) => /^[^/]+\/LICENSE$/.test(name));
	await mkdir(destRoot, { recursive: true });

	let fileCount = 0;
	let bytes = 0;

	for (const name of names) {
		const entry = zip.files[name];
		if (!entry || entry.dir) continue;

		let rel: string | null = null;
		if (name.startsWith(docsPrefix)) {
			rel = name.slice(docsPrefix.length);
		} else if (licenseEntry && name === licenseEntry) {
			rel = 'LICENSE';
		}
		if (!rel || rel === '.nojekyll' || rel === 'CNAME') continue;
		if (rel.includes('..') || rel.startsWith('/') || rel.includes('\0')) continue;

		const outPath = join(destRoot, rel);
		await mkdir(dirname(outPath), { recursive: true });
		const data = await entry.async('nodebuffer');
		await writeFile(outPath, data);
		fileCount += 1;
		bytes += data.byteLength;
	}

	if (fileCount === 0) {
		throw new Error('reticulum site zipball extracted zero files');
	}
	return { fileCount, bytes };
}

let refreshInFlight: Promise<ReticulumSiteMirrorMeta | null> | null = null;

/**
 * Ensure the reticulum.network website mirror is on disk.
 * Refreshes when missing or when master SHA differs.
 */
export async function ensureReticulumSiteMirror(): Promise<ReticulumSiteMirrorMeta | null> {
	if (refreshInFlight) return refreshInFlight;
	refreshInFlight = (async () => {
		try {
			await mkdir(cacheDir(), { recursive: true });
			const sha = await fetchBranchSha();
			if (!sha) {
				console.error('[reticulum-mirror] could not resolve master SHA');
				return getReticulumSiteMirrorMeta();
			}

			const existing = await getReticulumSiteMirrorMeta();
			if (existing?.sha === sha && (await pathExists(join(siteRoot(), 'index.html')))) {
				return existing;
			}

			const zipPath = join(cacheDir(), `reticulum_website-${sha.slice(0, 12)}.zip`);
			console.info(`[reticulum-mirror] fetching ${BRANCH}@${sha.slice(0, 12)} into ${zipPath}`);
			await downloadZipball(zipPath);

			const nextRoot = join(cacheDir(), `site-${sha.slice(0, 12)}`);
			await rm(nextRoot, { recursive: true, force: true });
			const { fileCount, bytes } = await extractSiteFromZip(zipPath, nextRoot);

			const liveRoot = siteRoot();
			await rm(liveRoot, { recursive: true, force: true });
			await rename(nextRoot, liveRoot);
			await rm(zipPath, { force: true });

			const meta: ReticulumSiteMirrorMeta = {
				sha,
				fetchedAt: new Date().toISOString(),
				fileCount,
				bytes,
				sourceUrl: `${RETICULUM_WEBSITE_REPO}/tree/${sha}`,
				upstream: RETICULUM_UPSTREAM,
				repo: RETICULUM_WEBSITE_REPO
			};
			await writeFile(metaPath(), JSON.stringify(meta, null, 2) + '\n', 'utf8');
			console.info(
				`[reticulum-mirror] cached ${fileCount} files (${bytes} bytes) at ${liveRoot}`
			);
			return meta;
		} catch (err) {
			console.error('[reticulum-mirror] refresh failed', err);
			return getReticulumSiteMirrorMeta();
		} finally {
			refreshInFlight = null;
		}
	})();
	return refreshInFlight;
}

function mimeForPath(filePath: string): string {
	const lower = filePath.toLowerCase();
	const dot = lower.lastIndexOf('.');
	if (dot === -1) return 'application/octet-stream';
	return MIME_BY_EXT[lower.slice(dot)] ?? 'application/octet-stream';
}

/**
 * Resolve a request path under the mirror root. Rejects traversal.
 */
export function resolveMirrorFilePath(requestPath: string): string | null {
	const trimmed = requestPath.replace(/^\/+/, '').replace(/\\/g, '/');
	const candidate = trimmed === '' || trimmed.endsWith('/') ? `${trimmed}index.html` : trimmed;
	const normalized = normalize(candidate);
	if (normalized.startsWith('..') || normalized.includes(`..${sep}`) || normalized.includes('\0')) {
		return null;
	}
	const root = siteRoot();
	const full = join(root, normalized);
	const rel = relative(root, full);
	if (rel.startsWith('..') || rel.includes(`..${sep}`)) return null;
	return full;
}

export function mirrorBaseHref(requestPath: string): string {
	const trimmed = requestPath.replace(/^\/+/, '').replace(/\\/g, '/');
	if (!trimmed || trimmed.endsWith('/')) {
		return `${RETICULUM_MIRROR_PATH}/`;
	}
	const slash = trimmed.lastIndexOf('/');
	if (slash === -1) {
		return `${RETICULUM_MIRROR_PATH}/`;
	}
	return `${RETICULUM_MIRROR_PATH}/${trimmed.slice(0, slash + 1)}`;
}

export function mirrorBannerHtml(canonicalPath: string): string {
	const canonical = `${RETICULUM_UPSTREAM}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath || '/'}`;
	return `<aside id="rgo-mirror-banner" role="note" style="position:sticky;top:0;z-index:9999;margin:0;padding:0.35rem 0.75rem;font:13px/1.35 system-ui,sans-serif;background:#161f27;color:#dbdbdb;border-bottom:1px solid #2a3644;text-align:center">Unofficial mirror of <a href="${canonical}" style="color:#41adff">reticulum.network</a> · Source <a href="${RETICULUM_WEBSITE_REPO}" style="color:#41adff">markqvist/reticulum_website</a> · Served at ${RETICULUM_MIRROR_PATH} by Reticulum-Go</aside>`;
}

export function injectMirrorBase(html: string, requestPath: string): string {
	const base = mirrorBaseHref(requestPath);
	const tag = `<base href="${base}">`;
	if (/<base\s[^>]*href=/i.test(html)) {
		return html.replace(/<base\s[^>]*>/i, tag);
	}
	if (/<head[^>]*>/i.test(html)) {
		return html.replace(/<head([^>]*)>/i, `<head$1>${tag}`);
	}
	return tag + html;
}

export function injectMirrorBanner(html: string, requestPath: string): string {
	const banner = mirrorBannerHtml(requestPath || '/');
	if (/<body[^>]*>/i.test(html)) {
		return html.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
	}
	return banner + html;
}

export function prepareMirrorHtml(html: string, requestPath: string): string {
	return injectMirrorBanner(injectMirrorBase(html, requestPath), requestPath);
}

export async function openMirrorAsset(requestPath: string): Promise<{
	path: string;
	bytes: Buffer;
	contentType: string;
	isHtml: boolean;
} | null> {
	await ensureReticulumSiteMirror();
	let full = resolveMirrorFilePath(requestPath);
	if (!full) return null;

	if (!(await pathExists(full))) {
		const asDirIndex = resolveMirrorFilePath(
			requestPath.endsWith('/') ? requestPath : `${requestPath}/`
		);
		if (!asDirIndex || !(await pathExists(asDirIndex))) return null;
		full = asDirIndex;
	}

	const info = await stat(full);
	if (!info.isFile()) return null;

	const bytes = await readFile(full);
	const contentType = mimeForPath(full);
	const isHtml = contentType.startsWith('text/html');
	return { path: full, bytes, contentType, isHtml };
}
