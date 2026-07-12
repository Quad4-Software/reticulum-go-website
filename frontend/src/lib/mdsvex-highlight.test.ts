import { describe, expect, it } from 'vitest';
import { highlight } from '../../mdsvex-highlight.js';

describe('mdsvex-highlight', () => {
	it('returns svelte {@html} for go code', async () => {
		const out = await highlight('package main\n\nfunc main() {}\n', 'go');
		expect(out.startsWith('{@html `')).toBe(true);
		expect(out.endsWith('`}')).toBe(true);
		expect(out).toContain('shiki');
		expect(out).toContain('github-light');
		expect(out).toContain('github-dark');
		expect(out).toContain('package');
	});

	it('falls back to plaintext for unknown languages', async () => {
		const out = await highlight('hello world', 'not-a-real-lang');
		expect(out).toContain('shiki');
		expect(out).toContain('hello world');
	});

	it('escapes curly braces so svelte does not parse them', async () => {
		const out = await highlight('x := map[string]int{"a": 1}', 'go');
		expect(out).toContain('&#123;');
		expect(out).toContain('&#125;');
		expect(out).not.toMatch(/\{@html `[\s\S]*[^&#]\{[^@]/);
	});
});
