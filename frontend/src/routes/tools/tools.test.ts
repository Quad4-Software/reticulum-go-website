import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageSource = readFileSync(resolve(import.meta.dirname, './+page.svelte'), 'utf8');

describe('tools catalog', () => {
	it('lists RNODE Flasher as coming soon with tiny-reticulum-go and RNode firmware notes', () => {
		expect(pageSource).toContain("id: 'rnode-flasher'");
		expect(pageSource).toMatch(/id: 'rnode-flasher'[\s\S]*?status: 'coming-soon'/);
		expect(pageSource).toContain('tools.rnode_flasher.title');
		expect(pageSource).toContain('tiny-reticulum-go');
	});

	it('lists Bot Builder as coming soon for LXMFy-Go', () => {
		expect(pageSource).toContain("id: 'bot-builder'");
		expect(pageSource).toMatch(/id: 'bot-builder'[\s\S]*?status: 'coming-soon'/);
		expect(pageSource).toContain('tools.bot_builder.title');
		expect(pageSource).toContain('lxmfy-go');

		const builderBlock = pageSource.match(
			/\{\s*id: 'bot-builder'[\s\S]*?status: 'coming-soon'\s*\}/
		)?.[0];
		expect(builderBlock).toBeTruthy();
		expect(builderBlock).not.toContain('href:');
	});

	it('keeps available and alpha tools linked and coming-soon tools unlinked', () => {
		expect(pageSource).toContain("status === 'available' || tool.status === 'alpha'");
		expect(pageSource).toContain("href: '/tools/reticulum-guide'");
		expect(pageSource).toContain("status: 'alpha'");
		expect(pageSource).toContain('common.alpha');
		expect(pageSource).toContain("href: '/tools/micron-editor'");

		const flasherBlock = pageSource.match(
			/\{\s*id: 'rnode-flasher'[\s\S]*?status: 'coming-soon'\s*\}/
		)?.[0];
		expect(flasherBlock).toBeTruthy();
		expect(flasherBlock).not.toContain('href:');
	});
});
