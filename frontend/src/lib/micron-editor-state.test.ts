import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	DEFAULT_MICRON_SAMPLE,
	MICRON_EDITOR_STORAGE_KEY,
	MICRON_SNIPPETS,
	insertAtCursor,
	loadMicronEditorState,
	saveMicronEditorState
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

	it('returns the default sample when nothing is stored', () => {
		expect(loadMicronEditorState()).toEqual({
			source: DEFAULT_MICRON_SAMPLE,
			monospace: true
		});
	});

	it('round-trips source and monospace preference', () => {
		saveMicronEditorState({ source: '> Hello', monospace: false });
		expect(localStorage.getItem(MICRON_EDITOR_STORAGE_KEY)).toContain('Hello');
		expect(loadMicronEditorState()).toEqual({ source: '> Hello', monospace: false });
	});

	it('falls back safely on corrupt storage', () => {
		localStorage.setItem(MICRON_EDITOR_STORAGE_KEY, '{not-json');
		expect(loadMicronEditorState().source).toBe(DEFAULT_MICRON_SAMPLE);
	});

	it('inserts snippets at the cursor', () => {
		expect(insertAtCursor('ab', 1, 'X')).toEqual({ source: 'aXb', cursor: 2 });
		expect(MICRON_SNIPPETS.length).toBeGreaterThan(3);
		expect(MICRON_SNIPPETS.some((s) => s.id === 'bold')).toBe(true);
	});
});
