import type { RenBrowserAsset, RenBrowserRelease, RenBrowserReleasesSnapshot } from '$lib/ren-browser-download';

const API_BASE = 'https://api.github.com';
const REPO_OWNER = 'Quad4-Software';
const REPO_NAME = 'Ren-Browser';
const CACHE_TTL_MS = 15 * 60 * 1000;
const USER_AGENT = 'reticulum-go-website-ren-browser-releases';

type GitHubAsset = {
	name?: string;
	size?: number;
	browser_download_url?: string;
	content_type?: string;
};

type GitHubRelease = {
	tag_name?: string;
	name?: string;
	published_at?: string;
	prerelease?: boolean;
	draft?: boolean;
	html_url?: string;
	assets?: GitHubAsset[];
};

let cachedSnapshot: RenBrowserReleasesSnapshot | null = null;
let lastFetched = 0;
let refreshInFlight: Promise<RenBrowserReleasesSnapshot | null> | null = null;

function normalizeAsset(asset: GitHubAsset): RenBrowserAsset | null {
	if (!asset.name || !asset.browser_download_url) return null;
	return {
		name: asset.name,
		url: asset.browser_download_url,
		size: asset.size ?? 0,
		contentType: asset.content_type ?? 'application/octet-stream'
	};
}

function normalizeRelease(release: GitHubRelease): RenBrowserRelease | null {
	if (!release.tag_name || !release.html_url || !release.published_at || release.draft) {
		return null;
	}

	const assets = (release.assets ?? [])
		.map(normalizeAsset)
		.filter((asset): asset is RenBrowserAsset => asset != null);

	return {
		tag: release.tag_name,
		name: release.name || release.tag_name,
		publishedAt: release.published_at,
		prerelease: release.prerelease === true,
		htmlUrl: release.html_url,
		assets
	};
}

async function fetchReleasesFromGitHub(): Promise<RenBrowserReleasesSnapshot | null> {
	const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=12`;
	const response = await fetch(url, {
		headers: {
			Accept: 'application/vnd.github+json',
			'User-Agent': USER_AGENT
		},
		signal: AbortSignal.timeout(20_000)
	});

	if (!response.ok) {
		return null;
	}

	const releases = (await response.json()) as GitHubRelease[];
	if (!Array.isArray(releases)) {
		return null;
	}

	const normalized = releases
		.map(normalizeRelease)
		.filter((release): release is RenBrowserRelease => release != null);

	const stable = normalized.find((release) => !release.prerelease) ?? null;
	const nightly = normalized.find((release) => release.prerelease) ?? null;

	return {
		stable,
		nightly,
		fetchedAt: new Date().toISOString()
	};
}

async function refreshCache(): Promise<RenBrowserReleasesSnapshot | null> {
	if (refreshInFlight) {
		return refreshInFlight;
	}

	refreshInFlight = (async () => {
		try {
			const snapshot = await fetchReleasesFromGitHub();
			if (snapshot && (snapshot.stable || snapshot.nightly)) {
				cachedSnapshot = snapshot;
				lastFetched = Date.now();
			}
			return snapshot;
		} finally {
			refreshInFlight = null;
		}
	})();

	return refreshInFlight;
}

export async function getRenBrowserReleases(): Promise<RenBrowserReleasesSnapshot | null> {
	const now = Date.now();
	if (!cachedSnapshot || now - lastFetched > CACHE_TTL_MS) {
		try {
			await refreshCache();
		} catch (error) {
			console.error('[ren-browser-releases] refresh failed:', error);
		}
	}

	return cachedSnapshot;
}

export function __resetRenBrowserReleaseCacheForTests() {
	cachedSnapshot = null;
	lastFetched = 0;
	refreshInFlight = null;
}
