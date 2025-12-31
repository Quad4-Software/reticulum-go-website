export const prerender = false;
export const ssr = true;

import { waitLocale, locale } from 'svelte-i18n';
import { browser } from '$app/environment';
import { get } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function load(event: any) {
	let currentLocale = 'en';

	if (browser) {
		const urlParams = event.url.searchParams;
		const langParam = urlParams.get('lang');
		if (langParam && ['en', 'de', 'ru', 'it'].includes(langParam)) {
			currentLocale = langParam;
		} else {
			currentLocale = 'en';
		}
	} else {
		currentLocale = 'en';
	}

	const currentLocaleValue = get(locale);
	if (!currentLocaleValue || currentLocaleValue !== currentLocale) {
		locale.set(currentLocale);
	}

	await waitLocale(currentLocale);
	return {};
}
