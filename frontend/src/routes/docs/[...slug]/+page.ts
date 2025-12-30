import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { locale } from 'svelte-i18n';

export const load = async ({ params, depends }) => {
	const { slug } = params;
	depends('app:locale');

	const cleanSlug = slug.endsWith('/') ? slug.slice(0, -1) : slug;
	const modules = import.meta.glob('../../../lib/docs/**/*.{mdx,md}');

	const currentLocale = (browser ? localStorage.getItem('locale') : null) || get(locale) || 'en';

	let match: (() => Promise<unknown>) | undefined;

	// Try locale-specific then generic
	const paths = [
		`../../../lib/docs/${cleanSlug}.${currentLocale}.md`,
		`../../../lib/docs/${cleanSlug}.${currentLocale}.mdx`,
		`../../../lib/docs/${cleanSlug}.md`,
		`../../../lib/docs/${cleanSlug}.mdx`
	];

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
