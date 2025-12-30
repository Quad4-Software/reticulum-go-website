export async function getLatestTag() {
	try {
		const response = await fetch('https://git.quad4.io/api/v1/repos/Networks/Reticulum-Go/tags');
		if (response.ok) {
			const tags = await response.json();
			if (tags && tags.length > 0) {
				return tags[0].name;
			}
		}
	} catch (e) {
		console.error('Failed to fetch latest tag:', e);
	}
	return null;
}
