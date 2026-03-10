import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SUPPORTED_LOCALES = new Set(['en', 'de', 'ru', 'it']);

function safeRedirectTarget(value: string | null): string {
	if (!value || !value.startsWith('/')) return '/';
	return value;
}

export const GET: RequestHandler = ({ url, cookies }) => {
	const requestedLocale = url.searchParams.get('locale');
	const redirectTo = safeRedirectTarget(url.searchParams.get('redirect'));

	if (requestedLocale && SUPPORTED_LOCALES.has(requestedLocale)) {
		cookies.set('locale', requestedLocale, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
	}

	throw redirect(303, redirectTo);
};
