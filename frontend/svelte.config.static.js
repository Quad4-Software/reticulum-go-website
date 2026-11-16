import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { DOC_SLUGS } from './src/lib/docs-config.ts';
import { highlight } from './mdsvex-highlight.js';
import { escapeProse } from './mdsvex-escape.js';

/** @type {import('@sveltejs/kit/vite').Config} */
const config = {
	extensions: ['.svelte', '.mdx', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.mdx', '.md'],
			smartypants: false,
			highlight: { highlighter: highlight },
			remarkPlugins: /** @type {any} */ ([escapeProse]),
			rehypePlugins: /** @type {any} */ ([rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]])
		})
	],

	serviceWorker: {
		register: false
	},
	adapter: adapter({
		fallback: '404.html',
		pages: 'build',
		assets: 'build',
		precompress: false,
		strict: true
	}),
	prerender: {
		handleMissingId: 'warn',
		entries: /** @type {any} */ (['*', ...DOC_SLUGS.map((slug) => `/docs/${slug}`)]),
		handleUnseenRoutes: ({ routes }) => {
			const ignorable = new Set([
				'/set-locale',
				'/set-theme',
				'/api/repo-info',
				'/api/reticulum-go/releases',
				'/api/ren-browser/releases',
				'/download/reticulum-go.zip'
			]);
			const unseen = routes.filter((r) => typeof r === 'string').filter((r) => !ignorable.has(r));
			if (unseen.length === 0) return;
			throw new Error(`Unseen prerenderable routes: ${unseen.join(', ')}`);
		}
	}
};

export default config;
