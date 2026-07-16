import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, within, fireEvent } from '@testing-library/svelte';
import ThemeToggle from './ThemeToggle.svelte';

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
}

describe('ThemeToggle', () => {
	beforeEach(() => {
		cleanup();
		mockMatchMedia(false);
		mockLocalStorage();
		document.cookie = 'theme=; Max-Age=0; path=/';
		document.documentElement.classList.remove('dark');
	});

	it('renders no-js theme selector', () => {
		const { container } = render(ThemeToggle);
		const summary = container.querySelector('summary[aria-label="Select theme"]');
		expect(summary).toBeTruthy();
	});

	it('renders theme links with redirect target and reload hint', () => {
		const { container } = render(ThemeToggle, { props: { currentPath: '/docs?lang=de' } });
		const light = within(container).getByRole('link', { name: 'Light' });
		expect(light.getAttribute('href')).toBe('/set-theme?theme=light&redirect=%2Fdocs%3Flang%3Dde');
		expect(light.getAttribute('data-sveltekit-reload')).toBe('');
		expect(within(container).getByRole('link', { name: 'Dark' }).getAttribute('href')).toBe(
			'/set-theme?theme=dark&redirect=%2Fdocs%3Flang%3Dde'
		);
		expect(within(container).getByRole('link', { name: 'System' }).getAttribute('href')).toBe(
			'/set-theme?theme=system&redirect=%2Fdocs%3Flang%3Dde'
		);
	});

	it('marks selected theme with aria-current', () => {
		const { container } = render(ThemeToggle, { props: { currentTheme: 'dark' } });
		expect(within(container).getByRole('link', { name: 'Dark' }).getAttribute('aria-current')).toBe(
			'true'
		);
		expect(
			within(container).getByRole('link', { name: 'Light' }).getAttribute('aria-current')
		).toBeNull();
	});

	it('applies theme immediately on click without navigation', async () => {
		const { container } = render(ThemeToggle, { props: { currentTheme: 'system' } });
		const darkLink = within(container).getByRole('link', { name: 'Dark' });
		await fireEvent.click(darkLink);

		expect(document.documentElement.classList.contains('dark')).toBe(true);
		expect(localStorage.getItem('theme')).toBe('dark');
		expect(document.cookie).toMatch(/(?:^|;\s*)theme=dark(?:;|$)/);
		expect(darkLink.getAttribute('aria-current')).toBe('true');
	});
});
