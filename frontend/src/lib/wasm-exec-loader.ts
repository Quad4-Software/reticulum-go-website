let loadPromise: Promise<void> | null = null;

/**
 * Loads `/wasm_exec.js` once and resolves when the script has finished loading.
 */
export function loadWasmExec(): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve();
	if (typeof window.Go !== 'undefined') return Promise.resolve();
	if (loadPromise) return loadPromise;

	loadPromise = new Promise<void>((resolve, reject) => {
		const s = document.createElement('script');
		s.src = '/wasm_exec.js';
		s.defer = true;
		s.dataset.wasmExec = '1';
		s.onload = () => resolve();
		s.onerror = () => {
			s.remove();
			reject(new Error('Failed to load wasm_exec.js'));
		};
		document.head.appendChild(s);
	}).catch((err) => {
		loadPromise = null;
		throw err;
	});

	return loadPromise;
}

/** Clears in-flight loader state (Vitest only). */
export function resetWasmExecLoaderForTest(): void {
	loadPromise = null;
}
