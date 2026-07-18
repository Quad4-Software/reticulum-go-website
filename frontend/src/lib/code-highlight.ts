import { createHighlighter, type Highlighter } from 'shiki';
import { sanitizeHighlightHtml } from '$lib/sanitize-html';

const LANGS = [
	'go',
	'python',
	'bash',
	'plaintext',
	'json',
	'typescript',
	'javascript',
	'yaml',
	'toml',
	'ini',
	'diff',
	'html',
	'css',
	'xml',
	'sql',
	'c',
	'rust',
	'shellscript'
] as const;

const LANG_ALIASES: Record<string, string> = {
	py: 'python',
	sh: 'bash',
	shell: 'bash',
	zsh: 'bash',
	js: 'javascript',
	ts: 'typescript',
	text: 'plaintext',
	txt: 'plaintext',
	yml: 'yaml',
	conf: 'ini',
	cfg: 'ini',
	properties: 'ini'
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ['github-light', 'github-dark'],
			langs: [...LANGS]
		});
	}
	return highlighterPromise;
}

function resolveLang(lang: string | undefined, highlighter: Highlighter): string {
	const raw = (lang || '').trim().toLowerCase();
	if (!raw) return 'plaintext';
	const aliased = LANG_ALIASES[raw] || raw;
	const loaded = highlighter.getLoadedLanguages();
	if (loaded.includes(aliased)) return aliased;
	return 'plaintext';
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

/**
 * Highlight code with vendored Shiki (same themes as docs).
 * Returns HTML suitable for `{@html}` with dual light/dark CSS variables.
 */
export async function highlightCode(code: string, lang: string): Promise<string> {
	const highlighter = await getHighlighter();
	const language = resolveLang(lang, highlighter);
	const html = highlighter.codeToHtml(code, {
		lang: language,
		themes: {
			light: 'github-light',
			dark: 'github-dark'
		},
		defaultColor: false
	});
	return sanitizeHighlightHtml(html);
}

const MARKED_CODE_BLOCK_RE =
	/<pre><code(?:\s+class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/gi;

/**
 * Replace marked `<pre><code class="language-…">` blocks with Shiki HTML.
 * Used for runtime-cached docs that are not compiled through mdsvex.
 */
export async function highlightMarkedCodeBlocks(html: string): Promise<string> {
	const matches = [...html.matchAll(MARKED_CODE_BLOCK_RE)];
	if (matches.length === 0) return html;

	let out = html;
	for (const match of matches) {
		const full = match[0];
		const lang = match[1] || 'plaintext';
		const code = decodeHtmlEntities(match[2].replace(/\n$/, ''));
		const highlighted = await highlightCode(code, lang);
		out = out.replace(full, highlighted);
	}
	return out;
}
