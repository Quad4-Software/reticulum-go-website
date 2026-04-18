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

	it('shows update copy and Reload when needRefresh is true', async () => {
		pwaMocks.needRefresh.set(true);
		pwaMocks.offlineReady.set(false);
		const { getByRole, getByText } = render(ReloadPrompt);
		expect(getByText(/new version is available/i)).toBeTruthy();
		await fireEvent.click(getByRole('button', { name: 'Reload' }));
		expect(pwaMocks.updateServiceWorker).toHaveBeenCalledWith(true);
	});

	it('dismiss clears both flags', async () => {
		pwaMocks.needRefresh.set(true);
		const { getByRole } = render(ReloadPrompt);
		await fireEvent.click(getByRole('button', { name: 'Dismiss' }));
		expect(get(pwaMocks.needRefresh)).toBe(false);
		expect(get(pwaMocks.offlineReady)).toBe(false);
	});

	it('prefers offline banner when both flags are set', () => {
		pwaMocks.offlineReady.set(true);
		pwaMocks.needRefresh.set(true);
		const { getByText, queryByText } = render(ReloadPrompt);
		expect(getByText(/cached and can be used offline/i)).toBeTruthy();
		expect(queryByText(/new version is available/i)).toBeNull();
	});
});
