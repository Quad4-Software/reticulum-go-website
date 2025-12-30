import { init, register, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('de', () => import('./locales/de.json'));

const getInitialLocale = () => {
	if (!browser) return defaultLocale;
	
	const stored = localStorage.getItem('locale');
	if (stored) return stored;
	
	const nav = getLocaleFromNavigator();
	if (nav) {
		const base = nav.split('-')[0];
		// Add more supported locales here as they are added
		if (['en', 'de'].includes(base)) return base;
	}
	
	return defaultLocale;
};

init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale()
});

if (browser) {
	locale.subscribe((value) => {
		if (value) {
			localStorage.setItem('locale', value);
			document.cookie = `locale=${value}; path=/; max-age=31536000`;
			invalidate('app:locale');
		}
	});
}
