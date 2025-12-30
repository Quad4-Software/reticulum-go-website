import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { slug } = params;

	const cleanSlug = slug.endsWith('/') ? slug.slice(0, -1) : slug;
	const modules = import.meta.glob('../../../lib/docs/**/*.{svx,md}');

	let match: (() => Promise<unknown>) | undefined;

	// Try .md then .svx
	const paths = [`../../../lib/docs/${cleanSlug}.md`, `../../../lib/docs/${cleanSlug}.svx`];

	for (const path of paths) {
		const module = modules[path];
		if (module) {
			match = module as () => Promise<unknown>;
			break;
		}
	}

	if (!match) {
		throw error(404, 'Documentation not found');
	}

	try {
		const doc = (await match()) as {
			default: import('svelte').Component;
			metadata: Record<string, unknown>;
		};
		return {
			content: doc.default,
			metadata: doc.metadata
		};
	} catch (e) {
		console.error('Error loading doc:', e);
		throw error(500, 'Error loading documentation content');
	}
};
