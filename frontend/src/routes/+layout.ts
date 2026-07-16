import '$lib/i18n';
import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';

export const prerender = false;
export const ssr = true;
export const csr = true;

export const load: LayoutLoad = async ({ data }) => {
	locale.set(data.currentLocale);
	await waitLocale(data.currentLocale);
	return {
		currentLocale: data.currentLocale,
		currentTheme: data.currentTheme,
		isDark: data.isDark,
		currentPath: data.currentPath
	};
};
