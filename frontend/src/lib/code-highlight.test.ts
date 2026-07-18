import { describe, it, expect } from 'vitest';
import { highlightCode, highlightMarkedCodeBlocks } from './code-highlight';

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

	it('highlights marked pre/code blocks for runtime docs', async () => {
		const markedHtml =
			'<p>Intro</p>\n<pre><code class="language-go">package main\n</code></pre>\n';
		const html = await highlightMarkedCodeBlocks(markedHtml);
		expect(html).toContain('shiki');
		expect(html).toContain('--shiki-light');
		expect(html).toContain('package');
		expect(html).not.toContain('class="language-go"');
	});
});
