import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/svelte';
import Toast from './Toast.svelte';

describe('Toast', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders message when visible', () => {
		render(Toast, { props: { message: 'Copied to clipboard', visible: true } });
		expect(screen.getByRole('status').textContent).toContain('Copied to clipboard');
		expect(screen.getByTestId('toast-dot')).toBeTruthy();
	});

	it('hides blue dot when showDot is false', () => {
		render(Toast, {
			props: { message: 'Copied to clipboard', visible: true, showDot: false }
		});
		expect(screen.queryByTestId('toast-dot')).toBeNull();
		expect(screen.getByRole('status').textContent).toContain('Copied to clipboard');
	});

	it('does not render when not visible', () => {
		render(Toast, { props: { message: 'Hidden', visible: false } });
		expect(screen.queryByRole('status')).toBeNull();
	});

	it('calls ondismiss when dismiss is clicked', async () => {
		const ondismiss = vi.fn();
		render(Toast, {
			props: { message: 'Bye', visible: true, ondismiss }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(ondismiss).toHaveBeenCalledTimes(1);
	});
});
