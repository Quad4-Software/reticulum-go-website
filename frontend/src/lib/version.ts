export async function getLatestTag() {
	try {
		const response = await fetch('/api/repo-info');
		if (response.ok) {
			const data = await response.json();
			return data.latest_tag || null;
		}
	} catch {
		// Silent fail, don't show if fetch fails
	}
	return null;
}

export async function getRepoUpdatedAt() {
	try {
		const response = await fetch('/api/repo-info');
		if (response.ok) {
			const data = await response.json();
			return data.updated_at || null;
		}
	} catch {
		// Silent fail, don't show if fetch fails
	}
	return null;
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
