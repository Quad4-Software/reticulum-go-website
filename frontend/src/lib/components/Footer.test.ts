import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, screen, waitFor } from '@testing-library/svelte';
import Footer from './Footer.svelte';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SHOW_COOLIFY: 'false' }
}));

vi.mock('$lib/version', () => ({
	getLatestTag: vi.fn().mockResolvedValue('v9.9.9'),
	getRepoUpdatedAt: vi.fn().mockResolvedValue('2024-01-01T00:00:00Z'),
	calculateTimeAgo: vi.fn(() => ({ value: 2, unit: 'time.days' }))
}));

vi.mock('svelte-i18n', () => import('../../test/i18n-mocks').then((m) => m.getMockI18nStores()));

describe('Footer', () => {
	beforeEach(() => {
		cleanup();
	});

	it('renders static columns and license', () => {
		render(Footer);
		expect(screen.getByText('Reticulum-Go')).toBeTruthy();
		expect(screen.getByText(/Implementation: Apache-2\.0/)).toBeTruthy();
		expect(screen.getByRole('heading', { name: 'Links' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
	});

	it('shows release tag and activity line after version fetch', async () => {
		render(Footer);
		await waitFor(() => {
			expect(screen.getByText('v9.9.9')).toBeTruthy();
		});
		expect(screen.getByText(/Last activity:/)).toBeTruthy();
	});
});
