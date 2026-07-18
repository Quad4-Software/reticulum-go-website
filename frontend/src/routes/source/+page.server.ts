import type { PageServerLoad } from './$types';
import { getSourceZipMeta } from '$lib/server/source-zip';

export const load: PageServerLoad = async () => {
	const meta = await getSourceZipMeta();
	return {
		zipTag: meta?.tag ?? null,
		zipAvailable: Boolean(meta)
	};
};
