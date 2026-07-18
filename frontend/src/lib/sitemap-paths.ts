import { DOC_SLUGS } from '$lib/docs-config';
import { getTutorialSlugs } from '$lib/tutorials';

export const SITEMAP_PATHS = [
	'/',
	'/docs/overview',
	...DOC_SLUGS.filter((slug) => slug !== 'overview').map((slug) => `/docs/${slug}`),
	'/apps',
	'/ren-browser',
	'/contact',
	'/donate',
	'/source',
	'/privacy',
	'/interactive',
	'/tools',
	'/tools/reticulum-guide',
	...getTutorialSlugs().map((slug) => `/tools/reticulum-guide/${slug}`),
	'/tools/micron-editor',
	'/tools/rnode-flasher',
	'/wasm-example',
	'/identity',
	'/settings',
	'/wasm-example/identity',
	'/wasm-example/settings'
] as const;
