import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
	getLatestTag,
	getRepoUpdatedAt,
	getRepoInfo,
	calculateTimeAgo,
	resetRepoInfoCache
} from './version';

describe('version', () => {
	describe('calculateTimeAgo', () => {
		const baseTime = new Date('2024-06-15T12:00:00Z');

		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(baseTime);
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('returns null for null input', () => {
			expect(calculateTimeAgo(null)).toBeNull();
		});

		it('returns seconds for diff < 60', () => {
			const past = new Date('2024-06-15T11:59:30Z');
			const result = calculateTimeAgo(past.toISOString());
			expect(result).toEqual({ value: 30, unit: 'time.seconds' });
		});

		it('returns minutes for diff 60-3599', () => {
			const past = new Date('2024-06-15T11:55:00Z');
			const result = calculateTimeAgo(past.toISOString());
			expect(result).toEqual({ value: 5, unit: 'time.minutes' });
		});

		it('returns hours for diff 3600-86399', () => {
			const past = new Date('2024-06-15T09:00:00Z');
			const result = calculateTimeAgo(past.toISOString());
			expect(result).toEqual({ value: 3, unit: 'time.hours' });
		});

		it('returns days for diff 86400-2591999', () => {
			const past = new Date('2024-06-08T12:00:00Z');
			const result = calculateTimeAgo(past.toISOString());
			expect(result).toEqual({ value: 7, unit: 'time.days' });
		});

		it('returns months for diff 2592000-31535999', () => {
			const past = new Date('2024-04-15T12:00:00Z');
			const result = calculateTimeAgo(past.toISOString());
			expect(result).toEqual({ value: 2, unit: 'time.months' });
		});

		it('returns years for diff >= 31536000', () => {
			const past = new Date('2023-06-15T12:00:00Z');
			const result = calculateTimeAgo(past.toISOString());
			expect(result).toEqual({ value: 1, unit: 'time.years' });
		});
	});

	describe('repo info fetch', () => {
		beforeEach(() => {
			resetRepoInfoCache();
			vi.stubGlobal('fetch', vi.fn());
		});

		afterEach(() => {
			resetRepoInfoCache();
			vi.unstubAllGlobals();
		});

		it('shares one /api/repo-info request across helpers', async () => {
			const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ latest_tag: 'v1.2.3', updated_at: '2024-01-15T12:00:00Z' })
			});

			expect(await getLatestTag()).toBe('v1.2.3');
			expect(await getRepoUpdatedAt()).toBe('2024-01-15T12:00:00Z');
			expect(await getRepoInfo()).toEqual({
				latest_tag: 'v1.2.3',
				updated_at: '2024-01-15T12:00:00Z'
			});
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		it('returns nulls when response not ok', async () => {
			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: false
			});
			expect(await getLatestTag()).toBeNull();
			expect(await getRepoUpdatedAt()).toBeNull();
		});

		it('returns nulls when fetch throws', async () => {
			(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
			expect(await getLatestTag()).toBeNull();
			expect(await getRepoUpdatedAt()).toBeNull();
		});

		it('returns null when latest_tag missing', async () => {
			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: true,
				json: async () => ({})
			});
			expect(await getLatestTag()).toBeNull();
		});
	});
});
