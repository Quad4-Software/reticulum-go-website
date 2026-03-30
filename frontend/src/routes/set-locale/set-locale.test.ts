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

describe('GET /set-locale', () => {
	it('redirects and sets locale cookie for supported locales', async () => {
		const cookiesSet = vi.fn();
		const { GET } = await import('./+server');
		try {
			await GET(miniEvent(new URL('http://localhost/set-locale?locale=de&redirect=/docs'), cookiesSet) as never);
			expect.fail('expected redirect');
		} catch (e) {
			if (!isRedirect(e)) throw e;
			expect(e.status).toBe(303);
			expect(e.location).toBe('/docs');
		}
		expect(cookiesSet).toHaveBeenCalledWith(
			'locale',
			'de',
			expect.objectContaining({ path: '/', sameSite: 'lax' })
		);
	});

	it('redirects without setting cookie for unsupported locale', async () => {
		const cookiesSet = vi.fn();
		const { GET } = await import('./+server');
		try {
			await GET(miniEvent(new URL('http://localhost/set-locale?locale=xx&redirect=/'), cookiesSet) as never);
			expect.fail('expected redirect');
		} catch (e) {
			if (!isRedirect(e)) throw e;
			expect(e.location).toBe('/');
		}
		expect(cookiesSet).not.toHaveBeenCalled();
	});

	it('uses safe redirect target for open redirects', async () => {
		const { GET } = await import('./+server');
		try {
			await GET(miniEvent(new URL('http://localhost/set-locale?locale=en&redirect=https://evil.example'), vi.fn()) as never);
			expect.fail('expected redirect');
		} catch (e) {
			if (!isRedirect(e)) throw e;
			expect(e.location).toBe('/');
		}
	});

	it('rejects protocol-relative redirect targets', async () => {
		const { GET } = await import('./+server');
		try {
			await GET(miniEvent(new URL('http://localhost/set-locale?locale=en&redirect=//evil.example'), vi.fn()) as never);
			expect.fail('expected redirect');
		} catch (e) {
			if (!isRedirect(e)) throw e;
			expect(e.location).toBe('/');
		}
	});
});
