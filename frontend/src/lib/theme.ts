import { writable, derived, get } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';

function getSystemPrefersDark(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function loadStoredTheme(): Theme {
	if (typeof window === 'undefined' || typeof localStorage?.getItem !== 'function') return 'system';
	const stored = localStorage.getItem('theme');
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return 'system';
}

export const theme = writable<Theme>(loadStoredTheme());
export const systemPrefersDark = writable(getSystemPrefersDark());

export const isDark = derived(
	[theme, systemPrefersDark],
	([$theme, $systemPrefersDark]) => {
		if ($theme === 'dark') return true;
		if ($theme === 'light') return false;
		return $systemPrefersDark;
	}
);

export function setTheme(t: Theme) {
	theme.set(t);
	if (typeof window !== 'undefined' && typeof localStorage?.setItem === 'function') {
		localStorage.setItem('theme', t);
	}
	applyDarkClass(get(isDark));
}

export function initTheme() {
	if (typeof window === 'undefined') return;
	theme.set(loadStoredTheme());
	systemPrefersDark.set(getSystemPrefersDark());
	applyDarkClass(get(isDark));
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	mq.addEventListener('change', () => systemPrefersDark.set(mq.matches));
}

export function applyDarkClass(dark: boolean) {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', dark);
}
