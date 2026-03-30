import { describe, it, expect, vi, beforeEach } from 'vitest';

type LayoutLoadResult = {
	currentLocale: string;
	currentTheme: string;
	isDark: boolean;
	currentPath: string;
};

const localeSet = vi.fn();
const waitLocaleMock = vi.fn().mockResolvedValue(undefined);

vi.mock('svelte-i18n', () => ({
	locale: { set: localeSet },
	waitLocale: waitLocaleMock
}));

function createCookies(initial: Record<string, string> = {}) {
	const jar: Record<string, string> = { ...initial };
	return {
		get: (name: string) => jar[name],
		set: vi.fn((name: string, value: string) => {
			jar[name] = value;
		}),
		delete: vi.fn(),
		getAll: vi.fn(),
		serialize: vi.fn()
	};
}

describe('+layout.server load', () => {
	beforeEach(() => {
		vi.resetModules();
		localeSet.mockClear();
		waitLocaleMock.mockClear();
	});

	it('prefers lang query over cookie', async () => {
		const { load } = await import('./+layout.server');
		const cookies = createCookies({ locale: 'de' });
		const result = (await load({
			url: new URL('http://localhost/page?lang=en'),
			cookies
		} as never)) as LayoutLoadResult;
		expect(result.currentLocale).toBe('en');
		expect(localeSet).toHaveBeenCalledWith('en');
		expect(waitLocaleMock).toHaveBeenCalledWith('en');
	});

	it('uses cookie when query is absent or invalid', async () => {
		const { load } = await import('./+layout.server');
		const cookies = createCookies({ locale: 'de' });
		const result = (await load({
			url: new URL('http://localhost/'),
			cookies
		} as never)) as LayoutLoadResult;
		expect(result.currentLocale).toBe('de');
	});

	it('falls back to default locale for unsupported cookie', async () => {
		const { load } = await import('./+layout.server');
		const cookies = createCookies({ locale: 'xx' });
		const result = (await load({
			url: new URL('http://localhost/'),
			cookies
		} as never)) as LayoutLoadResult;
		expect(result.currentLocale).toBe('en');
	});

	it('sets isDark when theme cookie is dark', async () => {
		const { load } = await import('./+layout.server');
		const cookies = createCookies({ locale: 'en', theme: 'dark' });
		const result = (await load({
			url: new URL('http://localhost/'),
			cookies
		} as never)) as LayoutLoadResult;
		expect(result.currentTheme).toBe('dark');
		expect(result.isDark).toBe(true);
	});

	it('uses system theme without isDark', async () => {
		const { load } = await import('./+layout.server');
		const cookies = createCookies({ locale: 'en', theme: 'system' });
		const result = (await load({
			url: new URL('http://localhost/'),
			cookies
		} as never)) as LayoutLoadResult;
		expect(result.currentTheme).toBe('system');
		expect(result.isDark).toBe(false);
	});

	it('builds currentPath from pathname and search', async () => {
		const { load } = await import('./+layout.server');
		const cookies = createCookies({ locale: 'en' });
		const result = (await load({
			url: new URL('http://localhost/docs/foo?bar=1'),
			cookies
		} as never)) as LayoutLoadResult;
		expect(result.currentPath).toBe('/docs/foo?bar=1');
	});
});
