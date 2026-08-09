import { readable } from 'svelte/store';

/** Minimal formatter for component tests (keys used in Navbar / Footer snippets). */
export function createTestFormatter() {
	return (key: string, opts?: { values?: Record<string, unknown> }) => {
		if (key === 'common.last_activity' && opts?.values?.time) {
			return `Last activity: ${opts.values.time}`;
		}
		const map: Record<string, string> = {
			'home.title': 'Reticulum-Go',
			'common.home': 'Home',
			'common.docs': 'Docs',
			'common.interactive': 'Interactive',
			'common.tools': 'Tools',
			'common.apps': 'Apps',
			'tools.micron_editor.reset': 'Reset sample',
			'tools.micron_editor.clear': 'Clear',
			'tools.micron_editor.copy': 'Copy',
			'tools.micron_editor.copied': 'Copied',
			'tools.micron_editor.download': 'Download',
			'tools.micron_editor.retry': 'Retry',
			'tools.micron_editor.monospace': 'Monospace',
			'tools.micron_editor.source': 'Source',
			'tools.micron_editor.preview': 'Preview',
			'tools.micron_editor.loading': 'Loading Micron WASM…',
			'tools.micron_editor.ready': 'Live preview ready',
			'tools.micron_editor.error': 'Failed to load Micron WASM',
			'tools.micron_editor.snippets': 'Snippets',
			'tools.micron_editor.cheatsheet': 'Cheatsheet',
			'tools.micron_editor.insert_snippet': 'Insert snippet',
			'tools.micron_editor.lines': 'Lines',
			'tools.micron_editor.chars': 'Chars',
			'tools.micron_editor.undo': 'Undo',
			'tools.micron_editor.redo': 'Redo',
			'tools.micron_editor.fullscreen': 'Fullscreen',
			'tools.micron_editor.exit_fullscreen': 'Exit fullscreen',
			'tools.micron_editor.new_tab': 'Editor tabs',
			'tools.micron_editor.close_tab': 'Close tab',
			'tools.micron_editor.rename_tab': 'Rename tab',
			'tools.micron_editor.colors': 'Colors',
			'tools.micron_editor.no_colors': 'No F/B colors in this page',
			'tools.micron_editor.next_steps': 'Next steps',
			'tools.micron_editor.add_tab': 'Add tab',
			'common.alpha': 'Alpha',
			'common.donate': 'Donate',
			'common.privacy': 'Privacy',
			'common.contact': 'Contact',
			'common.source_code': 'Source Code',
			'common.rss_development': 'RSS: Development',
			'common.rss_releases': 'RSS: Releases',
			'common.rss_copied': 'Copied',
			'time.days': 'days',
			'time.hours': 'hours'
		};
		return map[key] ?? key;
	};
}

export function getMockI18nStores(localeCode = 'en') {
	const fmt = createTestFormatter();
	return {
		t: readable(fmt),
		locale: readable(localeCode),
		locales: readable(['en', 'de', 'ru', 'it'])
	};
}
