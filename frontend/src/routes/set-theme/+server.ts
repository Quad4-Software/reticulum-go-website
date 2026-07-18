import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { safeRedirectTarget } from '$lib/security';

const SUPPORTED_THEMES = new Set(['light', 'dark', 'system']);

export const GET: RequestHandler = ({ url, cookies }) => {
	const requestedTheme = url.searchParams.get('theme');
	const redirectTo = safeRedirectTarget(url.searchParams.get('redirect'));

	if (requestedTheme && SUPPORTED_THEMES.has(requestedTheme)) {
		cookies.set('theme', requestedTheme, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax',
			httpOnly: false
		});
	}

	throw redirect(303, redirectTo);
};
