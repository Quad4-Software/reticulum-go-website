import { describe, it, expect, vi, beforeEach } from 'vitest';

const preloadCode = vi.fn(() => Promise.resolve());
const preloadData = vi.fn(() => Promise.resolve({ type: 'loaded', status: 200, data: {} }));

vi.mock('$app/navigation', () => ({
	preloadCode: (...args: unknown[]) => preloadCode(...args),
	preloadData: (...args: unknown[]) => preloadData(...args)
}));

describe('schedulePreload', () => {
	beforeEach(() => {
		preloadCode.mockClear();
		preloadData.mockClear();
	});

	it('preloads same-origin paths', async () => {
		const { schedulePreload } = await import('./preload');
		schedulePreload('/docs');
		await Promise.resolve();
		expect(preloadCode).toHaveBeenCalledWith('/docs');
		expect(preloadData).toHaveBeenCalledWith('/docs');
	});

	it('skips locale and theme endpoints', async () => {
		const { schedulePreload } = await import('./preload');
		schedulePreload('/set-locale?locale=en');
		schedulePreload('/set-theme?theme=dark');
		schedulePreload('https://example.com');
		await Promise.resolve();
		expect(preloadCode).not.toHaveBeenCalled();
		expect(preloadData).not.toHaveBeenCalled();
	});
});
