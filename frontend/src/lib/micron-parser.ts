/**
 * Loads Micron-Parser-Go WASM and exposes convert helpers.
 * Uses typeof-window checks so the client loader cannot be poisoned by an SSR
 * module graph that freezes a false browser flag.
 */
import { fetchWasmWithSri } from './wasm-sri';

export const MICRON_WASM_PATH = '/micron-parser-go.wasm';
/** Must match the Micron-Parser-Go release web.zip wasm_exec (not reticulum's). */
export const MICRON_WASM_EXEC_PATH = '/micron-wasm_exec.js';

declare global {
	interface Window {
		micronConvert?: (markup: string, darkTheme?: boolean, forceMonospace?: boolean) => string;
		micronCollectFields?: (rootSelector?: string) => string;
		micronResolveLink?: (
			rootSelector?: string,
			destination?: string,
			fieldsSpec?: string
		) => string;
		onMicronLink?: (payload: unknown, element: Element) => void;
		Go: {
			new (): {
				importObject: WebAssembly.Imports;
				run: (instance: WebAssembly.Instance) => Promise<void>;
			};
		};
	}
}

let loadPromise: Promise<void> | null = null;
let execPromise: Promise<void> | null = null;

function isClient(): boolean {
	return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Loads the Micron-Parser-Go matching wasm_exec.js.
 * Always loads from the micron path so a previously loaded reticulum wasm_exec
 * cannot poison instantiation.
 */
function loadMicronWasmExec(): Promise<void> {
	if (!isClient()) return Promise.resolve();
	if (execPromise) return execPromise;

	execPromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>('script[data-micron-wasm-exec="1"]');
		if (existing && typeof window.Go !== 'undefined') {
			resolve();
			return;
		}

		const s = document.createElement('script');
		s.src = MICRON_WASM_EXEC_PATH;
		s.async = false;
		s.dataset.micronWasmExec = '1';
		s.onload = () => {
			if (typeof window.Go === 'undefined') {
				reject(new Error('Go runtime missing after micron-wasm_exec.js'));
				return;
			}
			resolve();
		};
		s.onerror = () => {
			s.remove();
			reject(new Error(`Failed to load ${MICRON_WASM_EXEC_PATH}`));
		};
		document.head.appendChild(s);
	}).catch((err) => {
		execPromise = null;
		throw err;
	});

	return execPromise;
}

async function waitForMicronConvert(timeoutMs = 8000): Promise<void> {
	const start = Date.now();
	while (typeof window.micronConvert !== 'function') {
		if (Date.now() - start > timeoutMs) {
			throw new Error('micronConvert missing after WASM run (wasm_exec mismatch?)');
		}
		await new Promise((r) => setTimeout(r, 0));
	}
}

/**
 * Loads matching wasm_exec + micron-parser-go.wasm (SHA-384 SRI verified).
 * Mirrors Micron-Parser-Go web/index.html: run then read micronConvert.
 */
export function ensureMicronParser(): Promise<void> {
	if (!isClient()) return Promise.resolve();
	if (typeof window.micronConvert === 'function') return Promise.resolve();
	if (loadPromise) return loadPromise;

	loadPromise = (async () => {
		await loadMicronWasmExec();
		if (typeof window.Go === 'undefined') {
			throw new Error('Go WASM runtime not found after loading micron-wasm_exec.js');
		}

		const go = new window.Go();
		const buffer = await fetchWasmWithSri(MICRON_WASM_PATH, { cache: 'no-cache' });
		const result = await WebAssembly.instantiate(buffer, go.importObject);
		// Do not await go.run. Micron registers globals then blocks on select{}.
		void go.run(result.instance);
		await waitForMicronConvert();
	})().catch((err) => {
		loadPromise = null;
		throw err;
	});

	return loadPromise;
}

export function convertMicron(markup: string, darkTheme = true, forceMonospace = true): string {
	if (typeof window.micronConvert !== 'function') {
		throw new Error('micronConvert is not available');
	}
	return window.micronConvert(markup, darkTheme, forceMonospace);
}

/** Clears in-flight load so Retry can start a fresh attempt. */
export function clearMicronParserLoad(): void {
	loadPromise = null;
}

/** Clears loader state for tests. */
export function resetMicronParserForTest(): void {
	loadPromise = null;
	execPromise = null;
	if (typeof window !== 'undefined') {
		delete window.micronConvert;
	}
}
