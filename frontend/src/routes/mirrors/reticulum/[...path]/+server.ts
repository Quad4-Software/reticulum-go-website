import type { RequestHandler } from './$types';
import { reticulumMirrorGet } from '$lib/server/reticulum-mirror-handler';

export const prerender = false;

/**
 * Unofficial mirror of reticulum.network (markqvist/reticulum_website docs tree).
 * Includes manuals and PDF/EPUB downloads under /mirrors/reticulum.
 */
export const GET: RequestHandler = async (event) => {
	const segments = event.params.path;
	const requestPath = Array.isArray(segments)
		? segments.join('/')
		: typeof segments === 'string'
			? segments
			: '';
	return reticulumMirrorGet(requestPath)(event);
};
