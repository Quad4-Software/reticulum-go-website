import { DOC_SLUGS } from '$lib/docs-config';

export const SITEMAP_PATHS = [
	'/',
	'/docs/overview',
	...DOC_SLUGS.filter((slug) => slug !== 'overview').map((slug) => `/docs/${slug}`),
	'/apps',
	'/contact',
	'/donate',
	'/interactive',
	'/wasm-example',
	'/identity',
	'/settings',
	'/wasm-example/identity',
	'/wasm-example/settings'
] as const;
