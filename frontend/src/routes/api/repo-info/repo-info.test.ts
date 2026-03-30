import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

	it('returns 503 when fetch rejects (network error)', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(503);
		const body = await response.json();
		expect(body.error).toBe('Service unavailable');
	});

	it('returns 503 when tags response is not ok', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({ ok: false, status: 500 })
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ updated_at: '2024-01-15T12:00:00Z' })
			});
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(503);
	});

	it('returns 503 when repo response is not ok', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'v1.0.0' }] })
			.mockResolvedValueOnce({ ok: false, status: 404 });
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(503);
	});

	it('returns 503 when tags list is empty', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({ ok: true, json: async () => [] })
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ updated_at: '2024-01-15T12:00:00Z' })
			});
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(503);
	});

	it('returns 503 when tag name is missing', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({ ok: true, json: async () => [{}] })
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ updated_at: '2024-01-15T12:00:00Z' })
			});
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(503);
	});

	it('returns 503 when tags json fails', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new Error('bad json');
				}
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ updated_at: '2024-01-15T12:00:00Z' })
			});
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(503);
	});

	it('returns 200 with data when both Gitea calls succeed', async () => {
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

	it('sets Cache-Control on success and no-cache on failure', async () => {
		const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
		fetchMock.mockRejectedValue(new Error('down'));
		const { GET: GETFail } = await import('./+server');
		const failRes = await GETFail(createEvent());
		expect(failRes.headers.get('Cache-Control')).toBe('no-cache');

		vi.resetModules();
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'v1' }] })
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ updated_at: 't' })
				})
		);
		const { GET: GETOk } = await import('./+server');
		const okRes = await GETOk(createEvent());
		expect(okRes.headers.get('Cache-Control')).toContain('max-age');
	});
});

describe('GET /api/repo-info cache', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not refetch within TTL then refetches after expiry', async () => {
		vi.useFakeTimers({ now: 0 });
		vi.resetModules();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'v1' }] })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ updated_at: 't1' }) })
			.mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'v2' }] })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ updated_at: 't2' }) });
		vi.stubGlobal('fetch', fetchMock);
		const { GET } = await import('./+server');

		const r1 = await GET(createEvent());
		expect(r1.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const j1 = await r1.json();
		expect(j1.latest_tag).toBe('v1');

		const r2 = await GET(createEvent());
		expect(r2.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const j2 = await r2.json();
		expect(j2.latest_tag).toBe('v1');

		vi.setSystemTime(5 * 60 * 1000 + 1);
		const r3 = await GET(createEvent());
		expect(r3.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(4);
		const j3 = await r3.json();
		expect(j3.latest_tag).toBe('v2');
		expect(j3.updated_at).toBe('t2');
	});
});
