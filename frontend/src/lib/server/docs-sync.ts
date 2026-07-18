import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { marked } from 'marked';
import { RETICULUM_GO_GITHUB } from '$lib/source-mirrors';

const REPO_OWNER = 'Quad4-Software';
const REPO_NAME = 'Reticulum-Go';
const DOCS_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/docs/en`;
const META_FILE = 'meta.json';
const GITHUB_BLOB = `${RETICULUM_GO_GITHUB}/blob/master`;

export type DocsSyncMeta = {
	fetchedAt: string;
	files: string[];
	source: string;
};

type GithubContentItem = {
	name?: string;
	type?: string;
	download_url?: string | null;
	sha?: string;
};

function cacheDir(): string {
	return process.env.DOCS_CACHE_DIR?.trim() || join(tmpdir(), 'reticulum-go-docs-cache');
}

function metaPath(): string {
	return join(cacheDir(), META_FILE);
}

function docPath(filename: string): string {
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

/**
 * Rewrite upstream Reticulum-Go doc links for this website.
 * Mirrors scripts/sync-docs.sh.
 */
export function rewriteDocLinks(markdown: string, githubBlobBase = GITHUB_BLOB): string {
	return markdown
		.replace(/\]\(([a-z0-9-]+)\.md(#[a-zA-Z0-9_-]*)?\)/g, '](/docs/$1$2)')
		.replace(/\]\(\.\.\/\.\.\/README\.md\)/g, `](${githubBlobBase}/README.md)`)
		.replace(/\]\(\.\.\/\.\.\/COMPATIBILITY\.md\)/g, `](${githubBlobBase}/COMPATIBILITY.md)`)
		.replace(/\]\(\.\.\/\.\.\/SECURITY\.md\)/g, `](${githubBlobBase}/SECURITY.md)`)
		.replace(/\]\(\.\.\/\.\.\/LICENSE\)/g, `](${githubBlobBase}/LICENSE)`);
}

export function extractDocTitle(markdown: string, fallbackSlug: string): string {
	const match = markdown.match(/^#\s+(.+)$/m);
	if (match?.[1]) return match[1].trim();
	return fallbackSlug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export async function getDocsSyncMeta(): Promise<DocsSyncMeta | null> {
	try {
		const raw = await readFile(metaPath(), 'utf8');
		const meta = JSON.parse(raw) as DocsSyncMeta;
		if (!meta?.files?.length) return null;
		return meta;
	} catch {
		return null;
	}
}

export async function getCachedDocMarkdown(slug: string): Promise<string | null> {
	const filename = `${slug}.md`;
	const path = docPath(filename);
	if (!(await pathExists(path))) return null;
	try {
		return await readFile(path, 'utf8');
	} catch {
		return null;
	}
}

export async function renderDocMarkdown(markdown: string): Promise<string> {
	return marked.parse(markdown, { async: false }) as string;
}

let refreshInFlight: Promise<DocsSyncMeta | null> | null = null;

/**
 * Fetch English docs from the Reticulum-Go GitHub tree into a local cache.
 * Always refreshes on call (intended for server startup).
 */
export async function ensureDocsSynced(): Promise<DocsSyncMeta | null> {
	if (refreshInFlight) return refreshInFlight;
	refreshInFlight = (async () => {
		try {
			await mkdir(cacheDir(), { recursive: true });
			const listResponse = await fetch(DOCS_API, {
				headers: {
					Accept: 'application/vnd.github+json',
					'User-Agent': 'reticulum-go-website-docs-cache'
				},
				signal: AbortSignal.timeout(30_000)
			});
			if (!listResponse.ok) {
				throw new Error(`docs list failed: HTTP ${listResponse.status}`);
			}
			const items = (await listResponse.json()) as GithubContentItem[];
			if (!Array.isArray(items)) {
				throw new Error('docs list response was not an array');
			}

			const markdownFiles = items.filter(
				(item) =>
					item.type === 'file' &&
					typeof item.name === 'string' &&
					item.name.endsWith('.md') &&
					item.name !== 'README.md' &&
					typeof item.download_url === 'string'
			);

			const written: string[] = [];
			await Promise.all(
				markdownFiles.map(async (item) => {
					const name = item.name as string;
					const downloadUrl = item.download_url as string;
					const response = await fetch(downloadUrl, {
						headers: { 'User-Agent': 'reticulum-go-website-docs-cache' },
						signal: AbortSignal.timeout(60_000)
					});
					if (!response.ok) {
						throw new Error(`doc download failed for ${name}: HTTP ${response.status}`);
					}
					const raw = await response.text();
					const rewritten = rewriteDocLinks(raw);
					await writeFile(docPath(name), rewritten, 'utf8');
					written.push(name);
				})
			);

			written.sort();
			const meta: DocsSyncMeta = {
				fetchedAt: new Date().toISOString(),
				files: written,
				source: DOCS_API
			};
			await writeFile(metaPath(), JSON.stringify(meta, null, 2) + '\n', 'utf8');
			console.info(`[docs-sync] cached ${written.length} docs into ${cacheDir()}`);
			return meta;
		} catch (err) {
			console.error('[docs-sync] refresh failed', err);
			return getDocsSyncMeta();
		} finally {
			refreshInFlight = null;
		}
	})();
	return refreshInFlight;
}

export async function listCachedDocSlugs(): Promise<string[]> {
	try {
		const names = await readdir(cacheDir());
		return names
			.filter((name) => name.endsWith('.md') && !/\.[a-z]{2}\.md$/.test(name))
			.map((name) => name.slice(0, -3))
			.sort();
	} catch {
		const meta = await getDocsSyncMeta();
		return (meta?.files ?? []).map((f) => f.replace(/\.md$/, '')).sort();
	}
}
