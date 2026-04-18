import adapter from '@sveltejs/adapter-static';
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
		serviceWorker: {
			register: false
		},
		adapter: adapter({
			fallback: 'index.html', // SPA mode
			pages: 'build',
			assets: 'build',
			precompress: false,
			strict: true
		}),
		prerender: {
			entries: ['*', '/docs/introduction', '/docs/usage'],
			handleUnseenRoutes: ({ routes }) => {
				const safeRoutes = routes.filter((r) => typeof r === 'string');
				const ignorable = (r) =>
					r === '/docs' ||
					r.startsWith('/docs/') ||
					r === '/sitemap.xml';
				const unseen = safeRoutes.filter((r) => !ignorable(r));
				if (unseen.length === 0) return;
				throw new Error(`Unseen prerenderable routes: ${unseen.join(', ')}`);
			}
		}
	}
};

export default config;
