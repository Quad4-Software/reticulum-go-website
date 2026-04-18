/// <reference types="node" />
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ command }) => {
	const isProd = command === 'build';
	const isTest = process.env.VITEST === 'true';
	return {
	resolve: {
		conditions: isTest ? ['browser'] : []
	},
	test: {
		environment: 'jsdom',
		fileParallelism: false,
		include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
		benchmark: {
			include: ['src/**/*.bench.ts'],
			environment: 'node'
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: [
				'src/lib/db.ts',
				'src/lib/identity.ts',
				'src/lib/version.ts',
				'src/lib/docs-service.ts',
				'src/lib/site-config.ts',
				'src/lib/seo.ts',
				'src/routes/api/repo-info/+server.ts',
				'src/routes/set-locale/+server.ts',
				'src/routes/set-theme/+server.ts',
				'src/routes/sitemap.xml/+server.ts'
			],
			exclude: [
				'src/**/*.d.ts',
				'src/**/*.test.{ts,svelte}',
				'src/**/*.spec.{ts,svelte}',
				'src/**/*.bench.ts'
			],
			thresholds: {
				statements: 75,
				branches: 50,
				functions: 75,
				lines: 75
			}
		},
		setupFiles: ['./src/test/setup.ts']
	},
	plugins: [tailwindcss(), sveltekit()],
		build: {
			sourcemap: !isProd,
			minify: isProd ? 'esbuild' : false
		}
	};
});
