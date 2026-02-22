import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
				runtimeCaching: [
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
	]
});
