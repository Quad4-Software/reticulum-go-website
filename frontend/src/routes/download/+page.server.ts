import type { PageServerLoad } from './$types';
import { getReticulumGoReleases } from '$lib/server/reticulum-go-releases';

export const load: PageServerLoad = async () => {
	const releases = await getReticulumGoReleases();

	return {
		releases
	};
};
