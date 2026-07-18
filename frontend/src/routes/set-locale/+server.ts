import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isLocaleSupported } from '$lib/site-config';
import { safeRedirectTarget } from '$lib/security';

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
