import type { LayoutServerLoad } from './$types';
import { locale, waitLocale } from 'svelte-i18n';

const SUPPORTED_LOCALES = new Set(['en', 'de', 'ru', 'it']);
const SUPPORTED_THEMES = new Set(['light', 'dark', 'system']);

function isSupportedLocale(value: string | null): value is 'en' | 'de' | 'ru' | 'it' {
	return value !== null && SUPPORTED_LOCALES.has(value);
}

function isSupportedTheme(value: string | null): value is 'light' | 'dark' | 'system' {
	return value !== null && SUPPORTED_THEMES.has(value);
}

function safeRedirectTarget(value: string | null): string {
	if (!value || !value.startsWith('/')) return '/';
	return value;
}

export const load: LayoutServerLoad = async ({ url, cookies }) => {
	const queryLocale = url.searchParams.get('lang');
	const cookieLocale = cookies.get('locale') ?? null;
	const currentLocale = isSupportedLocale(queryLocale)
		? queryLocale
		: isSupportedLocale(cookieLocale)
			? cookieLocale
			: 'en';

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
