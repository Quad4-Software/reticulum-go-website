import { browser } from '$app/environment';
import { saveDoc, getDoc, getAllDocsForLang, hasAnyDocs } from './db';

const rawModules = import.meta.glob('./docs/**/*.{md,mdx}', { query: '?raw', import: 'default' });

export async function syncDoc(slug: string, lang: string): Promise<string | null> {
	if (!browser) return null;

	const path = `./docs/${slug}${lang === 'en' ? '' : '.' + lang}.md`;
	const loader = rawModules[path] || rawModules[path + 'x'];

	if (loader) {
		try {
			const content = (await loader()) as string;
			await saveDoc({
				slug,
				lang,
				content,
				updatedAt: Date.now()
			});
			return content;
		} catch (e) {
			console.error(`Failed to sync doc ${slug} for lang ${lang}:`, e);
		}
	}
	return null;
}

export async function getDocContent(slug: string, lang: string): Promise<string | null> {
	if (!browser) return null;

	const cached = await getDoc(slug, lang);
	if (cached) {
		if (navigator.onLine) {
			syncDoc(slug, lang).catch(console.error);
		}
		return cached.content;
	}

	return await syncDoc(slug, lang);
}

export async function syncAllDocs(lang: string): Promise<void> {
	if (!browser) return;

	const slugs = new Set<string>();
	const prefix = './docs/';

	for (const path in rawModules) {
		if (!path.startsWith(prefix)) continue;

		let slug = path.slice(prefix.length);
		if (slug.endsWith('.mdx')) slug = slug.slice(0, -4);
		else if (slug.endsWith('.md')) slug = slug.slice(0, -3);

		const lastDotIndex = slug.lastIndexOf('.');
		if (lastDotIndex !== -1) {
			const suffix = slug.slice(lastDotIndex + 1);
			if (suffix.length === 2 && /^[a-z]+$/.test(suffix)) {
				slug = slug.slice(0, lastDotIndex);
			}
		}

		slugs.add(slug);
	}

	await Promise.all(Array.from(slugs).map((slug) => syncDoc(slug, lang)));
}

export async function syncEverything(): Promise<void> {
	if (!browser) return;

	const alreadyHasDocs = await hasAnyDocs();
	if (alreadyHasDocs) return;

	const syncs: Promise<string | null>[] = [];

	for (const path in rawModules) {
		const prefix = './docs/';
		if (!path.startsWith(prefix)) continue;

		let slug = path.slice(prefix.length);
		let lang = 'en';

		if (slug.endsWith('.mdx')) slug = slug.slice(0, -4);
		else if (slug.endsWith('.md')) slug = slug.slice(0, -3);

		const lastDotIndex = slug.lastIndexOf('.');
		if (lastDotIndex !== -1) {
			const suffix = slug.slice(lastDotIndex + 1);
			if (suffix.length === 2 && /^[a-z]+$/.test(suffix)) {
				lang = suffix;
				slug = slug.slice(0, lastDotIndex);
			}
		}

		syncs.push(syncDoc(slug, lang));
	}

	await Promise.all(syncs);
}

export async function exportDoc(slug: string, lang: string, format: 'md' | 'txt'): Promise<void> {
	const content = await getDocContent(slug, lang);
	if (!content) return;

	const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${slug}.${lang}.${format}`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export async function downloadAllDocs(lang: string): Promise<void> {
	const docs = await getAllDocsForLang(lang);
	if (docs.length === 0) {
		await syncAllDocs(lang);
	}

	const allDocs = await getAllDocsForLang(lang);
	if (allDocs.length === 0) return;

	const { default: JSZip } = await import('jszip');
	const zip = new JSZip();
	for (const doc of allDocs) {
		zip.file(`${doc.slug}.${lang}.md`, doc.content);
	}

	const content = await zip.generateAsync({ type: 'blob' });
	const url = URL.createObjectURL(content);
	const a = document.createElement('a');
	a.href = url;
	a.download = `docs-${lang}.zip`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
