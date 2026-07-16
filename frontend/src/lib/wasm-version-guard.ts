import { browser } from '$app/environment';
import { clearAllCaches } from './wasm-cache';

export const WASM_SKEW_KEY = 'reticulum-wasm-skew';

export type WasmVersionGuardDeps = {
	fetchImpl: typeof fetch;
	clearAllCachesImpl: () => Promise<void>;
	session: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
	reload: () => void;
};

/**
 * Testable core: compares the bundle-injected WASM SHA with `/wasm-version.json` from the server.
 * On mismatch, clears Cache Storage once and reloads so Workbox cannot keep a stale `reticulum-go.wasm`.
 */
export async function ensureWasmMatchesDeployedBuildWithDeps(
	embedded: string | undefined,
	isBrowser: boolean,
	deps: WasmVersionGuardDeps
): Promise<boolean> {
	if (!embedded || !isBrowser) return true;
	try {
		const r = await deps.fetchImpl('/wasm-version.json', { cache: 'no-store' });
		if (!r.ok) return true;
		const data = (await r.json()) as { sha256?: string };
		if (!data.sha256 || data.sha256 === embedded) {
			deps.session.removeItem(WASM_SKEW_KEY);
			return true;
		}
		if (deps.session.getItem(WASM_SKEW_KEY)) {
			console.warn(
				'reticulum-go.wasm does not match this app bundle; try a hard refresh or clear site data.'
			);
			return true;
		}
		await deps.clearAllCachesImpl();
		deps.session.setItem(WASM_SKEW_KEY, '1');
		deps.reload();
		return false;
	} catch {
		return true;
	}
}

export async function ensureWasmMatchesDeployedBuild(): Promise<boolean> {
	return ensureWasmMatchesDeployedBuildWithDeps(import.meta.env.VITE_WASM_SHA256, browser, {
		fetchImpl: fetch,
		clearAllCachesImpl: clearAllCaches,
		session: sessionStorage,
		reload: () => {
			window.location.reload();
		}
	});
}
