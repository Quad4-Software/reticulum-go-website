import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SUPPORTED_THEMES = new Set(['light', 'dark', 'system']);

function safeRedirectTarget(value: string | null): string {
	if (!value || !value.startsWith('/')) return '/';
	return value;
}

export const GET: RequestHandler = ({ url, cookies }) => {
	const requestedTheme = url.searchParams.get('theme');
	const redirectTo = safeRedirectTarget(url.searchParams.get('redirect'));

	if (requestedTheme && SUPPORTED_THEMES.has(requestedTheme)) {
		cookies.set('theme', requestedTheme, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
	}

	throw redirect(303, redirectTo);
};
