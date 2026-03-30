import { json, type RequestHandler } from '@sveltejs/kit';

const API_BASE = 'https://git.quad4.io/api/v1';
const REPO_OWNER = 'Networks';
const REPO_NAME = 'Reticulum-Go';
const CACHE_TTL = 5 * 60 * 1000;

let cachedData: { latest_tag: string; updated_at: string } | null = null;
let lastFetched = 0;

async function fetchLatestTag(): Promise<string | null> {
	try {
		const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/tags`;
		const response = await fetch(url, {
			headers: {
				Accept: 'application/json'
			},
			signal: AbortSignal.timeout(15_000)
		});

		if (!response.ok) {
			return null;
		}

		const tags = await response.json();
		if (Array.isArray(tags) && tags.length > 0) {
			return tags[0].name || null;
		}
		return null;
	} catch {
		return null;
	}
}

async function fetchRepoInfo(): Promise<string | null> {
	try {
		const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}`;
		const response = await fetch(url, {
			headers: {
				Accept: 'application/json'
			},
			signal: AbortSignal.timeout(15_000)
		});

		if (!response.ok) {
			return null;
		}

		const repo = await response.json();
		return repo.updated_at || null;
	} catch {
		return null;
	}
}

async function refreshCache() {
	const [tag, updatedAt] = await Promise.all([fetchLatestTag(), fetchRepoInfo()]);

	if (tag && updatedAt) {
		cachedData = {
			latest_tag: tag,
			updated_at: updatedAt
		};
		lastFetched = Date.now();
	}
}

export const GET: RequestHandler = async () => {
	const now = Date.now();

	if (!cachedData || now - lastFetched > CACHE_TTL) {
		try {
			await refreshCache();
		} catch (error) {
			console.error('Failed to refresh cache:', error);
		}
	}

	if (!cachedData) {
		return json(
			{ error: 'Service unavailable' },
			{
				status: 503,
				headers: {
					'Cache-Control': 'no-cache'
				}
			}
		);
	}

	return json(cachedData, {
		headers: {
			'Cache-Control': 'public, max-age=300'
		}
	});
};
