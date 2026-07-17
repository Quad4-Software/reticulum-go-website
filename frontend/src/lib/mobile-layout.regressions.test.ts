import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DOC_SLUGS } from '$lib/docs-config';

const root = resolve(import.meta.dirname, '../..');

function read(rel: string) {
	return readFileSync(resolve(root, rel), 'utf8');
}

describe('mobile shell: white bar and overflow guards', () => {
	it('uses dynamic viewport height and clips horizontal overflow on the root shell', () => {
		const layout = read('src/routes/+layout.svelte');
		expect(layout).toContain('min-h-dvh');
		expect(layout).toContain('min-w-0');
		expect(layout).not.toMatch(/min-h-screen(?!-)/);

		const css = read('src/app.css');
		expect(css).toContain('overflow-x: clip');
	});

	it('opts into viewport-fit cover and paints html/body with theme page background', () => {
		const html = read('src/app.html');
		expect(html).toContain('viewport-fit=cover');

		const css = read('src/app.css');
		expect(css).toContain('--page-bg');
		expect(css).toContain('100dvh');
		expect(css).toContain('overflow-x: clip');
		expect(css).toContain('safe-area-inset-bottom');
	});

	it('pads the site footer for the home indicator safe area', () => {
		const footer = read('src/lib/components/Footer.svelte');
		expect(footer).toContain('safe-area-inset-bottom');
		expect(footer).toMatch(/pb-\[calc\(3rem\+env\(safe-area-inset-bottom/);
	});
});

describe('docs mobile navigation', () => {
	it('hides the long nav behind a mobile drawer instead of stacking it always', () => {
		const docsLayout = read('src/routes/docs/+layout.svelte');
		expect(docsLayout).toContain('mobileMenuOpen');
		expect(docsLayout).toContain('docs_menu');
		expect(docsLayout).toContain('docs_menu_close');
		expect(docsLayout).toContain('md:hidden');
		expect(docsLayout).toMatch(/hidden[\s\S]*?md:block/);
		expect(docsLayout).toContain('max-h-[calc(100dvh-7rem)]');
		expect(docsLayout).toContain("document.body.style.overflow = 'hidden'");
		expect(docsLayout).toContain('Escape');
		expect(docsLayout).toContain('microvm');
	});

	it('lists every synced english doc slug including microvm', () => {
		expect(DOC_SLUGS).toContain('microvm');
		expect(DOC_SLUGS.length).toBe(20);
	});
});

describe('reticulum guide mobile navigation', () => {
	it('opens chapters in an overlay drawer on small screens', () => {
		const sidebar = read('src/lib/components/tutorials/ChapterSidebar.svelte');
		expect(sidebar).toContain('mobileOpen');
		expect(sidebar).toContain('chapters_close');
		expect(sidebar).toContain('md:hidden');
		expect(sidebar).toContain('fixed inset-0');
		expect(sidebar).toContain("document.body.style.overflow = 'hidden'");
		expect(sidebar).toContain('Escape');
	});

	it('keeps step dots scrollable and bottom chrome safe-area aware', () => {
		const player = read('src/lib/components/tutorials/TutorialPlayer.svelte');
		expect(player).toContain('overflow-x-auto');
		expect(player).toContain('pb-[env(safe-area-inset-bottom,0px)]');
		expect(player).toContain('fixed inset-x-0 bottom-0');
		expect(player).toContain('min-w-0');
		expect(player).toContain('shrink-0');
		expect(player).not.toContain('backdrop-blur');
		expect(player).not.toContain('bg-white/95');
	});
});

describe('micron editor mobile workbench', () => {
	it('uses compact chrome, safe-area fullscreen, and overflow-safe panes', () => {
		const editor = read('src/lib/components/MicronEditor.svelte');
		expect(editor).toContain('overflow-x-clip');
		expect(editor).toContain('safe-area-inset-top');
		expect(editor).toContain('safe-area-inset-bottom');
		expect(editor).toContain('h-[min(85dvh,52rem)]');
		expect(editor).toContain('md:h-[calc(100dvh-11rem)]');
		expect(editor).toContain('snippetsOpen');
		expect(editor).toContain('overflow-x-auto');
		expect(editor).not.toContain('min-h-[32rem]');
		expect(editor).not.toContain('tools.micron_editor.ready');
	});

	it('stacks source above preview on mobile with both panes always visible', () => {
		const editor = read('src/lib/components/MicronEditor.svelte');
		expect(editor).toContain('grid-rows-2');
		expect(editor).toContain('md:grid-cols-2');
		expect(editor).toContain('md:grid-rows-1');
		expect(editor).not.toContain('mobileTab');
		expect(editor).not.toContain('MobileTab');
		expect(editor).not.toMatch(/hidden md:flex/);
		expect(editor).not.toMatch(/Code2/);
		expect(editor).not.toMatch(/\bEye\b/);
	});
});
