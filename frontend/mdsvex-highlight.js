import { createHighlighter } from 'shiki';

/** Languages used in docs plus a few common extras. */
const LANGS = [
	'go',
	'bash',
	'shellscript',
	'ini',
	'plaintext',
	'json',
	'yaml',
	'toml',
	'javascript',
	'typescript',
	'python',
	'diff',
	'html',
	'css',
	'xml',
	'sql',
	'c',
	'rust'
];

/** @type {Record<string, string>} */
const LANG_ALIASES = {
	sh: 'bash',
	shell: 'bash',
	zsh: 'bash',
	text: 'plaintext',
	txt: 'plaintext',
	conf: 'ini',
	cfg: 'ini',
	properties: 'ini',
	js: 'javascript',
	ts: 'typescript',
	py: 'python',
	yml: 'yaml'
};

/** @type {ReturnType<typeof createHighlighter> | null} */
let highlighterPromise = null;

function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ['github-light', 'github-dark'],
			langs: LANGS
		});
	}
	return highlighterPromise;
}

/**
 * Escape characters that would break Svelte `{@html \`...\`}` injection.
 * @param {string} html
 */
function escapeSvelte(html) {
	return html
		.replace(/\\/g, '\\\\')
		.replace(/`/g, '\\`')
		.replace(/\$\{/g, '\\${')
		.replace(/\{/g, '&#123;')
		.replace(/\}/g, '&#125;');
}

/**
 * Resolve a fence language to a Shiki-loaded id.
 * @param {string | undefined} lang
 * @param {Awaited<ReturnType<typeof createHighlighter>>} highlighter
 */
function resolveLang(lang, highlighter) {
	const raw = (lang || '').trim().toLowerCase();
	if (!raw) return 'plaintext';
	const aliased = LANG_ALIASES[raw] || raw;
	const loaded = highlighter.getLoadedLanguages();
	if (loaded.includes(aliased)) return aliased;
	return 'plaintext';
}

/**
 * mdsvex highlight.highlighter: build-time Shiki HTML, dual light/dark themes.
 * @param {string} code
 * @param {string | undefined} lang
 */
export async function highlight(code, lang) {
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
	return `{@html \`${escapeSvelte(html)}\`}`;
}
