import { describe, it, expect, vi } from 'vitest';
import { handle } from './hooks.server';

describe('security headers handle', () => {
	it('sets CSP and framing protections on responses', async () => {
		const resolve = vi.fn(async () => new Response('ok', { status: 200 }));
		const response = await handle({
			event: {} as never,
			resolve
		});

		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response.headers.get('X-Frame-Options')).toBe('DENY');
		expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
		expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
		expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
		const csp = response.headers.get('Content-Security-Policy') ?? '';
		expect(csp).toContain("default-src 'self'");
		expect(csp).toContain("frame-ancestors 'none'");
		expect(csp).toContain("object-src 'none'");
		expect(csp).toContain("'wasm-unsafe-eval'");
		expect(csp).toContain('https://api.github.com');
	});
});
