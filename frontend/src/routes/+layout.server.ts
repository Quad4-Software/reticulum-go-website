import type { LayoutServerLoad } from './$types';
import { locale, waitLocale } from 'svelte-i18n';
import { DEFAULT_LOCALE, isLocaleSupported } from '$lib/site-config';
import { safeRedirectTarget } from '$lib/sanitize-html';

const SUPPORTED_THEMES = new Set(['light', 'dark', 'system']);

function isSupportedTheme(value: string | null): value is 'light' | 'dark' | 'system' {
	return value !== null && SUPPORTED_THEMES.has(value);
}

export const load: LayoutServerLoad = async ({ url, cookies }) => {
	const queryLocale = url.searchParams.get('lang');
	const cookieLocale = cookies.get('locale') ?? null;
	const currentLocale =
		queryLocale != null && isLocaleSupported(queryLocale)
			? queryLocale
			: cookieLocale != null && isLocaleSupported(cookieLocale)
				? cookieLocale
				: DEFAULT_LOCALE;

	if (cookieLocale !== currentLocale) {
		cookies.set('locale', currentLocale, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
	}

	locale.set(currentLocale);
	await waitLocale(currentLocale);

	const cookieTheme = cookies.get('theme') ?? null;
	const currentTheme = isSupportedTheme(cookieTheme) ? cookieTheme : 'system';
	const isDark = currentTheme === 'dark';
	const currentPath = safeRedirectTarget(url.pathname + url.search);

	return {
		currentLocale,
		currentTheme,
		isDark,
		currentPath
	};
};
