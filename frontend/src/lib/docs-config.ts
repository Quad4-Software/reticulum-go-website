export interface DocNavItem {
	title: string;
	slug: string;
}

export interface DocNavSection {
	title?: string;
	items: DocNavItem[];
}

export const DOC_NAV: DocNavSection[] = [
	{
		items: [
			{ title: 'Overview', slug: 'overview' },
			{ title: 'Getting started', slug: 'getting-started' },
			{ title: 'Examples', slug: 'examples' }
		]
	},
	{
		title: 'Architecture',
		items: [
			{ title: 'Architecture', slug: 'architecture' },
			{ title: 'Package map', slug: 'package-map' },
			{ title: 'API reference', slug: 'api-reference' }
		]
	},
	{
		title: 'Operations',
		items: [
			{ title: 'Configuration', slug: 'configuration' },
			{ title: 'Interfaces', slug: 'interfaces' },
			{ title: 'Transport', slug: 'transport' },
			{ title: 'CLI utilities', slug: 'utilities' }
		]
	},
	{
		title: 'Protocol',
		items: [
			{ title: 'Identity and destinations', slug: 'identity-and-destinations' },
			{ title: 'Links, channels, and resources', slug: 'links-channels-and-resources' },
			{ title: 'Cryptography', slug: 'cryptography' }
		]
	},
	{
		title: 'Integration',
		items: [
			{ title: 'Embedding and WebAssembly', slug: 'embedding-and-wasm' },
			{ title: 'Control API', slug: 'control-api' },
			{ title: 'librns', slug: 'librns' }
		]
	},
	{
		title: 'Reference',
		items: [
			{ title: 'Compatibility', slug: 'compatibility' },
			{ title: 'Security', slug: 'security' },
			{ title: 'Development and testing', slug: 'development-and-testing' }
		]
	}
];

export const DOC_SLUGS: string[] = DOC_NAV.flatMap((section) => section.items.map((item) => item.slug));
