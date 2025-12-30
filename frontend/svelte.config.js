import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.svx', '.md']
		})
	],

	kit: {
		adapter: adapter({
			fallback: 'index.html', // SPA mode
			pages: 'build',
			assets: 'build',
			precompress: false,
			strict: true
		}),
		prerender: {
			entries: ['*', '/docs/introduction', '/docs/usage'],
			handleUnseenRoutes: ({ path }) => {
				if (path.startsWith('/docs/')) {
					return 'ignore';
				}
				return 'fail';
			}
		}
	}
};

export default config;
