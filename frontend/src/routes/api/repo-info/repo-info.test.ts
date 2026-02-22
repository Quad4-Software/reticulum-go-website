import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

function createEvent(overrides: Partial<RequestEvent> = {}): RequestEvent {
	return {
		request: new Request('http://localhost/api/repo-info'),
		params: {},
		route: { id: '/api/repo-info' },
		fetch: globalThis.fetch,
		getClientAddress: () => '',
		cookies: {} as RequestEvent['cookies'],
		locals: {},
		platform: undefined,
		url: new URL('http://localhost/api/repo-info'),
		isDataRequest: false,
		setHeaders: () => {},
		depends: () => {},
		parent: () => Promise.resolve({}),
		...overrides
	} as RequestEvent;
}

describe('GET /api/repo-info', () => {
	beforeEach(async () => {
		vi.resetModules();
		vi.stubGlobal('fetch', vi.fn());
	});

	it('returns 503 when fetch fails', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(503);
		const body = await response.json();
		expect(body.error).toBe('Service unavailable');
	});

	it('returns 200 with data when fetch succeeds', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => [{ name: 'v1.0.0' }]
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ updated_at: '2024-01-15T12:00:00Z' })
			});
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.latest_tag).toBe('v1.0.0');
		expect(body.updated_at).toBe('2024-01-15T12:00:00Z');
	});
});
