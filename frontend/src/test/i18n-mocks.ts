import { readable } from 'svelte/store';

/** Minimal formatter for component tests (keys used in Navbar / Footer snippets). */
export function createTestFormatter() {
	return (key: string, opts?: { values?: Record<string, unknown> }) => {
		if (key === 'common.last_activity' && opts?.values?.time) {
			return `Last activity: ${opts.values.time}`;
		}
		if (key === 'tools.reticulum_guide.step_of' && opts?.values) {
			return `Step ${opts.values.current} of ${opts.values.total}`;
		}
		if (key === 'tools.reticulum_guide.hops_label' && opts?.values) {
			return `Hops: ${opts.values.hops}`;
		}
		if (key === 'tools.reticulum_guide.pathfinder_note' && opts?.values) {
			return `PATHFINDER_M is ${opts.values.m}`;
		}
		if (key === 'tools.reticulum_guide.steps_count' && opts?.values) {
			return `${opts.values.count} steps`;
		}
		if (key === 'tools.reticulum_guide.bytes_label' && opts?.values) {
			return `${opts.values.bytes} bytes`;
		}
		const map: Record<string, string> = {
			'home.title': 'Reticulum-Go',
			'common.home': 'Home',
			'common.docs': 'Docs',
			'common.interactive': 'Interactive',
			'common.tools': 'Tools',
			'common.apps': 'Apps',
			'tools.reticulum_guide.previous': 'Previous',
			'tools.reticulum_guide.next': 'Next',
			'tools.reticulum_guide.sources': 'Sources',
			'tools.reticulum_guide.zen': 'Keeping the zen',
			'tools.reticulum_guide.step_of': 'Step {current} of {total}',
			'tools.reticulum_guide.chapters': 'Chapters',
			'tools.reticulum_guide.chapters_toggle': 'Toggle chapters',
			'tools.reticulum_guide.python': 'Python',
			'tools.reticulum_guide.go': 'Go',
			'tools.reticulum_guide.try_it': 'Try it',
			'tools.reticulum_guide.code_sample': 'Code sample',
			'tools.reticulum_guide.encrypted': 'Encrypted',
			'tools.reticulum_guide.plain': 'Plain',
			'tools.reticulum_guide.multi_hop': 'Multi-hop',
			'tools.reticulum_guide.local_only': 'Local only',
			'tools.reticulum_guide.accepted': 'Accepted',
			'tools.reticulum_guide.rejected': 'Rejected',
			'tools.reticulum_guide.interactive_title': 'Interactive',
			'tools.reticulum_guide.copy': 'Copy',
			'tools.reticulum_guide.copied': 'Copied',
			'tools.reticulum_guide.nav_hint': 'Swipe or use arrow keys',
			'tools.reticulum_guide.back_guide': 'All guide chapters',
			'tools.reticulum_guide.next_chapter': 'Next chapter',
			'tools.reticulum_guide.all_chapters': 'All chapters',
			'tools.reticulum_guide.path_title': 'Recommended path',
			'tools.reticulum_guide.path_blurb': 'Work through chapters in order.',
			'tools.reticulum_guide.steps_count': '{count} steps',
			'tools.reticulum_guide.reset': 'Reset',
			'tools.reticulum_guide.step_once': 'Step',
			'tools.reticulum_guide.hops_label': 'Hops: {hops}',
			'tools.reticulum_guide.status_moving': 'Moving',
			'tools.reticulum_guide.status_delivered': 'Delivered',
			'tools.reticulum_guide.status_dropped': 'Dropped',
			'tools.reticulum_guide.status_local_only': 'Local only',
			'tools.reticulum_guide.pathfinder_note': 'PATHFINDER_M is {m}',
			'tools.reticulum_guide.can_send_data': 'Can send data',
			'tools.reticulum_guide.yes': 'yes',
			'tools.reticulum_guide.no': 'no',
			'tools.reticulum_guide.alpha_warning': 'This guide is alpha.',
			'tools.reticulum_guide.header_type_1': 'Header type 1',
			'tools.reticulum_guide.header_type_2': 'Header type 2',
			'tools.reticulum_guide.bytes_label': '{bytes} bytes',
			'tools.reticulum_guide.blackhole_on': 'Blackhole on',
			'tools.reticulum_guide.blackhole_off': 'Blackhole off',
			'tools.reticulum_guide.in_go': 'Available in Go',
			'tools.reticulum_guide.python_ref': 'Python reference',
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
			'common.contact': 'Contact',
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
