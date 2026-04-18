/**
 * Cache-busting key for the Reticulum-Go WASM binary.
 *
 * Bump this whenever you ship a new bin/reticulum-go.wasm so users who
 * already have a service-worker pinned copy of the previous build will
 * fetch the new one. The value is appended as a query string to the
 * fetch URL; Workbox treats different URLs as different cache entries
 * and cleans up the stale precache on the next SW activation.
 */
export const WASM_CACHE_KEY = '20260418-2';
