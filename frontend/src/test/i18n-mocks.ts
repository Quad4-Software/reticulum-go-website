import { readable } from 'svelte/store';

/** Minimal formatter for component tests (keys used in Navbar / Footer snippets). */
export function createTestFormatter() {
	return (key: string, opts?: { values?: Record<string, unknown> }) => {
		if (key === 'common.last_activity' && opts?.values?.time) {
			return `Last activity: ${opts.values.time}`;
		}
		const map: Record<string, string> = {
			'home.title': 'Reticulum-Go',
			'common.home': 'Home',
			'common.docs': 'Docs',
			'common.interactive': 'Interactive',
			'common.apps': 'Apps',
			'common.contact': 'Contact',
			'common.rss_development': 'RSS: Development',
			'common.rss_releases': 'RSS: Releases',
			'common.rss_copied': 'Copied',
			'time.days': 'days',
			'time.hours': 'hours'
		};
		return map[key] ?? key;
	};
}

export function getMockI18nStores(localeCode = 'en') {
	const fmt = createTestFormatter();
	return {
		t: readable(fmt),
		locale: readable(localeCode),
		locales: readable(['en', 'de', 'ru', 'it'])
	};
}
