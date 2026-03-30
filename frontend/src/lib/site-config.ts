export const SITE_URL = 'https://reticulum-go.quad4.io';
export const SITE_NAME = 'Reticulum-Go';
export const SITE_DESCRIPTION =
	'Reticulum-Go is a high-performance Go implementation of the Reticulum Network Stack. Build resilient, encrypted, and decentralised communication networks.';
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
