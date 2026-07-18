import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveIsDark, persistThemeCookie, isTheme } from './theme';

function mockMatchMedia(matches = false) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		configurable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}))
	});
}

function mockLocalStorage() {
	const store = new Map<string, string>();
	Object.defineProperty(window, 'localStorage', {
		configurable: true,
		writable: true,
		value: {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => {
				store.set(key, value);
			},
			removeItem: (key: string) => {
				store.delete(key);
			},
			clear: () => store.clear()
		}
	});
	return store;
}

describe('resolveIsDark', () => {
	it('forces dark and light regardless of system', () => {
		expect(resolveIsDark('dark', false)).toBe(true);
		expect(resolveIsDark('dark', true)).toBe(true);
		expect(resolveIsDark('light', true)).toBe(false);
		expect(resolveIsDark('light', false)).toBe(false);
	});

	it('follows system preference for system theme', () => {
		expect(resolveIsDark('system', true)).toBe(true);
		expect(resolveIsDark('system', false)).toBe(false);
	});
});

describe('isTheme', () => {
	it('accepts only supported theme values', () => {
		expect(isTheme('light')).toBe(true);
		expect(isTheme('dark')).toBe(true);
		expect(isTheme('system')).toBe(true);
		expect(isTheme('hacker')).toBe(false);
		expect(isTheme(null)).toBe(false);
	});
});

describe('persistThemeCookie', () => {
	beforeEach(() => {
		document.cookie = 'theme=; Max-Age=0; path=/';
	});

	afterEach(() => {
		document.cookie = 'theme=; Max-Age=0; path=/';
	});

	it('writes a path-scoped theme cookie', () => {
		persistThemeCookie('dark');
		expect(document.cookie).toMatch(/(?:^|;\s*)theme=dark(?:;|$)/);
	});
});

describe('setTheme', () => {
	beforeEach(() => {
		vi.resetModules();
		mockMatchMedia(false);
		mockLocalStorage();
		document.cookie = 'theme=; Max-Age=0; path=/';
		document.documentElement.classList.remove('dark');
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(null, { status: 303, headers: { Location: '/' } }))
		);
	});

	afterEach(() => {
		document.cookie = 'theme=; Max-Age=0; path=/';
		document.documentElement.classList.remove('dark');
		vi.unstubAllGlobals();
	});

	it('applies dark class, localStorage, and cookie immediately', async () => {
		const { setTheme, theme, isDark } = await import('./theme');
		setTheme('dark');

		let current = 'system';
		let dark = false;
		const unsubTheme = theme.subscribe((value) => {
			current = value;
		});
		const unsubDark = isDark.subscribe((value) => {
			dark = value;
		});

		expect(current).toBe('dark');
		expect(dark).toBe(true);
		expect(document.documentElement.classList.contains('dark')).toBe(true);
		expect(localStorage.getItem('theme')).toBe('dark');
		expect(document.cookie).toMatch(/(?:^|;\s*)theme=dark(?:;|$)/);

		unsubTheme();
		unsubDark();
	});

	it('clears dark class for light theme even when system prefers dark', async () => {
		mockMatchMedia(true);
		const { setTheme } = await import('./theme');
		setTheme('light');
		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(document.documentElement.style.colorScheme).toBe('light');
		expect(localStorage.getItem('theme')).toBe('light');
	});

	it('syncs theme cookie to the server via /set-theme', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(null, { status: 303, headers: { Location: '/' } })
		);
		vi.stubGlobal('fetch', fetchMock);
		window.history.replaceState({}, '', '/docs?x=1');

		const { setTheme } = await import('./theme');
		setTheme('dark');

		expect(fetchMock).toHaveBeenCalledWith(
			'/set-theme?theme=dark&redirect=%2Fdocs%3Fx%3D1',
			expect.objectContaining({ credentials: 'same-origin', redirect: 'manual' })
		);
	});
});
