/**
 * Escape JSON for embedding inside a `<script type="application/ld+json">` tag.
 * Prevents `</script>` breakout and HTML parsing surprises.
 */
export function escapeJsonForScript(json: string): string {
	return json
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

/** Same-origin relative path only. Rejects open redirects and protocol-relative URLs. */
export function safeRedirectTarget(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
	if (value.includes('\\') || value.includes('\0')) return '/';
	return value;
}

/** Doc slug allowlist: lowercase kebab-case only (blocks path traversal). */
export function isSafeDocSlug(slug: string): boolean {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
