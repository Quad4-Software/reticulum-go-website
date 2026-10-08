import { json, type RequestHandler } from '@sveltejs/kit';

export const prerender = false;
import { getReticulumGoReleases } from '$lib/server/reticulum-go-releases';

export const GET: RequestHandler = async () => {
	const snapshot = await getReticulumGoReleases();

	if (!snapshot) {
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

	return json(snapshot, {
		headers: {
			'Cache-Control': 'public, max-age=900'
		}
	});
};
