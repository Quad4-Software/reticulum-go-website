import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAllCaches } from './wasm-cache';

describe('clearAllCaches', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('no-ops when Cache Storage is unavailable', async () => {
		vi.stubGlobal('caches', undefined);
		await expect(clearAllCaches()).resolves.toBeUndefined();
	});

	it('deletes every cache bucket', async () => {
		const deleted: string[] = [];
		vi.stubGlobal('caches', {
			keys: vi.fn(async () => ['workbox-a', 'workbox-b']),
			delete: vi.fn(async (name: string) => {
				deleted.push(name);
				return true;
			})
		});
		await clearAllCaches();
		expect(deleted).toEqual(['workbox-a', 'workbox-b']);
	});

	it('propagates errors from caches.keys', async () => {
		vi.stubGlobal('caches', {
			keys: vi.fn(async () => {
				throw new Error('keys failed');
			}),
			delete: vi.fn()
		});
		await expect(clearAllCaches()).rejects.toThrow('keys failed');
	});
});
