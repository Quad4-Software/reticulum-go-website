import { init, register, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';
import { LOCALES, DEFAULT_LOCALE, isLocaleSupported } from '../site-config';

const localeLoaders = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*.json');

for (const code of LOCALES) {
	const path = `./locales/${code}.json`;
	const loader = localeLoaders[path];
	if (!loader) {
		throw new Error(`Missing locale module: ${path}`);
	}
	register(code, async () => {
		const mod = await loader();
		return mod.default;
	});
}

const getInitialLocale = () => {
	if (!browser) return DEFAULT_LOCALE;

	try {
		const urlParams = new URLSearchParams(window.location.search);
		const langParam = urlParams.get('lang');
		if (langParam && isLocaleSupported(langParam)) {
			return langParam;
		}
	} catch (e) {
		console.error('Error parsing URL params:', e);
	}

	const stored = localStorage.getItem('locale');
	if (stored && isLocaleSupported(stored)) return stored;

	const nav = getLocaleFromNavigator();
	if (nav) {
		const base = nav.split('-')[0];
		if (base && isLocaleSupported(base)) return base;
	}

	return DEFAULT_LOCALE;
};

const initialLocale = getInitialLocale();

init({
	fallbackLocale: DEFAULT_LOCALE,
	initialLocale: initialLocale
});

locale.set(initialLocale);

if (browser) {
	locale.subscribe((value) => {
		if (value) {
			localStorage.setItem('locale', value);
			document.cookie = `locale=${value}; path=/; max-age=31536000; SameSite=Lax`;
			invalidate('app:locale');
		}
	});
}
