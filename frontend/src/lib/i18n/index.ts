import { init, register, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('de', () => import('./locales/de.json'));
register('ru', () => import('./locales/ru.json'));
register('it', () => import('./locales/it.json'));

const getInitialLocale = () => {
	if (!browser) return defaultLocale;

	// 1. Check URL parameter ?lang=
	try {
		const urlParams = new URLSearchParams(window.location.search);
		const langParam = urlParams.get('lang');
		if (langParam && ['en', 'de', 'ru', 'it'].includes(langParam)) {
			return langParam;
		}
	} catch (e) {
		console.error('Error parsing URL params:', e);
	}

	// 2. Check localStorage
	const stored = localStorage.getItem('locale');
	if (stored) return stored;

	// 3. Check navigator
	const nav = getLocaleFromNavigator();
	if (nav) {
		const base = nav.split('-')[0];
		// Add more supported locales here as they are added
		if (['en', 'de', 'ru', 'it'].includes(base)) return base;
	}

	return defaultLocale;
};

const initialLocale = getInitialLocale();

init({
	fallbackLocale: defaultLocale,
	initialLocale: initialLocale
});

if (!browser) {
	locale.set(initialLocale);
}

if (browser) {
	locale.subscribe((value) => {
		if (value) {
			localStorage.setItem('locale', value);
			document.cookie = `locale=${value}; path=/; max-age=31536000; SameSite=Lax`;
			invalidate('app:locale');
		}
	});
}
