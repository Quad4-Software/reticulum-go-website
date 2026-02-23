import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Breadcrumbs from './Breadcrumbs.svelte';

describe('Breadcrumbs', () => {
	it('renders items with links', () => {
		const items = [
			{ label: 'Home', href: '/' },
			{ label: 'Docs', href: '/docs' },
			{ label: 'Current' }
		];
		const { container, getByText } = render(Breadcrumbs, { props: { items } });
		expect(getByText('Home')).toBeTruthy();
		expect(getByText('Docs')).toBeTruthy();
		expect(getByText('Current')).toBeTruthy();
		const links = container.querySelectorAll('a');
		expect(links.length).toBe(2);
		expect(links[0].getAttribute('href')).toBe('/');
		expect(links[1].getAttribute('href')).toBe('/docs');
	});

	it('has aria-label for accessibility', () => {
		const { container } = render(Breadcrumbs, {
			props: { items: [{ label: 'Home' }] }
		});
		const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
		expect(nav).toBeTruthy();
	});

	it('prevents overflow with flex layout', () => {
		const items = [
			{ label: 'Home', href: '/' },
			{ label: 'Very Long Breadcrumb Label That Could Overflow', href: '/long' },
			{ label: 'Current' }
		];
		const { container } = render(Breadcrumbs, { props: { items } });
		const nav = container.querySelector('nav');
		expect(nav?.classList.contains('flex')).toBe(true);
	});
});
