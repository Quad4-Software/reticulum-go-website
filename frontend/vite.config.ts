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
			injectRegister: 'auto',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
				maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
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
				name: 'Reticulum-Go Docs',
				short_name: 'RetDocs',
				description: 'Documentation for Reticulum-Go',
				theme_color: '#ffffff',
				icons: [
					{
						src: 'logo.svg',
						sizes: '192x192',
						type: 'image/svg+xml'
					},
					{
						src: 'logo.svg',
						sizes: '512x512',
						type: 'image/svg+xml'
					}
				]
			}
		}) as import('vite').PluginOption
	]
});
