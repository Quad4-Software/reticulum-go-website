/// <reference types="node" />
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

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
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: [
				'src/lib/db.ts',
				'src/lib/identity.ts',
				'src/lib/version.ts',
				'src/lib/docs-service.ts',
				'src/routes/api/repo-info/+server.ts'
			],
			exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,svelte}', 'src/**/*.spec.{ts,svelte}'],
			thresholds: {
				statements: 75,
				branches: 50,
				functions: 75,
				lines: 75
			}
		},
		setupFiles: ['./src/test/setup.ts']
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			injectRegister: null,
			devOptions: {
				enabled: false
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
				maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
				navigateFallback: '/',
				runtimeCaching: [
					{
						urlPattern:
							// eslint-disable-next-line security/detect-unsafe-regex -- bounded pattern for PWA cache
							/^https?:\/\/[^/]+\/(docs|wasm-example|interactive|apps|contact|donate)?(\/.*)?$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pages-cache',
							networkTimeoutSeconds: 3,
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 7
							}
						}
					},
					{
						urlPattern: /^https:\/\/.*\/docs.*/,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'docs-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 30
							}
						}
					}
				]
			},
			manifest: {
				name: 'Quad4 Reticulum',
				short_name: 'Reticulum',
				description: 'Resilient, encrypted, and decentralized communication network',
				theme_color: '#00ADD8',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				shortcuts: [
					{
						name: 'WASM Chat',
						short_name: 'Chat',
						description: 'Reticulum WASM Chat Example',
						url: '/wasm-example',
						icons: [{ src: 'logo.svg', sizes: '192x192' }]
					},
					{
						name: 'Documentation',
						short_name: 'Docs',
						description: 'Reticulum-Go Documentation',
						url: '/docs',
						icons: [{ src: 'logo.svg', sizes: '192x192' }]
					}
				],
				icons: [
					{
						src: 'logo.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: 'logo.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: 'logo.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'maskable'
					},
					{
						src: 'logo.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'maskable'
					}
				]
			}
		}) as import('vite').PluginOption
	],
		build: {
			sourcemap: !isProd,
			minify: isProd ? 'esbuild' : false
		}
	};
});
