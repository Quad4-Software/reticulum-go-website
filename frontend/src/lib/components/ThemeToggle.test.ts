import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup, within } from '@testing-library/svelte';
import ThemeToggle from './ThemeToggle.svelte';

describe('ThemeToggle', () => {
	beforeEach(() => {
		cleanup();
	});

	it('renders no-js theme selector', () => {
		const { container } = render(ThemeToggle);
		const summary = container.querySelector('summary[aria-label="Select theme"]');
		expect(summary).toBeTruthy();
	});

	it('renders theme links with redirect target', () => {
		const { container } = render(ThemeToggle, { props: { currentPath: '/docs?lang=de' } });
		expect(within(container).getByRole('link', { name: 'Light' }).getAttribute('href')).toBe(
			'/set-theme?theme=light&redirect=%2Fdocs%3Flang%3Dde'
		);
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
		expect(within(container).getByRole('link', { name: 'Light' }).getAttribute('aria-current')).toBeNull();
	});
});
