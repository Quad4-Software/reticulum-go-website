import { beforeEach, describe, it, expect } from 'vitest';
import { loadWasmExec, resetWasmExecLoaderForTest } from './wasm-exec-loader';

describe('wasm-exec-loader', () => {
	beforeEach(() => {
		resetWasmExecLoaderForTest();
		delete (window as unknown as { Go?: unknown }).Go;
		for (const el of document.head.querySelectorAll('script[data-wasm-exec="1"]')) {
			el.remove();
		}
	});

	it('resolves immediately when window.Go is already defined', async () => {
		(window as unknown as { Go: new () => unknown }).Go = class {};
		await expect(loadWasmExec()).resolves.toBeUndefined();
		expect(document.head.querySelectorAll('script[data-wasm-exec="1"]')).toHaveLength(0);
	});

	it('appends one script and resolves on load', async () => {
		const p = loadWasmExec();
		const scripts = document.head.querySelectorAll('script[data-wasm-exec="1"]');
		expect(scripts).toHaveLength(1);
		expect(scripts[0].getAttribute('src')).toBe('/wasm_exec.js');
		(window as unknown as { Go: new () => unknown }).Go = class {};
		scripts[0].dispatchEvent(new Event('load'));
		await expect(p).resolves.toBeUndefined();
	});

	it('returns the same promise for concurrent calls', async () => {
		const a = loadWasmExec();
		const b = loadWasmExec();
		expect(a).toBe(b);
		const script = document.head.querySelector('script[data-wasm-exec="1"]');
		(window as unknown as { Go: new () => unknown }).Go = class {};
		script!.dispatchEvent(new Event('load'));
		await a;
	});

	it('rejects on error and allows retry', async () => {
		const p = loadWasmExec();
		const script = document.head.querySelector('script[data-wasm-exec="1"]')!;
		script.dispatchEvent(new Event('error'));
		await expect(p).rejects.toThrow('Failed to load wasm_exec.js');

		resetWasmExecLoaderForTest();
		const p2 = loadWasmExec();
		(window as unknown as { Go: new () => unknown }).Go = class {};
		document.head.querySelector('script[data-wasm-exec="1"]')!.dispatchEvent(new Event('load'));
		await expect(p2).resolves.toBeUndefined();
	});
});
