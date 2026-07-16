import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	WASM_SKEW_KEY,
	ensureWasmMatchesDeployedBuild,
	ensureWasmMatchesDeployedBuildWithDeps,
	type WasmVersionGuardDeps
} from './wasm-version-guard';

function memorySession(): Storage {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => {
			m.set(k, v);
		},
		removeItem: (k: string) => {
			m.delete(k);
		},
		length: 0,
		clear: () => {
			m.clear();
		},
		key: () => null
	} as unknown as Storage;
}

describe('ensureWasmMatchesDeployedBuildWithDeps', () => {
	let session: Storage;
	let clearAllCachesMock: ReturnType<typeof vi.fn>;
	let reloadMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		session = memorySession();
		clearAllCachesMock = vi.fn(async (): Promise<void> => {});
		reloadMock = vi.fn((): void => {});
	});

	function deps(
		fetchImpl: typeof fetch,
		overrides?: Partial<Pick<WasmVersionGuardDeps, 'session'>>
	): WasmVersionGuardDeps {
		return {
			fetchImpl,
			clearAllCachesImpl: clearAllCachesMock as WasmVersionGuardDeps['clearAllCachesImpl'],
			session: overrides?.session ?? session,
			reload: reloadMock as WasmVersionGuardDeps['reload']
		};
	}

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns true when embedded SHA is empty', async () => {
		const fetchImpl = vi.fn();
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'',
			true,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(true);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('returns true when not in browser (SSR)', async () => {
		const fetchImpl = vi.fn();
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'abc',
			false,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(true);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('returns true when wasm-version.json is missing (non-OK)', async () => {
		const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }));
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'abc',
			true,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(true);
		expect(clearAllCachesMock).not.toHaveBeenCalled();
	});

	it('clears skew flag and returns true when server SHA matches embedded', async () => {
		session.setItem(WASM_SKEW_KEY, '1');
		const fetchImpl = vi.fn(
			async () =>
				new Response(JSON.stringify({ sha256: 'same' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
		);
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'same',
			true,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(true);
		expect(session.getItem(WASM_SKEW_KEY)).toBeNull();
	});

	it('returns true when JSON has no sha256 (treats as aligned)', async () => {
		const fetchImpl = vi.fn(
			async () =>
				new Response(JSON.stringify({}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
		);
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'abc',
			true,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(true);
		expect(clearAllCachesMock).not.toHaveBeenCalled();
	});

	it('on mismatch: clears caches, sets skew, reloads, returns false', async () => {
		const fetchImpl = vi.fn(
			async () =>
				new Response(JSON.stringify({ sha256: 'server-sha' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
		);
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'bundle-sha',
			true,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(false);
		expect(clearAllCachesMock).toHaveBeenCalledTimes(1);
		expect(session.getItem(WASM_SKEW_KEY)).toBe('1');
		expect(reloadMock).toHaveBeenCalledTimes(1);
		expect(fetchImpl).toHaveBeenCalledWith('/wasm-version.json', { cache: 'no-store' });
	});

	it('on mismatch with skew already set: warns and returns true without reload', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		session.setItem(WASM_SKEW_KEY, '1');
		const fetchImpl = vi.fn(
			async () =>
				new Response(JSON.stringify({ sha256: 'server' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
		);
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'bundle',
			true,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(true);
		expect(clearAllCachesMock).not.toHaveBeenCalled();
		expect(reloadMock).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it('returns true when fetch throws (offline / parse error)', async () => {
		const fetchImpl = vi.fn(async () => {
			throw new Error('network');
		});
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'abc',
			true,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(true);
		expect(reloadMock).not.toHaveBeenCalled();
	});

	it('returns true when response.json throws', async () => {
		const fetchImpl = vi.fn(
			async () =>
				({
					ok: true,
					json: async () => {
						throw new Error('invalid json');
					}
				}) as unknown as Response
		);
		const out = await ensureWasmMatchesDeployedBuildWithDeps(
			'abc',
			true,
			deps(fetchImpl as unknown as typeof fetch)
		);
		expect(out).toBe(true);
	});
});

describe('ensureWasmMatchesDeployedBuild', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('requests wasm-version.json when embedded SHA is configured', async () => {
		vi.stubEnv('VITE_WASM_SHA256', 'deadbeef');
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ sha256: 'deadbeef' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		);
		const out = await ensureWasmMatchesDeployedBuild();
		expect(out).toBe(true);
		expect(fetchSpy).toHaveBeenCalledWith('/wasm-version.json', { cache: 'no-store' });
	});
});
