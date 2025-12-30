<script lang="ts">
	import { page } from '$app/state';
	import { BookOpen, FileText, ChevronRight, Download } from 'lucide-svelte';
	import { t, locale } from 'svelte-i18n';
	import Search from '$lib/components/Search.svelte';
	import { downloadAllDocs, syncAllDocs, syncEverything } from '$lib/docs-service';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		if (navigator.onLine) {
			syncEverything().catch(console.error);
			syncAllDocs($locale || 'en').catch(console.error);
		}
	});

	const docs = [
		{
			title: 'Introduction',
			slug: 'introduction',
			icon: BookOpen
		},
		{
			title: 'Usage',
			slug: 'usage',
			icon: FileText
		}
	];
</script>

<div class="flex flex-col md:flex-row gap-8">
	<!-- Sidebar -->
	<aside class="w-full md:w-64 shrink-0">
		<nav class="sticky top-24 space-y-1">
			<div class="mb-6">
				<Search />
			</div>
			<p class="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
				{$t('common.docs')}
			</p>
			{#each docs as doc (doc.slug)}
				<a
					href="/docs/{doc.slug}"
					class="group flex items-center justify-between px-3 py-2 rounded-lg transition-colors {page
						.url.pathname === `/docs/${doc.slug}`
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'}"
				>
					<div class="flex items-center gap-3">
						<doc.icon class="w-4 h-4" />
						<span class="text-sm font-medium">{doc.title}</span>
					</div>
					{#if page.url.pathname === `/docs/${doc.slug}`}
						<ChevronRight class="w-3 h-3" />
					{/if}
				</a>
			{/each}

			<div class="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
				<button
					onclick={() => downloadAllDocs($locale || 'en')}
					class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors"
				>
					<Download class="w-4 h-4" />
					{$t('common.download_all')}
				</button>
			</div>
		</nav>
	</aside>

	<!-- Content -->
	<main class="flex-1 min-w-0">
		{@render children()}
	</main>
</div>
