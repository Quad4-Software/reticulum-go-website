import { describe, it, expect } from 'vitest';
import { LOCALES } from '$lib/site-config';

const bundles = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*.json', {
	eager: true
});

function translationLeafKeys(obj: unknown, prefix = ''): string[] {
	if (obj === null || typeof obj !== 'object') return [];
	if (Array.isArray(obj)) return [];
	const out: string[] = [];
	for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
		const p = prefix ? `${prefix}.${k}` : k;
		if (typeof v === 'string') {
			out.push(p);
		} else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
			out.push(...translationLeafKeys(v, p));
		}
	}
	return out.sort();
}

describe('i18n locale bundles', () => {
	it('every configured locale file exists and matches English keys', () => {
		const enMod = bundles['./locales/en.json'];
		expect(enMod?.default).toBeTruthy();
		const baseKeys = translationLeafKeys(enMod!.default);
		expect(baseKeys.length).toBeGreaterThan(0);

		for (const code of LOCALES) {
			const path = `./locales/${code}.json`;
			const mod = bundles[path];
			expect(mod?.default, `missing or empty bundle for ${code} (${path})`).toBeTruthy();
			const keys = translationLeafKeys(mod!.default);
			expect(keys, `key mismatch for locale ${code}`).toEqual(baseKeys);
		}
	});
});
