import DOMPurify from 'isomorphic-dompurify';
import { isSafeDocSlug } from '$lib/security';

/** DOMPurify options for markdown HTML (including Shiki code blocks). */
const MARKUP_CONFIG = {
	USE_PROFILES: { html: true },
	ALLOW_UNKNOWN_PROTOCOLS: false,
	ADD_ATTR: ['target', 'style', 'class', 'tabindex'] as string[]
};

/**
 * Server-side HTML sanitization (jsdom). Keep this module under `$lib/server`
 * so it is never bundled into the browser client build.
 */
export function sanitizeHtml(dirty: string): string {
	if (!dirty) return '';
	return DOMPurify.sanitize(dirty, MARKUP_CONFIG);
}

export { isSafeDocSlug };
