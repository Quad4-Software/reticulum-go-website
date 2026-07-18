import { preloadCode, preloadData } from '$app/navigation';

const pending = new Set<string>();

function shouldSkip(href: string): boolean {
	if (!href.startsWith('/') || href.startsWith('//')) return true;
	if (href.startsWith('/set-locale') || href.startsWith('/set-theme')) return true;
	if (typeof navigator !== 'undefined' && 'connection' in navigator) {
		const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
			.connection;
		if (connection?.saveData) return true;
	}
	return false;
}

/**
 * Preload route code and data for a same-origin path.
 * Safe to call repeatedly from hover/focus handlers.
 */
export function schedulePreload(href: string): void {
	if (shouldSkip(href) || pending.has(href)) return;
	pending.add(href);
	try {
		void Promise.all([preloadCode(href), preloadData(href)])
			.catch(() => {})
			.finally(() => {
				pending.delete(href);
			});
	} catch {
		pending.delete(href);
	}
}

/** Primary destinations worth warming after first paint. */
export const PRIMARY_PRELOAD_PATHS = [
	'/docs',
	'/tools',
	'/apps',
	'/donate',
	'/contact',
	'/source',
	'/ren-browser'
] as const;

/** Warm primary routes when the browser is idle. */
export function preloadPrimaryRoutes(): void {
	const run = () => {
		for (const path of PRIMARY_PRELOAD_PATHS) {
			schedulePreload(path);
		}
	};
	if (typeof requestIdleCallback === 'function') {
		requestIdleCallback(run, { timeout: 2500 });
		return;
	}
	setTimeout(run, 400);
}
