/**
 * SHA-384 Subresource Integrity helpers for vendored WebAssembly modules.
 * WASM is fetched at runtime (not via script tags), so integrity is verified
 * against build-injected expected hashes before instantiate.
 */

export type WasmSriMap = Record<string, string>;

let sriMapOverride: WasmSriMap | null = null;

/** Test-only override for the embedded SRI map. */
export function setWasmSriMapForTest(map: WasmSriMap | null): void {
	sriMapOverride = map;
}

/**
 * Normalizes Vite `define` output (object) or a JSON string into an SRI map.
 */
export function normalizeWasmSriRaw(raw: unknown): WasmSriMap {
	if (!raw) return {};
	try {
		const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
		if (!parsed || typeof parsed !== 'object') return {};
		const out: WasmSriMap = {};
		for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
			if (typeof value === 'string' && value.startsWith('sha384-')) {
				out[key] = value;
			}
		}
		return out;
	} catch {
		return {};
	}
}

function readEmbeddedSriMap(): WasmSriMap {
	if (sriMapOverride) return sriMapOverride;
	return normalizeWasmSriRaw(import.meta.env.VITE_WASM_SRI as unknown);
}

export function getExpectedWasmSri(wasmPath: string): string | undefined {
	const map = readEmbeddedSriMap();
	return map[wasmPath];
}

function bytesToBase64(bytes: Uint8Array): string {
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(bytes).toString('base64');
	}
	const chunkSize = 0x8000;
	let binary = '';
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		binary += String.fromCharCode.apply(null, Array.from(chunk));
	}
	return btoa(binary);
}

/**
 * Computes `sha384-…` SRI for an ArrayBuffer.
 */
export async function computeSha384Sri(buffer: ArrayBuffer): Promise<string> {
	if (globalThis.crypto?.subtle) {
		const digest = await globalThis.crypto.subtle.digest('SHA-384', buffer);
		return `sha384-${bytesToBase64(new Uint8Array(digest))}`;
	}
	const { createHash } = await import('node:crypto');
	const hash = createHash('sha384').update(Buffer.from(buffer)).digest('base64');
	return `sha384-${hash}`;
}

/**
 * Verifies buffer integrity against the build-injected expected SRI.
 */
export async function verifyWasmSri(wasmPath: string, buffer: ArrayBuffer): Promise<string> {
	const expected = getExpectedWasmSri(wasmPath);
	if (!expected) {
		throw new Error(`No SHA-384 SRI configured for ${wasmPath}`);
	}
	const actual = await computeSha384Sri(buffer);
	if (actual !== expected) {
		throw new Error(`SRI mismatch for ${wasmPath}: expected ${expected}, got ${actual}`);
	}
	return actual;
}

/**
 * Fetches a WASM module and verifies SHA-384 SRI before returning bytes.
 */
export async function fetchWasmWithSri(wasmPath: string, init?: RequestInit): Promise<ArrayBuffer> {
	const response = await fetch(wasmPath, init);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${wasmPath} (HTTP ${response.status})`);
	}
	const buffer = await response.arrayBuffer();
	await verifyWasmSri(wasmPath, buffer);
	return buffer;
}
