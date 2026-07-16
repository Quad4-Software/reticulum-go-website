export const MICRON_EDITOR_STORAGE_KEY = 'reticulum-go.micron-editor.v1';

export const DEFAULT_MICRON_SAMPLE = `> Micron Editor

Welcome to the \`*Micron\`* live editor. Markup is parsed in your browser by Micron-Parser-Go (WASM).

>>Quick tips

\`!Bold\`!   \`*Italic\`*   \`_Underline\`_

-

\`cThis line is centered
\`a

\`Faaa\`B333
Section colors use foreground/background hex triplets.
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
		id: 'colors',
		label: 'Colors',
		insert: '`Faaa`B333colored text`f`b',
		hint: 'Foreground and background'
	}
];

export type MicronEditorState = {
	source: string;
	monospace: boolean;
};

export function loadMicronEditorState(): MicronEditorState {
	if (typeof localStorage === 'undefined') {
		return { source: DEFAULT_MICRON_SAMPLE, monospace: true };
	}
	try {
		const raw = localStorage.getItem(MICRON_EDITOR_STORAGE_KEY);
		if (!raw) return { source: DEFAULT_MICRON_SAMPLE, monospace: true };
		const parsed = JSON.parse(raw) as Partial<MicronEditorState>;
		return {
			source: typeof parsed.source === 'string' ? parsed.source : DEFAULT_MICRON_SAMPLE,
			monospace: parsed.monospace !== false
		};
	} catch {
		return { source: DEFAULT_MICRON_SAMPLE, monospace: true };
	}
}

export function saveMicronEditorState(state: MicronEditorState): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(MICRON_EDITOR_STORAGE_KEY, JSON.stringify(state));
	} catch {
		/* ignore quota */
	}
}

export function insertAtCursor(source: string, cursor: number, insert: string): {
	source: string;
	cursor: number;
} {
	const at = Math.max(0, Math.min(cursor, source.length));
	return {
		source: source.slice(0, at) + insert + source.slice(at),
		cursor: at + insert.length
	};
}
