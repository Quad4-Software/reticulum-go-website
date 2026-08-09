export const SITE_URL = 'https://reticulum-go.quad4.io';
export const SITE_NAME = 'Reticulum-Go';
export const SITE_DESCRIPTION =
	'Wire-compatible Go port of the Reticulum Network Stack. Run encrypted mesh networking in the browser and on servers, alongside Python RNS by Mark Qvist.';
export const LOCALES = ['en', 'de', 'ru', 'it'] as const;
export const DEFAULT_LOCALE = 'en';

export type LocaleCode = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<LocaleCode, string> = {
	en: 'English',
	de: 'Deutsch',
	ru: 'Русский',
	it: 'Italiano'
};

export function isLocaleSupported(code: string): code is LocaleCode {
	return (LOCALES as readonly string[]).includes(code);
}
