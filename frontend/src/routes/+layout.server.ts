import { building } from '$app/env';
import type { LayoutServerLoad } from './$types';
import { locale, waitLocale } from 'svelte-i18n';
import { DEFAULT_LOCALE, isLocaleSupported } from '#lib/site-config.ts';
import { safeRedirectTarget } from '#lib/security.ts';

const SUPPORTED_THEMES = new Set(['light', 'dark', 'system']);

function isSupportedTheme(value: string | null): value is 'light' | 'dark' | 'system' {
	return value !== null && SUPPORTED_THEMES.has(value);
}

export const load: LayoutServerLoad = async ({ url, cookies }) => {
	if (building) {
		locale.set(DEFAULT_LOCALE);
		await waitLocale(DEFAULT_LOCALE);
		return {
			currentLocale: DEFAULT_LOCALE,
			currentTheme: 'system',
			isDark: false,
			currentPath: url.pathname
		};
	}
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
