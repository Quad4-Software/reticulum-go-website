/**
 * Repo-hosted static assets are served from public CDN mirrors of this
 * repository in production. Pins to the deployed commit so caches are
 * immutable and cannot drift. Dev and SSR builds keep local paths.
 *
 * statically.io for small files (icons, images), jsDelivr for binaries
 * (wasm, firmware). Both read the public GitHub repo at GIT_SHA.
 */
const SHA = import.meta.env.VITE_GIT_SHA;

const STATICALLY = `https://cdn.statically.io/gh/Quad4-Software/reticulum-go-website@${SHA}/frontend/static`;
const JSDELIVR = `https://cdn.jsdelivr.net/gh/Quad4-Software/reticulum-go-website@${SHA}/frontend/static`;

export function asset(path: string): string {
	return import.meta.env.PROD ? `${STATICALLY}${path}` : path;
}

export function binary(path: string): string {
	return import.meta.env.PROD ? `${JSDELIVR}${path}` : path;
}
