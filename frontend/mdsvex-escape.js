/**
 * Remark plugin that keeps markdown prose literal through the Svelte compile.
 * mdsvex emits text and inline html verbatim, so a bare `{`, `<` or `>` in doc
 * prose is parsed as an expression or element. That silently empties
 * placeholders such as {config_dir}, hard-fails the build on malformed
 * expressions like {MaxAttempts: 5}, and turns <name> into a bogus element.
 * Escaping them here renders the text as written.
 */

const KNOWN_TAGS = new Set([
	'a',
	'abbr',
	'b',
	'blockquote',
	'br',
	'button',
	'caption',
	'cite',
	'code',
	'col',
	'colgroup',
	'dd',
	'del',
	'details',
	'dfn',
	'div',
	'dl',
	'dt',
	'em',
	'figcaption',
	'figure',
	'footer',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'header',
	'hr',
	'i',
	'img',
	'input',
	'ins',
	'kbd',
	'label',
	'li',
	'main',
	'mark',
	'nav',
	'ol',
	'p',
	'pre',
	's',
	'section',
	'small',
	'span',
	'strong',
	'sub',
	'summary',
	'sup',
	'table',
	'tbody',
	'td',
	'tfoot',
	'th',
	'thead',
	'tr',
	'u',
	'ul',
	'var',
	'video',
	'audio',
	'source'
]);

/** @param {string} value */
function escapeText(value) {
	return value
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\{/g, '&#123;')
		.replace(/\}/g, '&#125;');
}

/** @param {string} value */
function isRealHtml(value) {
	if (value.trimStart().startsWith('<!--')) return true;
	const match = value.match(/^\s*<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
	return match !== null && KNOWN_TAGS.has(match[1].toLowerCase());
}

/** @param {{ type: string, value?: string, children?: unknown[] }} node */
function walk(node) {
	if (node.type === 'html' && typeof node.value === 'string' && !isRealHtml(node.value)) {
		node.type = 'text';
	}
	if ((node.type === 'text' || node.type === 'inlineCode') && typeof node.value === 'string') {
		node.value = escapeText(node.value);
	}
	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			walk(/** @type {{ type: string, value?: string, children?: unknown[] }} */ (child));
		}
	}
}

export function escapeProse() {
	return walk;
}
