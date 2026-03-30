import { describe, it, expect, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

function miniEvent(url: URL, set: ReturnType<typeof vi.fn>) {
	return {
		url,
		cookies: {
			set,
			get: vi.fn(),
			getAll: vi.fn(),
			delete: vi.fn(),
			serialize: vi.fn()
		}
	};
}

describe('GET /set-theme', () => {
	it('redirects and sets theme cookie for supported themes', async () => {
		const cookiesSet = vi.fn();
		const { GET } = await import('./+server');
		try {
			await GET(miniEvent(new URL('http://localhost/set-theme?theme=dark&redirect=/'), cookiesSet) as never);
			expect.fail('expected redirect');
		} catch (e) {
			if (!isRedirect(e)) throw e;
			expect(e.status).toBe(303);
			expect(e.location).toBe('/');
		}
		expect(cookiesSet).toHaveBeenCalledWith(
			'theme',
			'dark',
			expect.objectContaining({ path: '/', sameSite: 'lax' })
		);
	});

	it('redirects without setting cookie for invalid theme', async () => {
		const cookiesSet = vi.fn();
		const { GET } = await import('./+server');
		try {
			await GET(miniEvent(new URL('http://localhost/set-theme?theme=hacker&redirect=/docs'), cookiesSet) as never);
			expect.fail('expected redirect');
		} catch (e) {
			if (!isRedirect(e)) throw e;
			expect(e.location).toBe('/docs');
		}
		expect(cookiesSet).not.toHaveBeenCalled();
	});

	it('uses safe redirect target for non-path redirect', async () => {
		const { GET } = await import('./+server');
		try {
			await GET(miniEvent(new URL('http://localhost/set-theme?theme=light&redirect=//evil.example'), vi.fn()) as never);
			expect.fail('expected redirect');
		} catch (e) {
			if (!isRedirect(e)) throw e;
			expect(e.location).toBe('/');
		}
	});
});
