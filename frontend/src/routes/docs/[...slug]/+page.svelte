<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { FileCode, FileType } from 'lucide-svelte';
	import { mount, tick, unmount } from 'svelte';
	import { exportDoc } from '$lib/docs-service';
	import { page } from '$app/state';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import DocMeta from '$lib/components/DocMeta.svelte';
	import { findDocMetaTable, parseDocMetaTable } from '$lib/doc-meta';
	import { getCanonicalUrl } from '$lib/seo';
	import { SITE_URL } from '$lib/site-config';

	let { data } = $props();

	const slug = $derived(page.params.slug ?? '');
	const pathname = $derived(page.url.pathname);

	const docTitle = $derived(
		(data.metadata?.title as string) ||
			slug
				.split('/')
				.pop()
				?.split('-')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ') ||
			'Documentation'
	);

	const docDescription = $derived(
		(data.metadata?.description as string) || `${docTitle} - Reticulum-Go Documentation`
	);

	const pageUrl = $derived(getCanonicalUrl(pathname));

	const breadcrumbItems = $derived([
		{ label: 'Home', href: '/' },
		{ label: 'Docs', href: '/docs' },
		{ label: docTitle }
	]);

	let proseEl: HTMLElement | undefined = $state();

	$effect(() => {
		void data.content;
		void $locale;

		let alive = true;
		let instance: ReturnType<typeof mount> | undefined;

		tick().then(() => {
			if (!alive || !proseEl || !data.content) return;

			const table = findDocMetaTable(proseEl);
			if (!table) return;

			const fields = parseDocMetaTable(table);
			if (fields.length === 0) return;

			const placeholder = document.createElement('div');
			placeholder.setAttribute('data-doc-meta-slot', '');
			table.replaceWith(placeholder);

			instance = mount(DocMeta, {
				target: placeholder,
				props: { fields }
			});

			if (!alive) {
				unmount(instance);
				instance = undefined;
			}
		});

		return () => {
			alive = false;
			if (instance) {
				unmount(instance);
				instance = undefined;
			}
		};
	});
</script>

<svelte:head>
	<title>{docTitle} | Reticulum-Go Documentation</title>
	<meta name="description" content={docDescription} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:title" content={`${docTitle} | Reticulum-Go Documentation`} />
	<meta property="og:description" content={docDescription} />
	<meta property="og:image" content={`${SITE_URL}/logo.svg`} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={pageUrl} />
	<meta property="twitter:title" content={`${docTitle} | Reticulum-Go Documentation`} />
	<meta property="twitter:description" content={docDescription} />
	<meta property="twitter:image" content={`${SITE_URL}/logo.svg`} />
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
		<Breadcrumbs items={breadcrumbItems} />
		<div
			class="flex items-center gap-1 p-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm self-start sm:self-auto shrink-0"
		>
			<span class="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
				{$t('common.export')}
			</span>
			<div class="flex gap-1">
				<button
					onclick={() => slug && exportDoc(slug, $locale || 'en', 'md')}
					class="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
				>
					<FileCode class="w-3 h-3" />
					{$t('common.export_md')}
				</button>
				<button
					onclick={() => slug && exportDoc(slug, $locale || 'en', 'txt')}
					class="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
				>
					<FileType class="w-3 h-3" />
					{$t('common.export_txt')}
				</button>
			</div>
		</div>
	</div>

	<div class="prose prose-zinc dark:prose-invert max-w-none" bind:this={proseEl}>
		{#if data.content}
			{#key `${$locale}-${data.content}`}
				<data.content />
			{/key}
		{/if}
	</div>
</div>
