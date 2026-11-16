import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;
import { isLocaleSupported } from '#lib/site-config.ts';
import { safeRedirectTarget } from '#lib/security.ts';

export const GET: RequestHandler = ({ url, cookies }) => {
	const requestedLocale = url.searchParams.get('locale');
	const redirectTo = safeRedirectTarget(url.searchParams.get('redirect'));

	if (requestedLocale && isLocaleSupported(requestedLocale)) {
		cookies.set('locale', requestedLocale, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
	}

	throw redirect(303, redirectTo);
};
