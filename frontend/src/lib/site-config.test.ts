import { describe, it, expect } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, isLocaleSupported } from './site-config';

describe('site-config', () => {
	it('DEFAULT_LOCALE is in LOCALES', () => {
		expect(LOCALES).toContain(DEFAULT_LOCALE);
	});

	it('LOCALE_LABELS has an entry for every locale', () => {
		for (const code of LOCALES) {
			expect(LOCALE_LABELS[code]).toBeTruthy();
		}
	});

	it('isLocaleSupported accepts only configured locales', () => {
		expect(isLocaleSupported('en')).toBe(true);
		expect(isLocaleSupported('de')).toBe(true);
		expect(isLocaleSupported('fr')).toBe(false);
		expect(isLocaleSupported('')).toBe(false);
	});
});
