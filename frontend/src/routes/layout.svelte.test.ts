import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const layoutPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '+layout.svelte');

describe('root layout', () => {
	it('does not gate the shell on client i18n loading', () => {
		const source = readFileSync(layoutPath, 'utf8');
		expect(source).not.toContain('isLoading');
		expect(source).not.toContain('animate-pulse');
		expect(source).toContain('data.currentLocale');
	});
});
