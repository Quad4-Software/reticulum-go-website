import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.mdx', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.mdx', '.md'],
			rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]
		})
	],

	kit: {
		adapter: adapter({
			out: 'build',
			precompress: false
		}),
		prerender: {
			entries: [],
			handleUnseenRoutes: ({ routes, path }) => {
				const values = [
					...(Array.isArray(routes) ? routes : []),
					...(typeof path === 'string' ? [path] : [])
				].filter((r) => typeof r === 'string');
				if (values.every((r) => r === '/sitemap.xml')) return 'ignore';
				return 'fail';
			}
		}
	}
};

export default config;
