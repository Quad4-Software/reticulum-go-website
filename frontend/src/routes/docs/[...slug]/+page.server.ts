import type { PageServerLoad } from './$types';
import {
	extractDocTitle,
	getCachedDocMarkdown,
	renderDocMarkdown
} from '$lib/server/docs-sync';

function cleanSlug(slug: string): string {
	return slug.endsWith('/') ? slug.slice(0, -1) : slug;
}

export const load: PageServerLoad = async ({ params }) => {
	const slug = cleanSlug(params.slug ?? '');
	const markdown = await getCachedDocMarkdown(slug);
	if (!markdown) {
		return {
			cachedHtml: null as string | null,
			cachedTitle: null as string | null
		};
	}

	const html = await renderDocMarkdown(markdown);
	return {
		cachedHtml: html,
		cachedTitle: extractDocTitle(markdown, slug)
	};
};
