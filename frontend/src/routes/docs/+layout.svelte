<script lang="ts">
	import { page } from '$app/state';
	import {
		BookOpen,
		FileText,
		Shield,
		Settings,
		Network,
		Link,
		Lock,
		GitCompare,
		Terminal,
		Code,
		Boxes,
		FlaskConical,
		ChevronRight,
		Download
	} from 'lucide-svelte';
	import { t, locale } from 'svelte-i18n';
	import Search from '$lib/components/Search.svelte';
	import { DOC_NAV } from '$lib/docs-config';
	import { downloadAllDocs, syncAllDocs, syncEverything } from '$lib/docs-service';
	import { onMount } from 'svelte';

	const DOC_ICONS: Record<string, typeof BookOpen> = {
		overview: BookOpen,
		'getting-started': FileText,
		examples: FlaskConical,
		architecture: Boxes,
		'package-map': Code,
		configuration: Settings,
		interfaces: Network,
		transport: Network,
		'identity-and-destinations': Lock,
		'links-channels-and-resources': Link,
		cryptography: Lock,
		'embedding-and-wasm': Code,
		'control-api': Terminal,
		compatibility: GitCompare,
		security: Shield,
		'development-and-testing': FlaskConical
	};

	let { children } = $props();

	onMount(() => {
		if (navigator.onLine) {
			syncEverything().catch(console.error);
			syncAllDocs($locale || 'en').catch(console.error);
		}
	});

	function isActive(slug: string): boolean {
		return page.url.pathname === `/docs/${slug}`;
	}
</script>

<div class="flex flex-col md:flex-row gap-8">
	<aside class="w-full md:w-64 shrink-0">
		<nav class="sticky top-24 space-y-1 max-h-[calc(100vh-7rem)] overflow-y-auto">
			<div class="mb-6">
				<Search />
			</div>
			<p class="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
				{$t('common.docs')}
			</p>
			{#each DOC_NAV as section, sectionIndex (sectionIndex)}
				{#if section.title}
					<p
						class="px-3 pt-4 pb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider {sectionIndex ===
						0
							? 'pt-0'
							: ''}"
					>
						{section.title}
					</p>
				{/if}
				{#each section.items as doc (doc.slug)}
					{@const Icon = DOC_ICONS[doc.slug] ?? FileText}
					<a
						href="/docs/{doc.slug}"
						class="group flex items-center justify-between px-3 py-2 rounded-lg transition-colors {isActive(
							doc.slug
						)
							? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
							: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'}"
					>
						<div class="flex items-center gap-3 min-w-0">
							<Icon class="w-4 h-4 shrink-0" />
							<span class="text-sm font-medium truncate">{doc.title}</span>
						</div>
						{#if isActive(doc.slug)}
							<ChevronRight class="w-3 h-3 shrink-0" />
						{/if}
					</a>
				{/each}
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

	<main class="flex-1 min-w-0">
		{@render children()}
	</main>
</div>
