import { writable, derived, get } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';

const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getSystemPrefersDark(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readCookieTheme(): Theme | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(/(?:^|;\s*)theme=(light|dark|system)(?:;|$)/);
	if (!match) return null;
	return match[1] as Theme;
}

function loadStoredTheme(): Theme {
	if (typeof window === 'undefined') return 'system';
	const fromCookie = readCookieTheme();
	if (fromCookie) return fromCookie;
	if (typeof localStorage?.getItem !== 'function') return 'system';
	const stored = localStorage.getItem('theme');
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return 'system';
}

export function isTheme(value: string | null | undefined): value is Theme {
	return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveIsDark(t: Theme, systemDark = getSystemPrefersDark()): boolean {
	if (t === 'dark') return true;
	if (t === 'light') return false;
	return systemDark;
}

export function persistThemeCookie(t: Theme) {
	if (typeof document === 'undefined') return;
	document.cookie = `theme=${t}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export const theme = writable<Theme>(loadStoredTheme());
export const systemPrefersDark = writable(getSystemPrefersDark());

export const isDark = derived([theme, systemPrefersDark], ([$theme, $systemPrefersDark]) =>
	resolveIsDark($theme, $systemPrefersDark)
);

export function setTheme(t: Theme) {
	theme.set(t);
	if (typeof window !== 'undefined' && typeof localStorage?.setItem === 'function') {
		localStorage.setItem('theme', t);
	}
	persistThemeCookie(t);
	applyDarkClass(get(isDark));
}

export function syncThemeFromServer(serverTheme: Theme) {
	theme.set(serverTheme);
	if (typeof window !== 'undefined' && typeof localStorage?.setItem === 'function') {
		localStorage.setItem('theme', serverTheme);
	}
	persistThemeCookie(serverTheme);
	systemPrefersDark.set(getSystemPrefersDark());
	applyDarkClass(get(isDark));
}

export function initTheme(preferred?: Theme) {
	if (typeof window === 'undefined') return;
	const next = preferred ?? loadStoredTheme();
	theme.set(next);
	if (typeof localStorage?.setItem === 'function') {
		localStorage.setItem('theme', next);
	}
	persistThemeCookie(next);
	systemPrefersDark.set(getSystemPrefersDark());
	applyDarkClass(get(isDark));
	if (typeof window.matchMedia !== 'function') return;
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	mq.addEventListener('change', () => {
		systemPrefersDark.set(mq.matches);
		if (get(theme) === 'system') {
			applyDarkClass(mq.matches);
		}
	});
}

export function applyDarkClass(dark: boolean) {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', dark);
}
