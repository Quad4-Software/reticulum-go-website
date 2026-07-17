import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

function read(rel: string) {
	return readFileSync(resolve(root, rel), 'utf8');
}

describe('micron editor tool', () => {
	it('vendors micron-parser-go wasm for offline PWA use', () => {
		const wasmPath = resolve(root, 'static/micron-parser-go.wasm');
		expect(existsSync(wasmPath)).toBe(true);
		const buf = readFileSync(wasmPath);
		expect(buf.byteLength).toBeGreaterThan(1_000_000);
		expect(buf.subarray(0, 4).toString()).toBe('\0asm');

		const execPath = resolve(root, 'static/micron-wasm_exec.js');
		expect(existsSync(execPath)).toBe(true);
		expect(readFileSync(execPath, 'utf8')).toContain('Go');
	});

	it('wires tools routes and discovery surfaces', () => {
		expect(read('src/routes/tools/+page.svelte')).toContain('/tools/micron-editor');
		expect(read('src/routes/tools/micron-editor/+page.svelte')).toContain('MicronEditor');
		expect(read('src/routes/interactive/+page.svelte')).toContain('/tools/micron-editor');
		expect(read('src/lib/sitemap-paths.ts')).toContain('/tools/micron-editor');
		expect(read('src/lib/components/Navbar.svelte')).toContain('href="/tools"');
		expect(read('src/routes/apps/+page.svelte')).toContain("demoLink: '/tools/micron-editor'");
	});

	it('declares SHA-384 SRI for micron and reticulum wasm', () => {
		const sri = JSON.parse(read('static/wasm-sri.json')) as {
			assets: Record<string, { sri: string }>;
		};
		expect(sri.assets['/micron-parser-go.wasm']?.sri).toMatch(/^sha384-/);
		expect(sri.assets['/reticulum-go.wasm']?.sri).toMatch(/^sha384-/);
		expect(read('src/lib/micron-parser.ts')).toContain('fetchWasmWithSri');
		expect(read('src/lib/micron-parser.ts')).toContain('micron-wasm_exec.js');
		expect(read('src/lib/reticulum.svelte.ts')).toContain('fetchWasmWithSri');
		expect(read('src/lib/wasm-sri.ts')).toContain('normalizeWasmSriRaw');
		expect(read('src/lib/components/MicronEditor.svelte')).toContain('loadError');
	});

	it('loads micron wasm from a client $effect (onMount is unreliable here)', () => {
		const editor = read('src/lib/components/MicronEditor.svelte');
		expect(editor).not.toMatch(/\bonMount\b/);
		expect(editor).toContain('ensureMicronParser');
		expect(editor).toContain('$effect');
		expect(editor).toContain('MICRON_SNIPPETS');
		expect(editor).toContain('findMicronColors');
		expect(editor).toContain('tabDownloadName');
		expect(editor).toContain('findMicronColorAt');
		expect(editor).toContain('colorPopoverStyle');
		const parser = read('src/lib/micron-parser.ts');
		expect(parser).not.toMatch(/from '\$app\/environment'/);
		expect(parser).toContain('waitForMicronConvert');
	});

	it('keeps mobile workbench chrome compact and overflow-safe', () => {
		const editor = read('src/lib/components/MicronEditor.svelte');
		expect(editor).toContain('overflow-x-clip');
		expect(editor).toContain('snippetsOpen');
		expect(editor).toContain('h-[min(85dvh,52rem)]');
		expect(editor).toContain('md:h-[calc(100dvh-11rem)]');
		expect(editor).toContain('safe-area-inset-bottom');
		expect(editor).toContain('popOutEditor');
		expect(editor).toContain('popout');
		expect(editor).not.toContain('tools.micron_editor.ready');
	});

	it('keeps source stacked above preview on mobile without a tab switcher', () => {
		const editor = read('src/lib/components/MicronEditor.svelte');
		expect(editor).toContain('grid-rows-2');
		expect(editor).not.toContain('mobileTab');
		expect(editor).not.toMatch(/hidden md:flex/);
	});

	it('shows a floating hover color picker without overlaying source text', () => {
		const editor = read('src/lib/components/MicronEditor.svelte');
		expect(editor).toContain('hoveredColor');
		expect(editor).toContain('onSourceMouseMove');
		expect(editor).toContain('colorPopoverStyle');
		expect(editor).not.toContain('colorSquareStyle');
		expect(editor).not.toContain('afterHexColumn');
		expect(editor).toContain('wrap="off"');
	});
});
