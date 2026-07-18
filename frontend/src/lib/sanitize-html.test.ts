import { describe, it, expect } from 'vitest';
import { marked } from 'marked';
import {
	sanitizeHtml,
	sanitizeHighlightHtml,
	escapeJsonForScript,
	safeRedirectTarget,
	isSafeDocSlug
} from './sanitize-html';
import { jsonLdScript } from './seo';
import { renderDocMarkdown } from './server/docs-sync';

const XSS_PAYLOADS = [
	'<script>alert(1)</script>',
	'<img src=x onerror=alert(1)>',
	'<svg onload=alert(1)>',
	'<a href="javascript:alert(1)">click</a>',
	'<iframe src="javascript:alert(1)"></iframe>',
	'<div onclick="alert(1)">x</div>',
	'"><img src=x onerror=alert(1)>',
	'<math><mi//xlink:href="data:x,<script>alert(1)</script>">'
];

describe('sanitizeHtml XSS hardening', () => {
	it.each(XSS_PAYLOADS)('strips dangerous payload: %s', (payload) => {
		const clean = sanitizeHtml(payload);
		expect(clean.toLowerCase()).not.toContain('<script');
		expect(clean.toLowerCase()).not.toContain('onerror');
		expect(clean.toLowerCase()).not.toContain('onload');
		expect(clean.toLowerCase()).not.toContain('onclick');
		expect(clean.toLowerCase()).not.toContain('javascript:');
		expect(clean.toLowerCase()).not.toContain('<iframe');
	});

	it('keeps safe markdown HTML', () => {
		const clean = sanitizeHtml('<p>Hello <strong>world</strong></p><a href="/docs/overview">Docs</a>');
		expect(clean).toContain('<p>');
		expect(clean).toContain('<strong>');
		expect(clean).toContain('href="/docs/overview"');
	});

	it('preserves Shiki theme CSS variables in docs markup sanitize', () => {
		const dirty =
			'<pre class="shiki" style="--shiki-light:#111;--shiki-dark:#eee"><code><span style="--shiki-light:#D73A49">x</span></code></pre>';
		const clean = sanitizeHtml(dirty);
		expect(clean).toContain('--shiki-light');
		expect(clean).toContain('class="shiki"');
	});

	it('sanitizes marked output that embeds raw HTML', async () => {
		const md = '# Title\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n';
		const dirty = (await marked.parse(md)) as string;
		expect(dirty.toLowerCase()).toMatch(/script|onerror/);
		const clean = sanitizeHtml(dirty);
		expect(clean.toLowerCase()).not.toContain('<script');
		expect(clean.toLowerCase()).not.toContain('onerror');
	});
});

describe('sanitizeHighlightHtml', () => {
	it('allows class and style used by Shiki', () => {
		const dirty =
			'<pre class="shiki" style="--shiki-light:#111"><code><span style="color:red">x</span></code></pre><img src=x onerror=alert(1)>';
		const clean = sanitizeHighlightHtml(dirty);
		expect(clean).toContain('class="shiki"');
		expect(clean).toContain('style=');
		expect(clean.toLowerCase()).not.toContain('onerror');
	});
});

describe('jsonLdScript XSS / breakout', () => {
	it('escapes script-closing sequences in JSON-LD', () => {
		const evil = JSON.stringify({ name: '</script><script>alert(1)</script>' });
		const out = jsonLdScript(evil);
		expect(out).toContain('\\u003c/script\\u003e');
		expect(out).not.toMatch(/<\/script><script>/i);
	});

	it('escapeJsonForScript encodes angle brackets', () => {
		expect(escapeJsonForScript('<&>')).toBe('\\u003c\\u0026\\u003e');
	});
});

describe('safeRedirectTarget', () => {
	it('allows same-origin relative paths', () => {
		expect(safeRedirectTarget('/docs')).toBe('/docs');
		expect(safeRedirectTarget('/docs?q=1')).toBe('/docs?q=1');
	});

	it('rejects open redirects', () => {
		expect(safeRedirectTarget('https://evil.example')).toBe('/');
		expect(safeRedirectTarget('//evil.example')).toBe('/');
		expect(safeRedirectTarget('/\\evil')).toBe('/');
		expect(safeRedirectTarget(null)).toBe('/');
	});
});

describe('isSafeDocSlug', () => {
	it('accepts kebab-case slugs', () => {
		expect(isSafeDocSlug('overview')).toBe(true);
		expect(isSafeDocSlug('getting-started')).toBe(true);
	});

	it('rejects path traversal and odd characters', () => {
		expect(isSafeDocSlug('../etc/passwd')).toBe(false);
		expect(isSafeDocSlug('..')).toBe(false);
		expect(isSafeDocSlug('foo/bar')).toBe(false);
		expect(isSafeDocSlug('Foo')).toBe(false);
		expect(isSafeDocSlug('a.md')).toBe(false);
	});
});

describe('renderDocMarkdown', () => {
	it('returns sanitized HTML for XSS markdown', async () => {
		const html = await renderDocMarkdown(
			'# Hi\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))\n'
		);
		expect(html.toLowerCase()).not.toContain('<script');
		expect(html.toLowerCase()).not.toContain('javascript:');
		expect(html).toContain('Hi');
	});

	it('highlights fenced code blocks with Shiki', async () => {
		const html = await renderDocMarkdown('# Sample\n\n```go\npackage main\n```\n');
		expect(html).toContain('shiki');
		expect(html).toContain('--shiki-light');
		expect(html).toContain('package');
	});
});
