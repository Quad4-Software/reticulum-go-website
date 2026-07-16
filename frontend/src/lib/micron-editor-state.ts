export const MICRON_EDITOR_STORAGE_KEY = 'reticulum-go.micron-editor.v2';
const LEGACY_STORAGE_KEY = 'reticulum-go.micron-editor.v1';

export const DEFAULT_MICRON_SAMPLE = `> Micron Editor

Welcome to the \`*Micron\`* live editor. Markup is parsed in your browser by Micron-Parser-Go (WASM).

>>Quick tips

\`!Bold\`!   \`*Italic\`*   \`_Underline\`_

-

\`cThis line is centered
\`a

\`Faaa\`B333
Section colors use foreground/background hex triplets. Click the color squares above the source to pick.
\`f\`b

>>>Links and fields

\`[Micron-Parser-Go\`https://github.com/Quad4-Software/Micron-Parser-Go]

Write NomadNet-style pages here, then copy into Ren Browser or your node.
`;

export type MicronSnippet = {
	id: string;
	label: string;
	insert: string;
	hint: string;
};

export const MICRON_SNIPPETS: MicronSnippet[] = [
	{
		id: 'h1',
		label: 'Heading',
		insert: '> Heading\n\n',
		hint: 'Top-level section'
	},
	{
		id: 'h2',
		label: 'Subhead',
		insert: '>> Subheading\n\n',
		hint: 'Second-level section'
	},
	{
		id: 'bold',
		label: 'Bold',
		insert: '`!bold text`!',
		hint: 'Emphasis'
	},
	{
		id: 'italic',
		label: 'Italic',
		insert: '`*italic text`*',
		hint: 'Emphasis'
	},
	{
		id: 'link',
		label: 'Link',
		insert: '`[label`https://example.com]',
		hint: 'External or mesh URL'
	},
	{
		id: 'center',
		label: 'Center',
		insert: '`cCentered line\n`a\n',
		hint: 'Center then align reset'
	},
	{
		id: 'divider',
		label: 'Divider',
		insert: '\n-\n\n',
		hint: 'Horizontal rule'
	},
	{
		id: 'fg',
		label: 'FG color',
		insert: '`F0a0text`f',
		hint: 'Foreground color tag'
	},
	{
		id: 'bg',
		label: 'BG color',
		insert: '`B333text`b',
		hint: 'Background color tag'
	}
];

export type MicronTab = {
	id: string;
	name: string;
	source: string;
};

export type MicronEditorState = {
	tabs: MicronTab[];
	activeTabId: string;
	monospace: boolean;
};

export type MicronNextStep = {
	id: string;
	title: string;
	blurb: string;
	href: string;
};

export const MICRON_NEXT_STEPS: MicronNextStep[] = [
	{
		id: 'guide',
		title: 'Reticulum Guide',
		blurb: 'Learn destinations, announces, links, and interfaces with interactive steps.',
		href: '/tools/reticulum-guide'
	},
	{
		id: 'destinations',
		title: 'Destinations chapter',
		blurb: 'How SINGLE destinations and aspect names map to pages you author in Micron.',
		href: '/tools/reticulum-guide/destinations'
	},
	{
		id: 'interfaces',
		title: 'Interfaces chapter',
		blurb: 'Which carriers Reticulum-Go speaks today, including WebSocket for browser nodes.',
		href: '/tools/reticulum-guide/interfaces-and-carriers'
	},
	{
		id: 'ren',
		title: 'Ren Browser',
		blurb: 'Browse and edit Micron pages on the mesh when the app ships.',
		href: '/apps'
	}
];

function newTabId(): string {
	return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createTab(name = 'index', source = DEFAULT_MICRON_SAMPLE): MicronTab {
	return { id: newTabId(), name, source };
}

export function defaultEditorState(): MicronEditorState {
	const tab = createTab('index', DEFAULT_MICRON_SAMPLE);
	return { tabs: [tab], activeTabId: tab.id, monospace: true };
}

function sanitizeTabName(name: string): string {
	const cleaned = name
		.trim()
		.replace(/\.mu$/i, '')
		.replace(/[^\w.\- ]+/g, '')
		.replace(/\s+/g, '-')
		.slice(0, 64);
	return cleaned || 'index';
}

export function tabDownloadName(name: string): string {
	return `${sanitizeTabName(name)}.mu`;
}

export function loadMicronEditorState(): MicronEditorState {
	if (typeof localStorage === 'undefined') return defaultEditorState();
	try {
		const raw = localStorage.getItem(MICRON_EDITOR_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<MicronEditorState>;
			return normalizeState(parsed);
		}
		const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
		if (legacy) {
			const parsed = JSON.parse(legacy) as { source?: string; monospace?: boolean };
			const tab = createTab(
				'index',
				typeof parsed.source === 'string' ? parsed.source : DEFAULT_MICRON_SAMPLE
			);
			return {
				tabs: [tab],
				activeTabId: tab.id,
				monospace: parsed.monospace !== false
			};
		}
		return defaultEditorState();
	} catch {
		return defaultEditorState();
	}
}

function normalizeState(parsed: Partial<MicronEditorState>): MicronEditorState {
	const fallback = defaultEditorState();
	const tabs = Array.isArray(parsed.tabs)
		? parsed.tabs
				.filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string')
				.map((t) => ({
					id: t.id,
					name: sanitizeTabName(t.name),
					source: typeof t.source === 'string' ? t.source : DEFAULT_MICRON_SAMPLE
				}))
		: [];
	if (tabs.length === 0) return fallback;
	const activeTabId =
		typeof parsed.activeTabId === 'string' && tabs.some((t) => t.id === parsed.activeTabId)
			? parsed.activeTabId
			: tabs[0].id;
	return {
		tabs,
		activeTabId,
		monospace: parsed.monospace !== false
	};
}

export function saveMicronEditorState(state: MicronEditorState): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(MICRON_EDITOR_STORAGE_KEY, JSON.stringify(state));
	} catch {
		/* ignore quota */
	}
}

export function insertAtCursor(
	source: string,
	cursor: number,
	insert: string
): { source: string; cursor: number } {
	const at = Math.max(0, Math.min(cursor, source.length));
	return {
		source: source.slice(0, at) + insert + source.slice(at),
		cursor: at + insert.length
	};
}

export { sanitizeTabName };
