import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { locale } from 'svelte-i18n';
import { syncDoc } from '$lib/docs-service';

function extractTitleFromSlug(slug: string): string {
	const cleanSlug = slug.split('/').pop() || slug;
	return cleanSlug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export const load = async ({ params, depends }) => {
	const { slug } = params;
	depends('app:locale');

	const cleanSlug = slug.endsWith('/') ? slug.slice(0, -1) : slug;
	const modules = import.meta.glob('../../../lib/docs/**/*.{mdx,md}');

	const currentLocale = (browser ? localStorage.getItem('locale') : null) || get(locale) || 'en';

	// Sync in background if online and browser
	if (browser && navigator.onLine) {
		syncDoc(cleanSlug, currentLocale).catch(console.error);
	}

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

		const metadata = {
			title: (doc.metadata?.title as string) || extractTitleFromSlug(cleanSlug),
			description:
				(doc.metadata?.description as string) ||
				(doc.metadata?.excerpt as string) ||
				`${extractTitleFromSlug(cleanSlug)} - Reticulum-Go Documentation`,
			...doc.metadata
		};

		return {
			content: doc.default,
			metadata
		};
	} catch (e) {
		console.error('Error loading doc:', e);
		throw error(500, 'Error loading documentation content');
	}
};
