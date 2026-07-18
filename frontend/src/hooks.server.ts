import type { ServerInit } from '@sveltejs/kit';
import { ensureSourceZip } from '$lib/server/source-zip';
import { ensureDocsSynced } from '$lib/server/docs-sync';

export const init: ServerInit = async () => {
	ensureSourceZip().catch((err) => {
		console.error('[source-zip] startup fetch failed', err);
	});
	ensureDocsSynced().catch((err) => {
		console.error('[docs-sync] startup fetch failed', err);
	});
};
