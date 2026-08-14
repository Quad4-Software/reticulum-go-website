const API_BASE = 'https://api.github.com';
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_PER_PAGE = 12;
const DEFAULT_MAX_PAGES = 5;

export type GitHubAsset = {
	name?: string;
	size?: number;
	browser_download_url?: string;
	content_type?: string;
};

export type GitHubRelease = {
	tag_name?: string;
	name?: string;
	published_at?: string;
	prerelease?: boolean;
	draft?: boolean;
	html_url?: string;
	assets?: GitHubAsset[];
};

export type ReleasesSnapshot<TR extends { prerelease: boolean }> = {
	stable: TR | null;
	nightly: TR | null;
	fetchedAt: string;
};

export type ReleaseFetcherConfig<TR extends { prerelease: boolean }> = {
	owner: string;
	repo: string;
	userAgent: string;
	cacheTtlMs?: number;
	perPage?: number;
	maxPages?: number;
	normalizeRelease: (release: GitHubRelease) => TR | null;
};

function mergeSnapshots<TR extends { prerelease: boolean }>(
	previous: ReleasesSnapshot<TR> | null,
	next: ReleasesSnapshot<TR>
): ReleasesSnapshot<TR> {
	return {
		stable: next.stable ?? previous?.stable ?? null,
		nightly: next.nightly ?? previous?.nightly ?? null,
		fetchedAt: next.fetchedAt
	};
}

export function createReleaseFetcher<TR extends { prerelease: boolean }>(
	config: ReleaseFetcherConfig<TR>
) {
	const cacheTtlMs = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
	const perPage = config.perPage ?? DEFAULT_PER_PAGE;
	const maxPages = config.maxPages ?? DEFAULT_MAX_PAGES;

	let cachedSnapshot: ReleasesSnapshot<TR> | null = null;
	let lastFetched = 0;
	let refreshInFlight: Promise<ReleasesSnapshot<TR> | null> | null = null;

	async function fetchPage(page: number): Promise<GitHubRelease[]> {
		const url = `${API_BASE}/repos/${config.owner}/${config.repo}/releases?per_page=${perPage}&page=${page}`;
		const response = await fetch(url, {
			headers: {
				Accept: 'application/vnd.github+json',
				'User-Agent': config.userAgent
			},
			signal: AbortSignal.timeout(20_000)
		});

		if (!response.ok) {
			return [];
		}

		const releases = (await response.json()) as GitHubRelease[];
		return Array.isArray(releases) ? releases : [];
	}

	async function fetchReleasesFromGitHub(): Promise<ReleasesSnapshot<TR> | null> {
		let stable: TR | null = null;
		let nightly: TR | null = null;

		for (let page = 1; page <= maxPages; page++) {
			const releases = await fetchPage(page);
			if (releases.length === 0) {
				break;
			}

			for (const release of releases) {
				const normalized = config.normalizeRelease(release);
				if (!normalized) {
					continue;
				}
				if (!nightly && normalized.prerelease) {
					nightly = normalized;
				}
				if (!stable && !normalized.prerelease) {
					stable = normalized;
				}
			}

			if (stable) {
				break;
			}
			if (releases.length < perPage) {
				break;
			}
		}

		if (!stable && !nightly) {
			return null;
		}

		return {
			stable,
			nightly,
			fetchedAt: new Date().toISOString()
		};
	}

	async function refreshCache(): Promise<ReleasesSnapshot<TR> | null> {
		if (refreshInFlight) {
			return refreshInFlight;
		}

		refreshInFlight = (async () => {
			try {
				const snapshot = await fetchReleasesFromGitHub();
				if (!snapshot) {
					return cachedSnapshot;
				}

				const merged = mergeSnapshots(cachedSnapshot, snapshot);
				if (merged.stable || merged.nightly) {
					cachedSnapshot = merged;
					lastFetched = Date.now();
				}
				return merged;
			} finally {
				refreshInFlight = null;
			}
		})();

		return refreshInFlight;
	}

	async function getReleases(): Promise<ReleasesSnapshot<TR> | null> {
		const now = Date.now();
		if (!cachedSnapshot || now - lastFetched > cacheTtlMs) {
			try {
				await refreshCache();
			} catch (error) {
				console.error(`[${config.userAgent}] refresh failed:`, error);
			}
		}

		return cachedSnapshot;
	}

	function resetForTests() {
		cachedSnapshot = null;
		lastFetched = 0;
		refreshInFlight = null;
	}

	return { getReleases, resetForTests };
}
