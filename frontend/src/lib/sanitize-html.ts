import createDOMPurify from 'dompurify';

/** DOMPurify options for markdown HTML (including Shiki code blocks). */
const MARKUP_CONFIG = {
	USE_PROFILES: { html: true },
	ALLOW_UNKNOWN_PROTOCOLS: false,
	ADD_ATTR: ['target', 'style', 'class', 'tabindex'] as string[]
};

/** Options for syntax-highlighted code blocks (class/style from Shiki). */
const HIGHLIGHT_CONFIG = {
	USE_PROFILES: { html: true },
	ALLOW_UNKNOWN_PROTOCOLS: false,
	ADD_ATTR: ['style', 'class', 'tabindex'] as string[]
};

/**
 * Browser DOMPurify. On SSR without a window, applies a conservative strip
 * so client-bundled code never pulls in isomorphic-dompurify/jsdom.
 */
function purifyBrowser() {
	return createDOMPurify(window);
}

function stripDangerousFallback(dirty: string): string {
	return dirty
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
		.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/javascript:/gi, '');
}

/**
 * Sanitize untrusted HTML before `{@html}`.
 * Strips scripts, event handlers, and javascript: URLs.
 */
export function sanitizeHtml(dirty: string): string {
	if (!dirty) return '';
	if (typeof window === 'undefined') return stripDangerousFallback(dirty);
	return purifyBrowser().sanitize(dirty, MARKUP_CONFIG);
}

/** Sanitize Shiki / highlight HTML while keeping theme classes and styles. */
export function sanitizeHighlightHtml(dirty: string): string {
	if (!dirty) return '';
	if (typeof window === 'undefined') return stripDangerousFallback(dirty);
	return purifyBrowser().sanitize(dirty, HIGHLIGHT_CONFIG);
}

export {
	escapeJsonForScript,
	safeRedirectTarget,
	isSafeDocSlug
} from './security';
