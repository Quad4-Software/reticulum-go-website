import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';

const pwaMocks = vi.hoisted(() => {
	// Vitest hoisting must run before ESM imports; `require` loads `svelte/store` synchronously here.
	// eslint-disable-next-line @typescript-eslint/no-require-imports -- see above
	const { createRequire } = require('node:module') as typeof import('node:module');
	const nr = createRequire(import.meta.url);
	const { writable } = nr('svelte/store') as typeof import('svelte/store');
	return {
		needRefresh: writable(false),
		offlineReady: writable(false),
		updateServiceWorker: vi.fn(async () => {})
	};
});

vi.mock('virtual:pwa-register/svelte', () => ({
	useRegisterSW: () => ({
		needRefresh: pwaMocks.needRefresh,
		offlineReady: pwaMocks.offlineReady,
		updateServiceWorker: pwaMocks.updateServiceWorker
	})
}));

import ReloadPrompt from './ReloadPrompt.svelte';

describe('ReloadPrompt', () => {
	beforeEach(() => {
		cleanup();
		pwaMocks.needRefresh.set(false);
		pwaMocks.offlineReady.set(false);
		pwaMocks.updateServiceWorker.mockClear();
	});

	it('renders nothing when neither offline nor update is signaled', () => {
		const { container } = render(ReloadPrompt);
		expect(container.querySelector('[role="status"]')).toBeNull();
	});

	it('shows offline-ready copy when offlineReady is true', () => {
		pwaMocks.offlineReady.set(true);
		const { getByText } = render(ReloadPrompt);
		expect(getByText(/cached and can be used offline/i)).toBeTruthy();
	});

	it('auto-reloads when needRefresh is true', async () => {
		pwaMocks.needRefresh.set(true);
		render(ReloadPrompt);
		await vi.waitFor(() => {
			expect(pwaMocks.updateServiceWorker).toHaveBeenCalledWith(true);
		});
	});

	it('does not show an update banner when only needRefresh is true', () => {
		pwaMocks.needRefresh.set(true);
		pwaMocks.offlineReady.set(false);
		const { container } = render(ReloadPrompt);
		expect(container.querySelector('[role="status"]')).toBeNull();
	});

	it('dismiss clears offline flag', async () => {
		pwaMocks.offlineReady.set(true);
		const { getByRole } = render(ReloadPrompt);
		await fireEvent.click(getByRole('button', { name: 'Dismiss' }));
		expect(get(pwaMocks.offlineReady)).toBe(false);
	});

	it('does not show offline banner when only needRefresh is set', () => {
		pwaMocks.needRefresh.set(true);
		pwaMocks.offlineReady.set(false);
		const { container } = render(ReloadPrompt);
		expect(container.querySelector('[role="status"]')).toBeNull();
	});
});
