import { describe, it, expect } from 'vitest';
import { highlightCode } from './code-highlight';

describe('code-highlight', () => {
	it('highlights Go with shiki dual themes', async () => {
		const html = await highlightCode('package main\n\nfunc main() {}\n', 'go');
		expect(html).toContain('shiki');
		expect(html).toContain('--shiki-light');
		expect(html).toContain('package');
	});

	it('highlights Python samples', async () => {
		const html = await highlightCode('import RNS\n\nidentity = RNS.Identity()\n', 'python');
		expect(html).toContain('shiki');
		expect(html).toContain('RNS');
	});

	it('falls back to plaintext for unknown languages', async () => {
		const html = await highlightCode('hello', 'not-a-real-lang');
		expect(html).toContain('shiki');
	});
});
