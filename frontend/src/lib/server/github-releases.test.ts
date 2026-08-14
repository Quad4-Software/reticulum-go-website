import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createReleaseFetcher, type GitHubRelease } from '$lib/server/github-releases';

type TestRelease = {
	tag: string;
	prerelease: boolean;
};

function normalizeRelease(release: GitHubRelease): TestRelease | null {
	if (!release.tag_name || release.draft) {
		return null;
	}
	return {
		tag: release.tag_name,
		prerelease: release.prerelease === true
	};
}

function makePrerelease(tag: string): GitHubRelease {
	return {
		tag_name: tag,
		published_at: '2026-01-01T00:00:00Z',
		html_url: `https://example.com/${tag}`,
		prerelease: true,
		draft: false
	};
}

function makeStable(tag: string): GitHubRelease {
	return {
		tag_name: tag,
		published_at: '2026-01-01T00:00:00Z',
		html_url: `https://example.com/${tag}`,
		prerelease: false,
		draft: false
	};
}

describe('createReleaseFetcher', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('paginates until a stable release is found', async () => {
		const pageOne = Array.from({ length: 12 }, (_, index) => makePrerelease(`nightly-${index}`));
		const pageTwo = [makeStable('v1.0.0')];
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, json: async () => pageOne })
			.mockResolvedValueOnce({ ok: true, json: async () => pageTwo });
		vi.stubGlobal('fetch', fetchMock);

		const { getReleases } = createReleaseFetcher({
			owner: 'Quad4-Software',
			repo: 'Reticulum-Go',
			userAgent: 'test-releases',
			normalizeRelease
		});

		const snapshot = await getReleases();
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(snapshot?.stable?.tag).toBe('v1.0.0');
		expect(snapshot?.nightly?.tag).toBe('nightly-0');
	});

	it('keeps a cached stable release when refresh misses it', async () => {
		vi.useFakeTimers({ now: 0 });
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => [makeStable('v1.0.0'), makePrerelease('nightly-1')]
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () =>
					Array.from({ length: 5 }, (_, index) => makePrerelease(`refresh-nightly-${index}`))
			});
		vi.stubGlobal('fetch', fetchMock);

		const { getReleases } = createReleaseFetcher({
			owner: 'Quad4-Software',
			repo: 'Reticulum-Go',
			userAgent: 'test-releases',
			normalizeRelease
		});

		const first = await getReleases();
		expect(first?.stable?.tag).toBe('v1.0.0');

		vi.setSystemTime(16 * 60 * 1000);
		const second = await getReleases();
		expect(second?.stable?.tag).toBe('v1.0.0');
		expect(second?.nightly?.tag).toBe('refresh-nightly-0');
	});
});
