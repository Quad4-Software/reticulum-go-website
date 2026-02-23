import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, LOCALES } from './site-config';

export function buildJsonLd(
	type: 'Organization' | 'SoftwareApplication' | 'WebSite' | 'BreadcrumbList',
	data: Record<string, unknown>
): string {
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': type,
		...data
	});
}

export function getOrganizationJsonLd(): string {
	return buildJsonLd('Organization', {
		name: 'Quad4',
		url: 'https://quad4.io',
		logo: `${SITE_URL}/logo.svg`
	});
}

export function getSoftwareApplicationJsonLd(): string {
	return buildJsonLd('SoftwareApplication', {
		name: SITE_NAME,
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		applicationCategory: 'DeveloperApplication',
		operatingSystem: 'Web, Linux, macOS, Windows',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		}
	});
}

export function getWebSiteJsonLd(): string {
	return buildJsonLd('WebSite', {
		name: SITE_NAME,
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		publisher: {
			'@type': 'Organization',
			name: 'Quad4',
			url: 'https://quad4.io'
		},
		inLanguage: LOCALES,
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${SITE_URL}/docs?q={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	});
}

export function getBreadcrumbJsonLd(items: { name: string; url: string }[]): string {
	return buildJsonLd('BreadcrumbList', {
		itemListElement: items.map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			item: item.url
		}))
	});
}

export function getCanonicalUrl(path: string): string {
	return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getHreflangLinks(path: string): { lang: string; href: string }[] {
	const basePath = path.startsWith('/') ? path : `/${path}`;
	const links: { lang: string; href: string }[] = [
		{ lang: 'x-default', href: `${SITE_URL}${basePath}` }
	];
	for (const lang of LOCALES) {
		links.push({ lang, href: `${SITE_URL}${basePath}?lang=${lang}` });
	}
	return links;
}
