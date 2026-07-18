import type { Handle, ServerInit } from '@sveltejs/kit';
import { ensureSourceZip } from '$lib/server/source-zip';
import { ensureDocsSynced } from '$lib/server/docs-sync';

export const init: ServerInit = async () => {
	ensureSourceZip().catch((err) => {
		console.error('[source-zip] startup fetch failed', err);
	});
	ensureDocsSynced().catch((err) => {
		console.error('[docs-sync] startup fetch failed', err);
	});
};

/**
 * Baseline browser hardening headers.
 * script-src allows inline theme bootstrap and WASM eval used by the demos.
 */
const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Content-Security-Policy': [
		"default-src 'self'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"object-src 'none'",
		"img-src 'self' data: blob:",
		"font-src 'self' data:",
		"style-src 'self' 'unsafe-inline'",
		"script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
		"worker-src 'self' blob:",
		"connect-src 'self' https://api.github.com https://raw.githubusercontent.com",
		'upgrade-insecure-requests'
	].join('; ')
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(key)) {
			response.headers.set(key, value);
		}
	}
	return response;
};
