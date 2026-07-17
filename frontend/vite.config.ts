/// <reference types="vitest/config" />
/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readWasmSha256(): string {
	const wasmPath = path.join(__dirname, 'static/reticulum-go.wasm');
	const buf = fs.readFileSync(wasmPath);
	return crypto.createHash('sha256').update(buf).digest('hex');
}

function readWasmSriMap(): Record<string, string> {
	const staticDir = path.join(__dirname, 'static');
	const names = ['reticulum-go.wasm', 'micron-parser-go.wasm'];
	const map: Record<string, string> = {};
	for (const name of names) {
		const filePath = path.join(staticDir, name);
		if (!fs.existsSync(filePath)) continue;
		const hash = crypto.createHash('sha384').update(fs.readFileSync(filePath)).digest('base64');
		map[`/${name}`] = `sha384-${hash}`;
	}
	return map;
}

export default defineConfig(({ command }) => {
	const isProd = command === 'build';
	const isTest = process.env.VITEST === 'true';
	let wasmSha256 = '';
	let wasmSri = {};
	try {
		wasmSha256 = readWasmSha256();
	} catch {
		wasmSha256 = '';
	}
	try {
		wasmSri = readWasmSriMap();
	} catch {
		wasmSri = {};
	}
	return {
		resolve: {
			conditions: isTest ? ['browser'] : []
		},
		define: {
			'import.meta.env.VITE_WASM_SHA256': JSON.stringify(wasmSha256),
			'import.meta.env.VITE_WASM_SRI': JSON.stringify(wasmSri)
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
		plugins: [
			tailwindcss(),
			sveltekit(),
			...SvelteKitPWA({
				registerType: 'autoUpdate',
				manifest: {
					name: 'Reticulum-Go',
					short_name: 'Reticulum-Go',
					description:
						'High-performance Go implementation of the Reticulum Network Stack for resilient, encrypted networking.',
					theme_color: '#00ADD8',
					background_color: '#0f172a',
					display: 'standalone',
					scope: '/',
					start_url: '/',
					icons: [
						{
							src: '/logo.svg',
							sizes: 'any',
							type: 'image/svg+xml',
							purpose: 'any'
						}
					]
				},
				workbox: {
					maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
					globPatterns: [
						'client/**/*.{js,css,ico,png,svg,webp,webmanifest,wasm}',
						'prerendered/**/*.{html,json,xml,js}'
					],
					cleanupOutdatedCaches: true,
					clientsClaim: true,
					skipWaiting: true,
					runtimeCaching: [
						{
							urlPattern: ({ request }) => request.mode === 'navigate',
							handler: 'NetworkFirst',
							options: {
								cacheName: 'pages',
								networkTimeoutSeconds: 5,
								expiration: {
									maxEntries: 48,
									maxAgeSeconds: 24 * 60 * 60
								}
							}
						},
						{
							urlPattern: ({ url }) =>
								url.pathname.endsWith('.wasm') ||
								url.pathname === '/wasm_exec.js' ||
								url.pathname === '/micron-wasm_exec.js',
							handler: 'CacheFirst',
							options: {
								cacheName: 'wasm-assets',
								expiration: {
									maxEntries: 8,
									maxAgeSeconds: 60 * 60 * 24 * 30
								},
								cacheableResponse: {
									statuses: [0, 200]
								}
							}
						},
						{
							urlPattern: ({ url }) => url.pathname === '/rnode-firmware/catalog.json',
							handler: 'NetworkFirst',
							options: {
								cacheName: 'rnode-firmware-catalog',
								networkTimeoutSeconds: 5,
								expiration: {
									maxEntries: 4,
									maxAgeSeconds: 60 * 60 * 24
								},
								cacheableResponse: {
									statuses: [0, 200]
								}
							}
						},
						{
							urlPattern: ({ url }) =>
								url.pathname.startsWith('/rnode-firmware/') &&
								url.pathname !== '/rnode-firmware/catalog.json',
							handler: 'CacheFirst',
							options: {
								cacheName: 'rnode-firmware',
								expiration: {
									maxEntries: 64,
									maxAgeSeconds: 60 * 60 * 24 * 30
								},
								cacheableResponse: {
									statuses: [0, 200]
								}
							}
						}
					]
				},
				devOptions: {
					enabled: false,
					type: 'module'
				},
				kit: {
					adapterFallback: 'index.html',
					spa: true,
					includeVersionFile: true
				}
			})
		],
		build: {
			sourcemap: !isProd,
			minify: isProd ? 'esbuild' : false
		}
	};
});
