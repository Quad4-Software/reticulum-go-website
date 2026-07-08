import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Search from './Search.svelte';

const goto = vi.fn();

vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => goto(...args)
}));

vi.mock('svelte-i18n', () => import('../../test/i18n-mocks').then((m) => m.getMockI18nStores()));

describe('Search', () => {
	beforeEach(() => {
		cleanup();
		goto.mockClear();
	});

	it('renders search trigger', () => {
		render(Search);
		expect(screen.getByText('Search docs...')).toBeTruthy();
	});

	it('opens panel and shows empty state, then results after typing', async () => {
		render(Search);
		const trigger = screen.getByRole('button', { name: /search docs/i });
		await fireEvent.click(trigger);

		await waitFor(
			() => {
				expect(screen.getByPlaceholderText('Search documentation...')).toBeTruthy();
			},
			{ timeout: 8000 }
		);

		expect(screen.getByText('Type to search documentation')).toBeTruthy();

		const input = screen.getByPlaceholderText('Search documentation...');
		await fireEvent.input(input, { target: { value: 'overview' } });

		await waitFor(
			() => {
				expect(screen.getByText('Overview')).toBeTruthy();
			},
			{ timeout: 8000 }
		);
	});
});
