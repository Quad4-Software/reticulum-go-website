import { describe, it, expect, afterEach } from 'vitest';
import {
	computeSha384Sri,
	verifyWasmSri,
	getExpectedWasmSri,
	setWasmSriMapForTest,
	normalizeWasmSriRaw
} from './wasm-sri';

describe('wasm-sri', () => {
	afterEach(() => {
		setWasmSriMapForTest(null);
	});

	it('reads expected SRI from the override map', () => {
		setWasmSriMapForTest({ '/demo.wasm': 'sha384-abc' });
		expect(getExpectedWasmSri('/demo.wasm')).toBe('sha384-abc');
		expect(getExpectedWasmSri('/missing.wasm')).toBeUndefined();
	});

	it('computes a stable sha384 SRI for known bytes', async () => {
		const buf = new TextEncoder().encode('reticulum').buffer;
		const sri = await computeSha384Sri(buf);
		expect(sri).toMatch(/^sha384-[A-Za-z0-9+/]+=*$/);
		expect(await computeSha384Sri(buf)).toBe(sri);
	});

	it('accepts matching SRI and rejects mismatches', async () => {
		const buf = new TextEncoder().encode('ok').buffer;
		const good = await computeSha384Sri(buf);
		setWasmSriMapForTest({ '/ok.wasm': good });
		await expect(verifyWasmSri('/ok.wasm', buf)).resolves.toBe(good);

		setWasmSriMapForTest({ '/ok.wasm': 'sha384-deadbeef' });
		await expect(verifyWasmSri('/ok.wasm', buf)).rejects.toThrow(/SRI mismatch/);
	});

	it('requires configured SRI for every wasm path', async () => {
		const buf = new TextEncoder().encode('x').buffer;
		setWasmSriMapForTest({});
		await expect(verifyWasmSri('/nope.wasm', buf)).rejects.toThrow(/No SHA-384 SRI configured/);
	});

	it('normalizes both Vite object maps and JSON strings', () => {
		expect(
			normalizeWasmSriRaw({
				'/micron-parser-go.wasm': 'sha384-objectform'
			})['/micron-parser-go.wasm']
		).toBe('sha384-objectform');

		expect(
			normalizeWasmSriRaw(
				JSON.stringify({
					'/micron-parser-go.wasm': 'sha384-stringform'
				})
			)['/micron-parser-go.wasm']
		).toBe('sha384-stringform');
	});
});
