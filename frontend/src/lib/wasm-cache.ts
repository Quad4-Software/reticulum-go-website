/**
 * Clears all Cache Storage entries. Used when a new `reticulum-go.wasm` build is
 * detected so Workbox and the HTTP cache cannot serve a stale module.
 */
export async function clearAllCaches(): Promise<void> {
	if (typeof caches === 'undefined') return;
	const keys = await caches.keys();
	await Promise.all(keys.map((name) => caches.delete(name)));
}
