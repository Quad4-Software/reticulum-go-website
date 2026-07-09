import { describe, it, expect, vi, beforeEach } from 'vitest';

const localeSet = vi.fn();
const waitLocaleMock = vi.fn().mockResolvedValue(undefined);

vi.mock('svelte-i18n', () => ({
	locale: { set: localeSet },
	waitLocale: waitLocaleMock
}));

vi.mock('$lib/i18n', () => ({}));

describe('+layout load', () => {
	beforeEach(() => {
		vi.resetModules();
		localeSet.mockClear();
		waitLocaleMock.mockClear();
	});

	it('sets and waits for the server-resolved locale before rendering', async () => {
		const { load } = await import('./+layout');
		const result = await load({
			data: { currentLocale: 'de', currentTheme: 'system', isDark: false, currentPath: '/' }
		} as never);
		expect(localeSet).toHaveBeenCalledWith('de');
		expect(waitLocaleMock).toHaveBeenCalledWith('de');
		expect(result).toEqual({
			currentLocale: 'de',
			currentTheme: 'system',
			isDark: false,
			currentPath: '/'
		});
	});
});
