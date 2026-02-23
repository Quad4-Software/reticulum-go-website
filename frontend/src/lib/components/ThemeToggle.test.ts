import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, within, cleanup } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import ThemeToggle from './ThemeToggle.svelte';

const setThemeMock = vi.fn();
vi.mock('$lib/theme', () => {
	const theme = writable('light');
	return {
		theme,
		isDark: { subscribe: () => () => {} },
		setTheme: (t: string) => {
			setThemeMock(t);
			theme.set(t);
		}
	};
});

describe('ThemeToggle', () => {
	beforeEach(() => {
		cleanup();
		setThemeMock.mockClear();
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(() => null),
			setItem: vi.fn()
		});
	});

	it('renders theme button', () => {
		const { container } = render(ThemeToggle);
		const btn = within(container).getByRole('button', { name: /select theme/i });
		expect(btn).toBeTruthy();
	});

	it('opens dropdown on click', async () => {
		const { container, getByText } = render(ThemeToggle);
		await fireEvent.click(within(container).getByRole('button', { name: /select theme/i }));
		expect(getByText('Light')).toBeTruthy();
		expect(getByText('Dark')).toBeTruthy();
		expect(getByText('System')).toBeTruthy();
	});

	it('calls setTheme when option selected', async () => {
		const { container, getByText } = render(ThemeToggle);
		await fireEvent.click(within(container).getByRole('button', { name: /select theme/i }));
		await fireEvent.click(getByText('Dark'));
		expect(setThemeMock).toHaveBeenCalledWith('dark');
	});
});
