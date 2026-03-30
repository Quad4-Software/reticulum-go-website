import { bench, describe } from 'vitest';
import { calculateTimeAgo } from './version';
import { getCanonicalUrl, getHreflangLinks } from './seo';
import { isLocaleSupported } from './site-config';

describe('hot paths (micro-benchmarks)', () => {
	const sampleDate = '2024-06-15T12:00:00Z';

	bench('calculateTimeAgo', () => {
		calculateTimeAgo(sampleDate);
	});

	bench('getCanonicalUrl', () => {
		getCanonicalUrl('/docs/introduction');
	});

	bench('getHreflangLinks', () => {
		getHreflangLinks('/docs/foo');
	});

	bench('isLocaleSupported x100', () => {
		for (let i = 0; i < 100; i++) {
			isLocaleSupported('en');
			isLocaleSupported('de');
			isLocaleSupported('xx');
		}
	});
});
