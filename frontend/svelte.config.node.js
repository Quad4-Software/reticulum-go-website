import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
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

	adapter: adapter({
		out: 'build',
		precompress: false
	}),
	prerender: {
		entries: ['*'],
		handleUnseenRoutes: ({ routes }) => {
			const unseen = routes.filter((r) => r !== '/sitemap.xml');
			if (unseen.length > 0) {
				throw new Error(`Unseen prerenderable routes: ${unseen.join(', ')}`);
			}
		}
	}
};

export default config;
