import { SITE_URL } from '$lib/site-config';

/** Public mount path for the unofficial reticulum.network mirror. */
export const RETICULUM_MIRROR_PATH = '/mirrors/reticulum';

export const RETICULUM_UPSTREAM = 'https://reticulum.network';
export const RETICULUM_WEBSITE_REPO = 'https://github.com/markqvist/reticulum_website';

export function reticulumMirrorUrl(relPath = ''): string {
	const cleaned = relPath.replace(/^\/+/, '');
	return cleaned ? `${SITE_URL}${RETICULUM_MIRROR_PATH}/${cleaned}` : `${SITE_URL}${RETICULUM_MIRROR_PATH}`;
}

export const RETICULUM_MIRROR_ZEN = `${RETICULUM_MIRROR_PATH}/zenofreticulum.html`;
export const RETICULUM_MIRROR_MANUAL_ZEN = `${RETICULUM_MIRROR_PATH}/manual/zen.html`;
export const RETICULUM_MIRROR_MANUAL = `${RETICULUM_MIRROR_PATH}/manual/`;
