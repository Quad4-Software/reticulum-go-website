import { json, type RequestHandler } from '@sveltejs/kit';
import { getRenBrowserReleases } from '$lib/server/ren-browser-releases';

export const GET: RequestHandler = async () => {
	const snapshot = await getRenBrowserReleases();

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
