import { describe, test } from 'vitest';
import { calculateTimeAgo } from './version';
import { getCanonicalUrl, getHreflangLinks } from './seo';
import { isLocaleSupported } from './site-config';

describe('hot paths (micro-benchmarks)', () => {
	const sampleDate = '2024-06-15T12:00:00Z';

	test('calculateTimeAgo', async ({ bench }) => {
		await bench('calculateTimeAgo', () => {
			calculateTimeAgo(sampleDate);
		}).run();
	});

	test('getCanonicalUrl', async ({ bench }) => {
		await bench('getCanonicalUrl', () => {
			getCanonicalUrl('/docs/overview');
		}).run();
	});

	test('getHreflangLinks', async ({ bench }) => {
		await bench('getHreflangLinks', () => {
			getHreflangLinks('/docs/foo');
		}).run();
	});

	test('isLocaleSupported x100', async ({ bench }) => {
		await bench('isLocaleSupported x100', () => {
			for (let i = 0; i < 100; i++) {
				isLocaleSupported('en');
				isLocaleSupported('de');
				isLocaleSupported('xx');
			}
		}).run();
	});
});
