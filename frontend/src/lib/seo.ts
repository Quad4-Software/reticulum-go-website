import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, LOCALES } from './site-config';

const JSON_LD_TYPE = 'application/ld+json';

export const RETICULUM_SITE = 'https://reticulum.network';
export const RETICULUM_GO_REPO = 'https://github.com/Quad4-Software/Reticulum-Go';
export const QUAD4_SITE = 'https://quad4.io';
export const APACHE_2_LICENSE = 'https://www.apache.org/licenses/LICENSE-2.0';

export function jsonLdScript(json: string): string {
	return `<script type="${JSON_LD_TYPE}">${json}</script>`;
}

export function buildJsonLd(
	type: 'Organization' | 'SoftwareApplication' | 'WebSite' | 'BreadcrumbList' | 'WebPage',
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
		url: QUAD4_SITE,
		logo: `${SITE_URL}/logo.svg`,
		sameAs: [QUAD4_SITE, 'https://github.com/Quad4-Software'],
		contactPoint: [
			{
				'@type': 'ContactPoint',
				contactType: 'customer support',
				url: `${SITE_URL}/contact`,
				email: 'team@quad4.io'
			},
			{
				'@type': 'ContactPoint',
				contactType: 'security',
				url: `${SITE_URL}/contact`,
				description: 'Report via LXMF f489752fbef161c64d65e385a4e9fc74'
			}
		]
	});
}

export function getSoftwareApplicationJsonLd(): string {
	return buildJsonLd('SoftwareApplication', {
		name: SITE_NAME,
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		image: `${SITE_URL}/logo.svg`,
		applicationCategory: 'DeveloperApplication',
		operatingSystem: 'Web, Linux, macOS, Windows, BSD',
		license: APACHE_2_LICENSE,
		codeRepository: RETICULUM_GO_REPO,
		downloadUrl: RETICULUM_GO_REPO,
		isBasedOn: {
			'@type': 'SoftwareApplication',
			name: 'Reticulum',
			url: RETICULUM_SITE,
			author: {
				'@type': 'Person',
				name: 'Mark Qvist',
				url: RETICULUM_SITE
			}
		},
		creator: {
			'@type': 'Organization',
			name: 'Quad4',
			url: QUAD4_SITE
		},
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		sameAs: [
			RETICULUM_GO_REPO,
			RETICULUM_SITE,
			'https://lavaforge.org/Ivan/Reticulum-Go',
			`${SITE_URL}/source`
		]
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
			url: QUAD4_SITE
		},
		inLanguage: [...LOCALES],
		relatedLink: [`${SITE_URL}/llms.txt`, `${SITE_URL}/llms-full.txt`, `${SITE_URL}/api/agent`],
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${SITE_URL}/docs/overview?q={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	});
}

export function getDonateWebPageJsonLd(): string {
	return buildJsonLd('WebPage', {
		name: `Donate | ${SITE_NAME}`,
		description:
			'Support Reticulum-Go. Half of donations go to Mark Qvist, creator of the Reticulum reference implementation.',
		url: `${SITE_URL}/donate`,
		isPartOf: {
			'@type': 'WebSite',
			name: SITE_NAME,
			url: SITE_URL
		},
		about: {
			'@type': 'Person',
			name: 'Mark Qvist',
			url: RETICULUM_SITE
		}
	});
}

export function getPrivacyWebPageJsonLd(): string {
	return buildJsonLd('WebPage', {
		name: `Privacy Policy | ${SITE_NAME}`,
		description:
			'Reticulum-Go collects zero personal data. No analytics, trackers, ads, or accounts.',
		url: `${SITE_URL}/privacy`,
		isPartOf: {
			'@type': 'WebSite',
			name: SITE_NAME,
			url: SITE_URL
		}
	});
}

export function getSourceWebPageJsonLd(): string {
	return buildJsonLd('WebPage', {
		name: `Source Code | ${SITE_NAME}`,
		description:
			'Get Reticulum-Go source from official rngit over Reticulum (git clone and NomadNet Micron page), or GitHub and Lavaforge mirrors.',
		url: `${SITE_URL}/source`,
		isPartOf: {
			'@type': 'WebSite',
			name: SITE_NAME,
			url: SITE_URL
		},
		about: {
			'@type': 'SoftwareSourceCode',
			name: SITE_NAME,
			codeRepository: RETICULUM_GO_REPO,
			url: `${SITE_URL}/source`
		},
		significantLink: [
			RETICULUM_GO_REPO,
			'https://lavaforge.org/Ivan/Reticulum-Go',
			'rns://06a54b505bb67b25ef3f8097e8001edc/public/Reticulum-Go'
		]
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
