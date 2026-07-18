import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/docs') }
}));

vi.mock('svelte-i18n', () => import('../../test/i18n-mocks').then((m) => m.getMockI18nStores()));

describe('Navbar', () => {
	beforeEach(() => {
		cleanup();
	});

	it('renders brand title and main nav links', () => {
		render(Navbar, { props: { currentPath: '/docs', currentTheme: 'system' } });
		expect(screen.getByText('Reticulum-Go')).toBeTruthy();
		expect(screen.getAllByRole('link', { name: 'Home' }).length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', { name: 'Docs' }).length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', { name: 'Tools' }).length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', { name: 'Donate' }).length).toBeGreaterThan(0);
		expect(screen.getByRole('link', { name: 'Source Code' })).toBeTruthy();
		expect(screen.queryByRole('link', { name: 'Interactive' })).toBeNull();
	});

	it('language links include set-locale and redirect', () => {
		const { container } = render(Navbar, {
			props: { currentPath: '/docs?q=1', currentTheme: 'system' }
		});
		const de = container.querySelector('a[href*="locale=de"]');
		expect(de?.getAttribute('href')).toContain(encodeURIComponent('/docs?q=1'));
	});

	it('mobile menu button toggles expanded state', async () => {
		render(Navbar, { props: { currentPath: '/', currentTheme: 'system' } });
		const btn = screen.getByRole('button', { name: 'Open menu' });
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		await fireEvent.click(btn);
		expect(btn.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getAllByRole('button', { name: 'Close menu' }).length).toBe(2);
	});

	it('marks the current route with aria-current', () => {
		render(Navbar, { props: { currentPath: '/docs', currentTheme: 'system' } });
		const docsLinks = screen.getAllByRole('link', { name: 'Docs' });
		expect(docsLinks.some((link) => link.getAttribute('aria-current') === 'page')).toBe(true);
	});

	it('closes the mobile menu on Escape', async () => {
		render(Navbar, { props: { currentPath: '/', currentTheme: 'system' } });
		const btn = screen.getByRole('button', { name: 'Open menu' });
		await fireEvent.click(btn);
		expect(btn.getAttribute('aria-expanded')).toBe('true');
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(screen.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe(
			'false'
		);
	});
});
