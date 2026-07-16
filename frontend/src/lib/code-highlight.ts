import { createHighlighter, type Highlighter } from 'shiki';

const LANGS = ['go', 'python', 'bash', 'plaintext', 'json', 'typescript', 'javascript'] as const;

const LANG_ALIASES: Record<string, string> = {
	py: 'python',
	sh: 'bash',
	shell: 'bash',
	js: 'javascript',
	ts: 'typescript',
	text: 'plaintext',
	txt: 'plaintext'
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

/**
 * Highlight code with vendored Shiki (same themes as docs).
 * Returns HTML suitable for {@html} with dual light/dark CSS variables.
 */
export async function highlightCode(code: string, lang: string): Promise<string> {
	const highlighter = await getHighlighter();
	const language = resolveLang(lang, highlighter);
	return highlighter.codeToHtml(code, {
		lang: language,
		themes: {
			light: 'github-light',
			dark: 'github-dark'
		},
		defaultColor: false
	});
}
