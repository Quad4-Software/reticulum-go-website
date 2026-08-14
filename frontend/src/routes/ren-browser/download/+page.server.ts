import type { PageServerLoad } from './$types';
import { getRenBrowserReleases } from '$lib/server/ren-browser-releases';

export const load: PageServerLoad = async () => {
	const releases = await getRenBrowserReleases();

	return {
		releases
	};
};
