export type RepoInfo = {
	latest_tag: string | null;
	updated_at: string | null;
};

let repoInfoPromise: Promise<RepoInfo> | null = null;

/** Single shared fetch for /api/repo-info (tag + updated_at). */
export function getRepoInfo(): Promise<RepoInfo> {
	if (!repoInfoPromise) {
		repoInfoPromise = (async (): Promise<RepoInfo> => {
			try {
				const response = await fetch('/api/repo-info');
				if (!response.ok) {
					return { latest_tag: null, updated_at: null };
				}
				const data = (await response.json()) as {
					latest_tag?: string | null;
					updated_at?: string | null;
				};
				return {
					latest_tag: data.latest_tag || null,
					updated_at: data.updated_at || null
				};
			} catch {
				return { latest_tag: null, updated_at: null };
			}
		})();
	}
	return repoInfoPromise;
}

/** Clears the in-flight/cached promise (tests only). */
export function resetRepoInfoCache(): void {
	repoInfoPromise = null;
}

export async function getLatestTag() {
	return (await getRepoInfo()).latest_tag;
}

export async function getRepoUpdatedAt() {
	return (await getRepoInfo()).updated_at;
}

export function calculateTimeAgo(updatedAt: string | null) {
	if (!updatedAt) return null;
	const date = new Date(updatedAt);
	const now = new Date();
	const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diff < 60) return { value: diff, unit: 'time.seconds' };
	const minutes = Math.floor(diff / 60);
	if (minutes < 60) return { value: minutes, unit: 'time.minutes' };
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return { value: hours, unit: 'time.hours' };
	const days = Math.floor(hours / 24);
	if (days < 30) return { value: days, unit: 'time.days' };
	const months = Math.floor(days / 30);
	if (months < 12) return { value: months, unit: 'time.months' };
	const years = Math.floor(months / 12);
	return { value: years, unit: 'time.years' };
}
