import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getTutorialSlugs } from '../tutorials';
import { SITEMAP_PATHS } from '../sitemap-paths';

const root = resolve(import.meta.dirname, '../../..');

function read(rel: string) {
	return readFileSync(resolve(root, rel), 'utf8');
}

describe('reticulum guide wiring', () => {
	it('registers hub and chapter routes', () => {
		expect(existsSync(resolve(root, 'src/routes/tools/reticulum-guide/+page.svelte'))).toBe(true);
		expect(existsSync(resolve(root, 'src/routes/tools/reticulum-guide/[slug]/+page.svelte'))).toBe(
			true
		);
		expect(existsSync(resolve(root, 'src/routes/tools/reticulum-guide/[slug]/+page.ts'))).toBe(
			true
		);
	});

	it('lists the guide in tools catalog and sitemap', () => {
		expect(read('src/routes/tools/+page.svelte')).toContain('/tools/reticulum-guide');
		expect(SITEMAP_PATHS).toContain('/tools/reticulum-guide');
		for (const slug of getTutorialSlugs()) {
			expect(SITEMAP_PATHS).toContain(`/tools/reticulum-guide/${slug}`);
		}
	});

	it('uses TutorialPlayer for chapters', () => {
		expect(read('src/routes/tools/reticulum-guide/[slug]/+page.svelte')).toContain(
			'TutorialPlayer'
		);
		expect(read('src/lib/components/tutorials/TutorialPlayer.svelte')).toContain('TutorialVisual');
		expect(read('src/lib/components/tutorials/TutorialPlayer.svelte')).toContain('ChapterSidebar');
		expect(read('src/lib/components/tutorials/TutorialPlayer.svelte')).toContain('CodeCompare');
		expect(read('src/lib/components/tutorials/TutorialPlayer.svelte')).toContain(
			'TutorialInteractive'
		);
		expect(read('src/lib/components/tutorials/TutorialPlayer.svelte')).toContain('source.id');
	});

	it('shows open-chapter on mobile and on desktop hover', () => {
		const hub = read('src/routes/tools/reticulum-guide/+page.svelte');
		expect(hub).toContain('opacity-100');
		expect(hub).toContain('md:opacity-0');
		expect(hub).toContain('md:group-hover:opacity-100');
	});

	it('highlights tutorial code with vendored Shiki', () => {
		expect(read('src/lib/components/tutorials/CodeCompare.svelte')).toContain('highlightCode');
		expect(read('src/lib/code-highlight.ts')).toContain('createHighlighter');
	});
});
