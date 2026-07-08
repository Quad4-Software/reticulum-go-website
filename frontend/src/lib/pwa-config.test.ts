import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const viteConfigPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../vite.config.ts');

describe('PWA production config', () => {
	it('auto-updates the service worker and prefers network for navigations', () => {
		const source = readFileSync(viteConfigPath, 'utf8');
		expect(source).toContain("registerType: 'autoUpdate'");
		expect(source).toContain('skipWaiting: true');
		expect(source).toContain("handler: 'NetworkFirst'");
		expect(source).toContain("request.mode === 'navigate'");
	});
});
