import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	DEFAULT_MICRON_SAMPLE,
	MICRON_EDITOR_STORAGE_KEY,
	MICRON_SNIPPETS,
	createTab,
	insertAtCursor,
	loadMicronEditorState,
	saveMicronEditorState,
	tabDownloadName,
	sanitizeTabName
} from './micron-editor-state';

function mockLocalStorage() {
	const store = new Map<string, string>();
	Object.defineProperty(window, 'localStorage', {
		configurable: true,
		writable: true,
		value: {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => {
				store.set(key, value);
			},
			removeItem: (key: string) => {
				store.delete(key);
			},
			clear: () => store.clear()
		}
	});
	return store;
}

describe('micron-editor-state', () => {
	beforeEach(() => {
		mockLocalStorage();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns a default index tab when nothing is stored', () => {
		const state = loadMicronEditorState();
		expect(state.tabs).toHaveLength(1);
		expect(state.tabs[0].name).toBe('index');
		expect(state.tabs[0].source).toBe(DEFAULT_MICRON_SAMPLE);
		expect(state.activeTabId).toBe(state.tabs[0].id);
		expect(state.monospace).toBe(true);
	});

	it('round-trips tabs and monospace preference', () => {
		const tab = createTab('home', '> Hello');
		saveMicronEditorState({ tabs: [tab], activeTabId: tab.id, monospace: false });
		expect(localStorage.getItem(MICRON_EDITOR_STORAGE_KEY)).toContain('Hello');
		const loaded = loadMicronEditorState();
		expect(loaded.tabs[0].source).toBe('> Hello');
		expect(loaded.tabs[0].name).toBe('home');
		expect(loaded.monospace).toBe(false);
	});

	it('migrates legacy v1 storage into an index tab', () => {
		localStorage.setItem(
			'reticulum-go.micron-editor.v1',
			JSON.stringify({ source: '> Legacy', monospace: false })
		);
		const loaded = loadMicronEditorState();
		expect(loaded.tabs[0].name).toBe('index');
		expect(loaded.tabs[0].source).toBe('> Legacy');
		expect(loaded.monospace).toBe(false);
	});

	it('falls back safely on corrupt storage', () => {
		localStorage.setItem(MICRON_EDITOR_STORAGE_KEY, '{not-json');
		expect(loadMicronEditorState().tabs[0].source).toBe(DEFAULT_MICRON_SAMPLE);
	});

	it('inserts snippets at the cursor', () => {
		expect(insertAtCursor('ab', 1, 'X')).toEqual({ source: 'aXb', cursor: 2 });
		expect(MICRON_SNIPPETS.length).toBeGreaterThan(3);
		expect(MICRON_SNIPPETS.some((s) => s.id === 'bold')).toBe(true);
	});

	it('builds download names from tab titles', () => {
		expect(tabDownloadName('index')).toBe('index.mu');
		expect(tabDownloadName('My Page.mu')).toBe('My-Page.mu');
		expect(sanitizeTabName('')).toBe('index');
	});
});
